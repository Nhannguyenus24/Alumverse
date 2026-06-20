import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../data/models/user_profile.dart';
import '../providers/user_providers.dart';

/// My profile (view) — native port of the web `MyProfilePage`. Shows avatar,
/// name, student id, email, bio and basic info. "Chỉnh sửa" opens the edit page.
class MyProfilePage extends ConsumerWidget {
  const MyProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hồ sơ của tôi'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Chỉnh sửa',
            onPressed: () => context.push(RouteNames.profileEdit),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(myProfileProvider);
          await ref.read(myProfileProvider.future);
        },
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => ErrorView(
            message: 'Không tải được hồ sơ',
            onRetry: () => ref.invalidate(myProfileProvider),
          ),
          data: (p) => _ProfileView(profile: p),
        ),
      ),
    );
  }
}

class _ProfileView extends StatelessWidget {
  const _ProfileView({required this.profile});

  final UserProfile profile;

  @override
  Widget build(BuildContext context) {
    final avatar = resolveImageUrl(profile.avatarUrl);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(
          child: Column(
            children: [
              CircleAvatar(
                radius: 48,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                backgroundImage:
                    avatar != null ? CachedNetworkImageProvider(avatar) : null,
                child: avatar == null
                    ? const Icon(Icons.person, size: 52, color: AppColors.primary)
                    : null,
              ),
              const SizedBox(height: 12),
              Text(
                profile.fullName ?? 'Chưa cập nhật',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              if (profile.studentId != null && profile.studentId!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    'MSSV: ${profile.studentId}',
                    style: const TextStyle(color: AppColors.textSecondary),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        if (profile.bio != null && profile.bio!.isNotEmpty) ...[
          const _SectionTitle('Giới thiệu'),
          Text(profile.bio!, style: const TextStyle(height: 1.6)),
          const SizedBox(height: 20),
        ],
        const _SectionTitle('Thông tin cơ bản'),
        _InfoRow(icon: Icons.email_outlined, label: 'Email', value: profile.email),
        if (profile.phone != null && profile.phone!.isNotEmpty)
          _InfoRow(
              icon: Icons.phone_outlined,
              label: 'Số điện thoại',
              value: profile.phone!),
        if (profile.gender != null && profile.gender!.isNotEmpty)
          _InfoRow(
              icon: Icons.wc_outlined,
              label: 'Giới tính',
              value: _genderLabel(profile.gender!)),
        if (profile.dob != null && profile.dob!.isNotEmpty)
          _InfoRow(
              icon: Icons.cake_outlined,
              label: 'Ngày sinh',
              value: profile.dob!),
        const SizedBox(height: 20),
        const _SectionTitle('Hoạt động'),
        _ActivityTile(
          icon: Icons.confirmation_number_outlined,
          title: 'Vé của tôi',
          onTap: () => context.push(RouteNames.myTickets),
        ),
        const SizedBox(height: 10),
        _ActivityTile(
          icon: Icons.volunteer_activism_outlined,
          title: 'Lịch sử đóng góp',
          onTap: () => context.push(RouteNames.fundraisingMyDonations),
        ),
      ],
    );
  }

  String _genderLabel(String g) {
    switch (g.toLowerCase()) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      default:
        return 'Khác';
    }
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppColors.primary,
        ),
      ),
    );
  }
}

class _ActivityTile extends StatelessWidget {
  const _ActivityTile(
      {required this.icon, required this.title, required this.onTap});

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.divider),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(title),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: AppColors.textSecondary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 15)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
