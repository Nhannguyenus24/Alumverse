import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gal/gal.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/repositories/fundraising_repository.dart';
import '../providers/fundraising_provider.dart';

const _presetAmounts = <int>[100000, 200000, 500000, 1000000];

/// Donation form — native port of the web `DonationDetailPage`.
/// Pick an amount (preset or custom), donate anonymously or with details,
/// then receive a SePay QR to complete the bank transfer.
class FundraisingDonatePage extends ConsumerStatefulWidget {
  const FundraisingDonatePage({super.key, required this.fundId});

  final int fundId;

  @override
  ConsumerState<FundraisingDonatePage> createState() =>
      _FundraisingDonatePageState();
}

class _FundraisingDonatePageState extends ConsumerState<FundraisingDonatePage> {
  final _formKey = GlobalKey<FormState>();
  final _customController = TextEditingController();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _messageController = TextEditingController();

  int? _selectedPreset = _presetAmounts.first;
  bool _custom = false;
  bool _anonymous = false;
  bool _submitting = false;
  bool _prefilled = false;

  @override
  void dispose() {
    _customController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  int? get _amount {
    if (_custom) {
      return int.tryParse(_customController.text.replaceAll('.', '').trim());
    }
    return _selectedPreset;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final amount = _amount;
    if (amount == null || amount <= 0) {
      AppToast.error(context, 'donation.invalid_amount'.tr());
      return;
    }

    setState(() => _submitting = true);
    try {
      final rawId = ref.read(authStateProvider).valueOrNull?.user?.id;
      final memberId =
          (!_anonymous && rawId != null) ? int.tryParse(rawId) : null;

      final checkoutUrl = await ref
          .read(fundraisingRepositoryProvider)
          .createDonation(
            CreateDonationRequest(
              fundId: widget.fundId,
              donorMemberId: memberId,
              donorName: _anonymous ? null : _nameController.text.trim(),
              amount: amount,
              address: _anonymous ? null : _trimOrNull(_addressController),
              phone: _anonymous ? null : _trimOrNull(_phoneController),
              email: _anonymous ? null : _trimOrNull(_emailController),
              message: _trimOrNull(_messageController),
            ),
          );

      if (!mounted) return;
      if (checkoutUrl.isEmpty) {
        AppToast.error(context, 'donation.payment_link_failed'.tr());
        return;
      }
      await _showQrDialog(checkoutUrl);
      if (mounted) {
        ref.invalidate(fundDetailProvider(widget.fundId));
        ref.invalidate(myDonationsProvider);
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        AppToast.fromError(context, e, fallback: 'donation.donate_failed'.tr());
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String? _trimOrNull(TextEditingController c) {
    final t = c.text.trim();
    return t.isEmpty ? null : t;
  }

  Future<void> _showQrDialog(String url) {
    var downloading = false;
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder:
          (_) => StatefulBuilder(
            builder:
                (context, setLocalState) => AlertDialog(
                  title: Text('donation.qr_title'.tr()),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxHeight: 280),
                        child: CachedNetworkImage(
                          imageUrl: url,
                          fit: BoxFit.contain,
                          placeholder:
                              (_, __) => const SizedBox(
                                height: 200,
                                child: Center(
                                  child: CircularProgressIndicator(),
                                ),
                              ),
                          errorWidget:
                              (_, __, ___) => Column(
                                children: [
                                  Text(
                                    'donation.qr_load_failed'.tr(),
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 12),
                                  OutlinedButton.icon(
                                    onPressed:
                                        () => launchUrl(
                                          Uri.parse(url),
                                          mode: LaunchMode.externalApplication,
                                        ),
                                    icon: const Icon(Icons.open_in_new),
                                    label: Text('donation.qr_open_link'.tr()),
                                  ),
                                ],
                              ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'donation.qr_instruction'.tr(),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 12.5,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  actions: [
                    TextButton.icon(
                      onPressed:
                          downloading
                              ? null
                              : () async {
                                setLocalState(() => downloading = true);
                                await _downloadQr(url);
                                if (context.mounted) {
                                  setLocalState(() => downloading = false);
                                }
                              },
                      icon:
                          downloading
                              ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                              : const Icon(Icons.download_rounded),
                      label: Text('donation.qr_download'.tr()),
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: Text('donation.done'.tr()),
                    ),
                  ],
                ),
          ),
    );
  }

  /// Tải ảnh QR (network image từ SePay) về gallery của máy.
  Future<void> _downloadQr(String url) async {
    try {
      // Dio riêng, không dùng dioProvider để tránh base URL / auth interceptor
      // của backend chen vào request tới URL ảnh bên ngoài.
      final res = await Dio().get<List<int>>(
        url,
        options: Options(responseType: ResponseType.bytes),
      );
      final bytes = Uint8List.fromList(res.data ?? const <int>[]);
      if (bytes.isEmpty) throw Exception('empty image');
      await Gal.putImageBytes(bytes, name: 'qr_donation_${widget.fundId}');
      if (mounted) AppToast.success(context, 'donation.qr_saved'.tr());
    } catch (_) {
      if (mounted) AppToast.error(context, 'donation.qr_save_failed'.tr());
    }
  }

  @override
  Widget build(BuildContext context) {
    // Prefill name/email from the signed-in profile once.
    if (!_prefilled) {
      final user = ref.read(authStateProvider).valueOrNull?.user;
      if (user != null) {
        _nameController.text = user.fullName ?? '';
        _emailController.text = user.email;
      }
      _prefilled = true;
    }

    return Scaffold(
      appBar: AppBar(title: Text('donation.donate'.tr())),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('donation.anonymous'.tr()),
              subtitle: Text('donation.anonymous_desc'.tr()),
              value: _anonymous,
              onChanged: (v) => setState(() => _anonymous = v),
            ),
            const SizedBox(height: 12),
            _Label('donation.select_amount'.tr()),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final amount in _presetAmounts)
                  ChoiceChip(
                    label: Text(formatVnd(amount)),
                    selected: !_custom && _selectedPreset == amount,
                    onSelected:
                        (_) => setState(() {
                          _custom = false;
                          _selectedPreset = amount;
                        }),
                  ),
                ChoiceChip(
                  label: Text('donation.custom_amount'.tr()),
                  selected: _custom,
                  onSelected: (_) => setState(() => _custom = true),
                ),
              ],
            ),
            if (_custom) ...[
              const SizedBox(height: 12),
              TextFormField(
                controller: _customController,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(
                  labelText: 'donation.amount_vnd'.tr(),
                  suffixText: '₫',
                  border: const OutlineInputBorder(),
                ),
                validator: (v) {
                  if (!_custom) return null;
                  final n = int.tryParse((v ?? '').trim());
                  if (n == null || n <= 0) {
                    return 'donation.invalid_amount_field'.tr();
                  }
                  return null;
                },
              ),
            ],
            const SizedBox(height: 20),
            if (!_anonymous) ...[
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                maxLength: 50,
                decoration: InputDecoration(
                  labelText: 'donation.full_name_required'.tr(),
                  border: const OutlineInputBorder(),
                ),
                validator: (v) {
                  if (_anonymous) return null;
                  if ((v ?? '').trim().isEmpty) {
                    return 'donation.full_name_error'.tr();
                  }
                  return null;
                },
              ),
              TextFormField(
                controller: _emailController,
                maxLength: 255,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: 'profile.email'.tr(),
                  border: const OutlineInputBorder(),
                ),
                validator: (v) {
                  final t = (v ?? '').trim();
                  if (t.isEmpty) return null;
                  final ok = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(t);
                  return ok ? null : 'donation.email_invalid'.tr();
                },
              ),
              TextFormField(
                controller: _phoneController,
                maxLength: 50,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'donation.phone'.tr(),
                  border: const OutlineInputBorder(),
                ),
              ),
              TextFormField(
                controller: _addressController,
                maxLength: 500,
                decoration: InputDecoration(
                  labelText: 'donation.address'.tr(),
                  border: const OutlineInputBorder(),
                ),
              ),
            ],
            const SizedBox(height: 8),
            TextFormField(
              controller: _messageController,
              maxLength: 100,
              maxLines: 2,
              decoration: InputDecoration(
                labelText: 'donation.message'.tr(),
                helperText: 'donation.message_optional'.tr(),
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child:
                    _submitting
                        ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                        : Text(
                          'donation.proceed_payment'.tr(),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
    );
  }
}
