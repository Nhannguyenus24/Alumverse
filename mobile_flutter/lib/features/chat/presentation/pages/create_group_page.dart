import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../network/data/models/connection.dart';
import '../../../network/data/repositories/network_repository.dart';
import '../../data/models/chat_conversation.dart';
import '../../data/repositories/chat_repository.dart';
import '../providers/chat_list_provider.dart';
import 'chat_room_page.dart';

class CreateGroupPage extends ConsumerStatefulWidget {
  const CreateGroupPage({super.key});

  @override
  ConsumerState<CreateGroupPage> createState() => _CreateGroupPageState();
}

class _CreateGroupPageState extends ConsumerState<CreateGroupPage> {
  final _titleController = TextEditingController();
  final _searchController = TextEditingController();

  List<Connection> _searchResults = [];
  final Map<int, Connection> _selected = {};
  bool _isSearching = false;
  bool _isCreating = false;

  static const int _maxMembers = 9; // max 9 outside creator → total 10

  @override
  void initState() {
    super.initState();
    _doSearch('');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _doSearch(String text) async {
    setState(() => _isSearching = true);
    try {
      final result = await ref
          .read(networkRepositoryProvider)
          .searchConnections(fullName: text.isEmpty ? null : text, size: 30);
      setState(() => _searchResults = result.items);
    } catch (_) {
      // Ignore search errors silently
    } finally {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  void _toggleMember(Connection conn) {
    if (_selected.containsKey(conn.peerMemberId)) {
      setState(() => _selected.remove(conn.peerMemberId));
    } else {
      if (_selected.length >= _maxMembers) {
        AppToast.info(context, 'Tối đa $_maxMembers thành viên (tổng 10 cả bạn)');
        return;
      }
      setState(() => _selected[conn.peerMemberId] = conn);
    }
  }

  Future<void> _create() async {
    if (_selected.length < 2) {
      AppToast.info(context, 'Chọn ít nhất 2 người để tạo nhóm');
      return;
    }
    setState(() => _isCreating = true);
    try {
      final title = _titleController.text.trim();
      final ChatConversation group = await ref.read(chatRepositoryProvider).createGroup(
        title: title.isEmpty ? null : title,
        memberIds: _selected.keys.toList(),
      );
      ref.invalidate(chatListProvider);
      if (mounted) {
        context.pushReplacement(
          '${RouteNames.chat}/${group.id}',
          extra: ChatRoomArgs(
            groupId: group.id,
            type: 'GROUP',
            title: group.name,
          ),
        );
      }
    } catch (e) {
      if (mounted) AppToast.fromError(context, e);
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canCreate = _selected.length >= 2 && !_isCreating;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tạo nhóm chat'),
        actions: [
          TextButton(
            onPressed: canCreate ? _create : null,
            child: _isCreating
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Tạo'),
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _titleController,
              decoration: InputDecoration(
                hintText: 'Tên nhóm (tùy chọn)',
                prefixIcon: const Icon(Icons.group_outlined),
                filled: true,
                fillColor: AppColors.background,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          if (_selected.isNotEmpty) _buildSelectedChips(),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              textInputAction: TextInputAction.search,
              onSubmitted: _doSearch,
              onChanged: (v) {
                if (v.isEmpty) _doSearch('');
              },
              decoration: InputDecoration(
                hintText: 'Tìm kiên kết…',
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
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Đã chọn ${_selected.length}/$_maxMembers',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: _isSearching
                ? const Center(child: CircularProgressIndicator())
                : _searchResults.isEmpty
                    ? const Center(
                        child: Text(
                          'Không tìm thấy kết nối',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      )
                    : ListView.builder(
                        itemCount: _searchResults.length,
                        itemBuilder: (context, i) {
                          final conn = _searchResults[i];
                          final isSelected =
                              _selected.containsKey(conn.peerMemberId);
                          return _ConnectionTile(
                            connection: conn,
                            isSelected: isSelected,
                            onTap: () => _toggleMember(conn),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildSelectedChips() {
    return SizedBox(
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        children: [
          for (final conn in _selected.values)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Chip(
                avatar: _Avatar(url: conn.avatarUrl, name: conn.fullName),
                label: Text(
                  conn.fullName.split(' ').last,
                  style: const TextStyle(fontSize: 12),
                ),
                onDeleted: () => _toggleMember(conn),
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                padding: const EdgeInsets.symmetric(horizontal: 4),
              ),
            ),
        ],
      ),
    );
  }
}

class _ConnectionTile extends StatelessWidget {
  const _ConnectionTile({
    required this.connection,
    required this.isSelected,
    required this.onTap,
  });

  final Connection connection;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: _Avatar(url: connection.avatarUrl, name: connection.fullName),
      title: Text(connection.fullName),
      subtitle: connection.subtitle.isNotEmpty
          ? Text(
              connection.subtitle,
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            )
          : null,
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: AppColors.primary)
          : const Icon(Icons.circle_outlined, color: AppColors.secondaryLighter),
      onTap: onTap,
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({this.url, required this.name});

  final String? url;
  final String name;

  @override
  Widget build(BuildContext context) {
    final resolved = url != null ? resolveImageUrl(url!) : null;
    if (resolved != null) {
      return CircleAvatar(
        radius: 20,
        backgroundImage: CachedNetworkImageProvider(resolved),
        backgroundColor: AppColors.background,
      );
    }
    return CircleAvatar(
      radius: 20,
      backgroundColor: AppColors.primaryLight,
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: const TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
