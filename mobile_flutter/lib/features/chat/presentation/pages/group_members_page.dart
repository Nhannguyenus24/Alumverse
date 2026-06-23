import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../network/data/models/connection.dart';
import '../../../network/data/repositories/network_repository.dart';
import '../../data/models/chat_group_member.dart';
import '../../data/repositories/chat_repository.dart';
import '../providers/chat_group_provider.dart';
import '../providers/chat_list_provider.dart';

class GroupMembersPage extends ConsumerWidget {
  const GroupMembersPage({
    super.key,
    required this.groupId,
    this.groupTitle,
  });

  final int groupId;
  final String? groupTitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(chatGroupMembersProvider(groupId));
    final currentMemberId = int.tryParse(
        ref.watch(authStateProvider).valueOrNull?.user?.id ?? '');

    return Scaffold(
      appBar: AppBar(
        title: Text(
          groupTitle != null
              ? 'chat.group_members_title'.tr(namedArgs: {'name': groupTitle!})
              : 'chat.members'.tr(),
        ),
      ),
      body: membersAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(chatGroupMembersProvider(groupId)),
        ),
        data: (members) {
          final currentMember = members.firstWhere(
            (m) => m.memberId == currentMemberId,
            orElse: () => const ChatGroupMember(
                memberId: -1, fullName: '', role: 'MEMBER'),
          );
          final isOwner = currentMember.isOwner;

          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.only(bottom: 16),
                  itemCount: members.length,
                  separatorBuilder: (_, __) => const Divider(
                    height: 1,
                    indent: 72,
                    color: AppColors.divider,
                  ),
                  itemBuilder: (context, i) {
                    final member = members[i];
                    final isSelf = member.memberId == currentMemberId;
                    return _MemberTile(
                      member: member,
                      isSelf: isSelf,
                      canRemove: isOwner && !isSelf && !member.isOwner,
                      onRemove: () =>
                          _confirmRemove(context, ref, member, members.length),
                    );
                  },
                ),
              ),
              // Add members (owner only, max 10 total)
              if (isOwner && members.length < 10)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: OutlinedButton.icon(
                    onPressed: () => _showAddMembersSheet(
                        context, ref, members, members.length),
                    icon: const Icon(Icons.person_add_outlined),
                    label: Text('chat.add_members'.tr()),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(44),
                    ),
                  ),
                ),
              // Leave group (everyone)
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: OutlinedButton.icon(
                    onPressed: () => _confirmLeave(context, ref),
                    icon: const Icon(Icons.exit_to_app_outlined,
                        color: AppColors.error),
                    label: Text(
                      'chat.leave_group'.tr(),
                      style: const TextStyle(color: AppColors.error),
                    ),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(44),
                      side: const BorderSide(color: AppColors.error),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _confirmRemove(
    BuildContext context,
    WidgetRef ref,
    ChatGroupMember member,
    int totalCount,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('chat.remove_member'.tr()),
        content: Text(
          'chat.remove_member_confirm'.tr(namedArgs: {'name': member.fullName}),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('common.cancel'.tr()),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              'common.delete'.tr(),
              style: const TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref
          .read(chatGroupMembersProvider(groupId).notifier)
          .removeMember(member.memberId);
      if (context.mounted) {
        AppToast.success(
          context,
          'chat.removed_member'.tr(namedArgs: {'name': member.fullName}),
        );
      }
    } catch (e) {
      if (context.mounted) AppToast.fromError(context, e);
    }
  }

  Future<void> _confirmLeave(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('chat.leave_group'.tr()),
        content: Text('chat.leave_group_confirm'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('common.cancel'.tr()),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              'chat.leave_group'.tr(),
              style: const TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(chatRepositoryProvider).leaveGroup(groupId);
      ref.invalidate(chatListProvider);
      if (context.mounted) {
        context.go(RouteNames.chat);
      }
    } catch (e) {
      if (context.mounted) AppToast.fromError(context, e);
    }
  }

  Future<void> _showAddMembersSheet(
    BuildContext context,
    WidgetRef ref,
    List<ChatGroupMember> currentMembers,
    int currentCount,
  ) async {
    final currentIds = currentMembers.map((m) => m.memberId).toSet();
    final maxAdd = 10 - currentCount;

    final added = await showModalBottomSheet<List<int>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _AddMembersSheet(
        alreadyIn: currentIds,
        maxSelect: maxAdd,
      ),
    );

    if (added == null || added.isEmpty) return;
    try {
      await ref
          .read(chatGroupMembersProvider(groupId).notifier)
          .addMembers(added);
      if (context.mounted) {
        AppToast.success(
          context,
          'chat.added_members'.tr(namedArgs: {'count': added.length.toString()}),
        );
      }
    } catch (e) {
      if (context.mounted) AppToast.fromError(context, e);
    }
  }
}

