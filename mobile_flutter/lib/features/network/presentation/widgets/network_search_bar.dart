import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';

/// Reusable search bar for Network tabs. Fires [onSubmit] on text submit /
/// clear. Optionally shows two extra filter fields (program & major).
class NetworkSearchBar extends StatefulWidget {
  const NetworkSearchBar({
    super.key,
    required this.hintText,
    required this.onSubmit,
    this.initialValue = '',
    this.showFilters = false,
    this.programValue = '',
    this.majorValue = '',
    this.onProgramSubmit,
    this.onMajorSubmit,
  });

  final String hintText;
  final String initialValue;
  final ValueChanged<String> onSubmit;

  final bool showFilters;
  final String programValue;
  final String majorValue;
  final ValueChanged<String>? onProgramSubmit;
  final ValueChanged<String>? onMajorSubmit;

  @override
  State<NetworkSearchBar> createState() => _NetworkSearchBarState();
}

class _NetworkSearchBarState extends State<NetworkSearchBar> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _programCtrl;
  late final TextEditingController _majorCtrl;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.initialValue);
    _programCtrl = TextEditingController(text: widget.programValue);
    _majorCtrl = TextEditingController(text: widget.majorValue);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _programCtrl.dispose();
    _majorCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      child: Column(
        children: [
          _buildField(
            controller: _nameCtrl,
            hint: widget.hintText,
            prefixIcon: Icons.search,
            onSubmit: widget.onSubmit,
          ),
          if (widget.showFilters) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _buildField(
                    controller: _programCtrl,
                    hint: 'network.program_filter_hint'.tr(),
                    prefixIcon: Icons.school_outlined,
                    onSubmit: widget.onProgramSubmit ?? (_) {},
                    dense: true,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildField(
                    controller: _majorCtrl,
                    hint: 'network.major_filter_hint'.tr(),
                    prefixIcon: Icons.book_outlined,
                    onSubmit: widget.onMajorSubmit ?? (_) {},
                    dense: true,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String hint,
    required IconData prefixIcon,
    required ValueChanged<String> onSubmit,
    bool dense = false,
  }) {
    return TextField(
      controller: controller,
      textInputAction: TextInputAction.search,
      style: TextStyle(fontSize: dense ? 13 : 14),
      onSubmitted: onSubmit,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textSecondary),
        prefixIcon: Icon(prefixIcon,
            size: dense ? 18 : 20, color: AppColors.textSecondary),
        suffixIcon: controller.text.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.clear,
                    size: 18, color: AppColors.textSecondary),
                onPressed: () {
                  controller.clear();
                  onSubmit('');
                },
              )
            : null,
        contentPadding: EdgeInsets.symmetric(
          horizontal: 12,
          vertical: dense ? 8 : 12,
        ),
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
        isDense: dense,
      ),
    );
  }
}