class _MemberTile extends StatelessWidget {
  const _MemberTile({
    required this.member,
    required this.isSelf,
    required this.canRemove,
    required this.onRemove,
  });

  final ChatGroupMember member;
  final bool isSelf;
  final bool canRemove;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final resolved = member.avatarUrl != null
        ? resolveImageUrl(member.avatarUrl!)
        : null;

    return ListTile(
      leading: CircleAvatar(
        radius: 22,
        backgroundImage:
            resolved != null ? CachedNetworkImageProvider(resolved) : null,
        backgroundColor: AppColors.primaryLight,
        child: resolved == null
            ? Text(
                member.fullName.isNotEmpty
                    ? member.fullName[0].toUpperCase()
                    : '?',
                style: const TextStyle(
                    color: AppColors.primary, fontWeight: FontWeight.bold),
              )
            : null,
      ),
      title: Text(
        isSelf
            ? '${member.fullName} (${'chat.you_label'.tr()})'
            : member.fullName,
      ),
      subtitle: member.isOwner
          ? Text(
              'chat.group_owner'.tr(),
              style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600),
            )
          : null,
      trailing: canRemove
          ? IconButton(
              icon: const Icon(Icons.remove_circle_outline,
                  color: AppColors.error),
              onPressed: onRemove,
            )
          : null,
    );
  }
}

/// Bottom sheet for adding members to an existing group.
class _AddMembersSheet extends ConsumerStatefulWidget {
  const _AddMembersSheet({
    required this.alreadyIn,
    required this.maxSelect,
  });

  final Set<int> alreadyIn;
  final int maxSelect;

  @override
  ConsumerState<_AddMembersSheet> createState() => _AddMembersSheetState();
}

class _AddMembersSheetState extends ConsumerState<_AddMembersSheet> {
  final _searchController = TextEditingController();
  List<Connection> _results = [];
  final Set<int> _selected = {};
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _search('');
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _search(String text) async {
    setState(() => _isSearching = true);
    try {
      final page = await ref
          .read(networkRepositoryProvider)
          .searchConnections(fullName: text.isEmpty ? null : text, size: 30);
      setState(() {
        _results = page.items
            .where((c) => !widget.alreadyIn.contains(c.peerMemberId))
            .toList();
      });
    } catch (_) {
      // Ignore
    } finally {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  void _toggle(Connection conn) {
    if (_selected.contains(conn.peerMemberId)) {
      setState(() => _selected.remove(conn.peerMemberId));
    } else {
      if (_selected.length >= widget.maxSelect) {
        AppToast.info(
          context,
          'chat.max_add_toast'.tr(namedArgs: {'max': widget.maxSelect.toString()}),
        );
        return;
      }
      setState(() => _selected.add(conn.peerMemberId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    return SizedBox(
      height: mq.size.height * 0.75,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'chat.add_members_title'.tr(namedArgs: {
                      'count': _selected.length.toString(),
                      'max': widget.maxSelect.toString(),
                    }),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                TextButton(
                  onPressed: _selected.isNotEmpty
                      ? () => Navigator.pop(context, _selected.toList())
                      : null,
                  child: Text('chat.add'.tr()),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _searchController,
              textInputAction: TextInputAction.search,
              onSubmitted: _search,
              decoration: InputDecoration(
                hintText: 'chat.search_connections'.tr(),
                prefixIcon: const Icon(Icons.search),
                isDense: true,
                filled: true,
                fillColor: AppColors.background,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: _isSearching
                ? const Center(child: CircularProgressIndicator())
                : _results.isEmpty
                    ? Center(
                        child: Text(
                          'chat.no_connections_to_add'.tr(),
                          style: const TextStyle(color: AppColors.textSecondary),
                        ),
                      )
                    : ListView.builder(
                        itemCount: _results.length,
                        itemBuilder: (context, i) {
                          final conn = _results[i];
                          final isSelected =
                              _selected.contains(conn.peerMemberId);
                          final resolved = conn.avatarUrl != null
                              ? resolveImageUrl(conn.avatarUrl!)
                              : null;
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundImage: resolved != null
                                  ? CachedNetworkImageProvider(resolved)
                                  : null,
                              backgroundColor: AppColors.primaryLight,
                              child: resolved == null
                                  ? Text(
                                      conn.fullName.isNotEmpty
                                          ? conn.fullName[0].toUpperCase()
                                          : '?',
                                      style: const TextStyle(
                                          color: AppColors.primary),
                                    )
                                  : null,
                            ),
                            title: Text(conn.fullName),
                            trailing: isSelected
                                ? const Icon(Icons.check_circle,
                                    color: AppColors.primary)
                                : const Icon(Icons.circle_outlined,
                                    color: AppColors.secondaryLighter),
                            onTap: () => _toggle(conn),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
