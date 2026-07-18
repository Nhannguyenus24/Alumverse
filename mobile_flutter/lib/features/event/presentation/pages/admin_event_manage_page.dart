import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../user/presentation/providers/user_providers.dart';
import '../../data/repositories/event_repository.dart';
import '../providers/event_provider.dart';

// ── Providers ──────────────────────────────────────────────────────────────

final _eventStatsProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, int>((ref, id) {
      return ref.read(eventRepositoryProvider).getEventStatistics(id);
    });

final _adminTicketsProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, _PaginatedQuery>((ref, q) {
      return ref
          .read(eventRepositoryProvider)
          .getAdminEventTickets(
            q.eventId,
            page: q.page,
            limit: q.limit,
            keyword: q.keyword,
            status: q.status,
          );
    });

final _adminInterestsProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, _PageQuery>((ref, q) {
      return ref
          .read(eventRepositoryProvider)
          .getAdminEventInterests(q.eventId, page: q.page, limit: q.limit);
    });

// ── Query key types ─────────────────────────────────────────────────────────

class _PaginatedQuery {
  final int eventId;
  final int page;
  final int limit;
  final String? keyword;
  final String? status;

  const _PaginatedQuery({
    required this.eventId,
    this.page = 0,
    this.limit = 20,
    this.keyword,
    this.status,
  });

  @override
  bool operator ==(Object other) =>
      other is _PaginatedQuery &&
      other.eventId == eventId &&
      other.page == page &&
      other.limit == limit &&
      other.keyword == keyword &&
      other.status == status;

  @override
  int get hashCode => Object.hash(eventId, page, limit, keyword, status);
}

class _PageQuery {
  final int eventId;
  final int page;
  final int limit;

  const _PageQuery({required this.eventId, this.page = 0, this.limit = 20});

  @override
  bool operator ==(Object other) =>
      other is _PageQuery &&
      other.eventId == eventId &&
      other.page == page &&
      other.limit == limit;

  @override
  int get hashCode => Object.hash(eventId, page, limit);
}

// ── Page ────────────────────────────────────────────────────────────────────

class AdminEventManagePage extends ConsumerStatefulWidget {
  const AdminEventManagePage({super.key, required this.eventId});

  final int eventId;

  @override
  ConsumerState<AdminEventManagePage> createState() =>
      _AdminEventManagePageState();
}

class _AdminEventManagePageState extends ConsumerState<AdminEventManagePage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  // Participants tab state
  int _ticketsPage = 0;
  final int _ticketsLimit = 20;
  final _keywordCtl = TextEditingController();
  String _keyword = '';
  String _ticketStatus = '';

  // Interests tab state
  int _interestsPage = 0;
  final int _interestsLimit = 20;

  bool _publishBusy = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _keywordCtl.dispose();
    super.dispose();
  }

  Future<void> _togglePublish(bool isPublished) async {
    if (_publishBusy) return;
    setState(() => _publishBusy = true);
    try {
      final repo = ref.read(eventRepositoryProvider);
      if (isPublished) {
        await repo.unpublishEvent(widget.eventId);
        if (mounted) AppToast.success(context, 'event.unpublish_success'.tr());
      } else {
        await repo.publishEvent(widget.eventId);
        if (mounted) AppToast.success(context, 'event.publish_success'.tr());
      }
      ref.invalidate(eventDetailProvider(widget.eventId));
    } catch (_) {
      if (mounted) AppToast.error(context, 'event.publish_failed'.tr());
    } finally {
      if (mounted) setState(() => _publishBusy = false);
    }
  }

  Future<void> _cancelTicket(String ticketCode) async {
    try {
      await ref.read(eventRepositoryProvider).adminCancelTicket(ticketCode);
      if (mounted) {
        AppToast.success(context, 'event.ticket_cancel_success'.tr());
      }
      // Invalidate tickets + stats to refresh counts
      ref.invalidate(_adminTicketsProvider(_currentTicketQuery));
      ref.invalidate(_eventStatsProvider(widget.eventId));
    } catch (_) {
      if (mounted) AppToast.error(context, 'event.ticket_cancel_error'.tr());
    }
  }

  _PaginatedQuery get _currentTicketQuery => _PaginatedQuery(
    eventId: widget.eventId,
    page: _ticketsPage,
    limit: _ticketsLimit,
    keyword: _keyword.isEmpty ? null : _keyword,
    status: _ticketStatus.isEmpty ? null : _ticketStatus,
  );

  @override
  Widget build(BuildContext context) {
    final isOrgManagerAsync = ref.watch(isOrgManagerProvider);
    final isOrgManager = isOrgManagerAsync.valueOrNull ?? false;
    if (isOrgManagerAsync.isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('event.manage_title'.tr())),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (!isOrgManager) {
      return Scaffold(
        appBar: AppBar(title: Text('event.manage_title'.tr())),
        body: EmptyView(
          icon: Icons.lock_outline,
          title: 'event.checkin_forbidden'.tr(),
          message: 'event.checkin_forbidden_desc'.tr(),
        ),
      );
    }

    final eventAsync = ref.watch(eventDetailProvider(widget.eventId));
    final statsAsync = ref.watch(_eventStatsProvider(widget.eventId));

    return Scaffold(
      appBar: AppBar(
        title: Text('event.manage_title'.tr()),
        actions: [
          if (eventAsync.valueOrNull != null)
            eventAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data:
                  (event) =>
                      _publishBusy
                          ? const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16),
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                          : TextButton.icon(
                            onPressed: () => _togglePublish(event.isPublished),
                            icon: Icon(
                              event.isPublished
                                  ? Icons.unpublished_outlined
                                  : Icons.publish_outlined,
                              size: 18,
                            ),
                            label: Text(
                              event.isPublished
                                  ? 'event.unpublish'.tr()
                                  : 'event.publish'.tr(),
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
            ),
          if (eventAsync.valueOrNull?.requiresCheckIn ?? false)
            IconButton(
              icon: const Icon(Icons.qr_code_scanner_outlined),
              tooltip: 'event.check_in'.tr(),
              onPressed:
                  () => context.push(
                    RouteNames.adminCheckInScanner(widget.eventId),
                    extra: eventAsync.valueOrNull?.title,
                  ),
            ),
        ],
      ),
      body: eventAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error:
            (_, __) => ErrorView(
              message: 'event.load_failed'.tr(),
              onRetry:
                  () => ref.invalidate(eventDetailProvider(widget.eventId)),
            ),
        data:
            (event) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Header: title + publish status
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          event.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color:
                              event.isPublished
                                  ? AppColors.success.withValues(alpha: 0.12)
                                  : AppColors.textSecondary.withValues(
                                    alpha: 0.12,
                                  ),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          event.isPublished
                              ? 'event.published'.tr()
                              : 'event.draft'.tr(),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color:
                                event.isPublished
                                    ? AppColors.success
                                    : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // ── Stats tiles
                statsAsync.when(
                  loading:
                      () => const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: LinearProgressIndicator(),
                      ),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (stats) => _StatsTiles(stats: stats),
                ),

                // ── Overview info box
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.divider),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'event.overview_section'.tr(),
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        if (event.location != null &&
                            event.location!.isNotEmpty)
                          _OverviewRow(
                            Icons.place_outlined,
                            'event.location'.tr(),
                            event.location!,
                          ),
                        if (event.startTime != null)
                          _OverviewRow(
                            Icons.schedule_outlined,
                            'event.time_label'.tr(),
                            _fmt(event.startTime),
                          ),
                        if (event.registrationStartAt != null ||
                            event.registrationEndAt != null)
                          _OverviewRow(
                            Icons.event_available_outlined,
                            'event.registration_window'.tr(),
                            '${_fmt(event.registrationStartAt)} – ${_fmt(event.registrationEndAt)}',
                          ),
                      ],
                    ),
                  ),
                ),

                // ── Tabs
                TabBar(
                  controller: _tabController,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.textSecondary,
                  indicatorColor: AppColors.primary,
                  tabs: [
                    Tab(text: 'event.stat_registered'.tr()),
                    Tab(text: 'event.stat_interested'.tr()),
                  ],
                ),

                // ── Tab content
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _ParticipantsTab(
                        eventId: widget.eventId,
                        page: _ticketsPage,
                        limit: _ticketsLimit,
                        keyword: _keyword,
                        status: _ticketStatus,
                        keywordCtl: _keywordCtl,
                        onKeywordChanged:
                            (v) => setState(() {
                              _keyword = v;
                              _ticketsPage = 0;
                            }),
                        onStatusChanged:
                            (v) => setState(() {
                              _ticketStatus = v;
                              _ticketsPage = 0;
                            }),
                        onPageChanged: (p) => setState(() => _ticketsPage = p),
                        onCancelTicket: _cancelTicket,
                      ),
                      _InterestsTab(
                        eventId: widget.eventId,
                        page: _interestsPage,
                        limit: _interestsLimit,
                        onPageChanged:
                            (p) => setState(() => _interestsPage = p),
                      ),
                    ],
                  ),
                ),
              ],
            ),
      ),
    );
  }

  String _fmt(DateTime? dt) {
    if (dt == null) return '—';
    return DateFormat('dd/MM/yyyy HH:mm').format(dt);
  }
}

// ── Stats tiles row ──────────────────────────────────────────────────────────

class _StatsTiles extends StatelessWidget {
  const _StatsTiles({required this.stats});

  final Map<String, dynamic> stats;

  @override
  Widget build(BuildContext context) {
    final tiles = [
      (
        'event.stat_registered'.tr(),
        stats['registeredCount'] ?? 0,
        Icons.confirmation_number_outlined,
      ),
      (
        'event.stat_checked_in'.tr(),
        stats['checkedInCount'] ?? 0,
        Icons.how_to_reg_outlined,
      ),
      (
        'event.stat_interested'.tr(),
        stats['interestedCount'] ?? 0,
        Icons.favorite_border_outlined,
      ),
      (
        'event.stat_capacity'.tr(),
        stats['maxCapacity'] ?? '—',
        Icons.groups_outlined,
      ),
      (
        'event.stat_available'.tr(),
        stats['availableSlots'] ?? '—',
        Icons.event_available_outlined,
      ),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children:
            tiles
                .map(
                  (t) => Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: _StatTile(label: t.$1, value: t.$2, icon: t.$3),
                  ),
                )
                .toList(),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final dynamic value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.divider),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: AppColors.primary),
          const SizedBox(height: 6),
          Text(
            '$value',
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ── Overview row ────────────────────────────────────────────────────────────

class _OverviewRow extends StatelessWidget {
  const _OverviewRow(this.icon, this.label, this.value);

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 15, color: AppColors.textSecondary),
          const SizedBox(width: 6),
          Text(
            '$label: ',
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Participants tab ─────────────────────────────────────────────────────────

class _ParticipantsTab extends ConsumerWidget {
  const _ParticipantsTab({
    required this.eventId,
    required this.page,
    required this.limit,
    required this.keyword,
    required this.status,
    required this.keywordCtl,
    required this.onKeywordChanged,
    required this.onStatusChanged,
    required this.onPageChanged,
    required this.onCancelTicket,
  });

  final int eventId;
  final int page;
  final int limit;
  final String keyword;
  final String status;
  final TextEditingController keywordCtl;
  final ValueChanged<String> onKeywordChanged;
  final ValueChanged<String> onStatusChanged;
  final ValueChanged<int> onPageChanged;
  final Future<void> Function(String ticketCode) onCancelTicket;

  static const _cancellableStatuses = {'ISSUED', 'ACTIVE', 'PENDING'};

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = _PaginatedQuery(
      eventId: eventId,
      page: page,
      limit: limit,
      keyword: keyword.isEmpty ? null : keyword,
      status: status.isEmpty ? null : status,
    );
    final async = ref.watch(_adminTicketsProvider(query));

    return Column(
      children: [
        // ── Filters
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: keywordCtl,
                  decoration: InputDecoration(
                    hintText: 'common.search'.tr(),
                    prefixIcon: const Icon(Icons.search, size: 20),
                    isDense: true,
                    border: const OutlineInputBorder(),
                    contentPadding: const EdgeInsets.symmetric(
                      vertical: 10,
                      horizontal: 12,
                    ),
                  ),
                  onChanged: onKeywordChanged,
                ),
              ),
              const SizedBox(width: 8),
              DropdownButton<String>(
                value: status.isEmpty ? '' : status,
                isDense: true,
                items: [
                  DropdownMenuItem(value: '', child: Text('common.all'.tr())),
                  const DropdownMenuItem(
                    value: 'ISSUED',
                    child: Text('ISSUED'),
                  ),
                  const DropdownMenuItem(
                    value: 'CHECKED_IN',
                    child: Text('CHECKED_IN'),
                  ),
                  const DropdownMenuItem(
                    value: 'CANCELLED',
                    child: Text('CANCELLED'),
                  ),
                  const DropdownMenuItem(
                    value: 'PENDING',
                    child: Text('PENDING'),
                  ),
                ],
                onChanged: (v) => onStatusChanged(v ?? ''),
              ),
            ],
          ),
        ),

        // ── List
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error:
                (_, __) => ErrorView(
                  message: 'event.manage_load_failed'.tr(),
                  onRetry: () => ref.invalidate(_adminTicketsProvider(query)),
                ),
            data: (data) {
              final items = (data['items'] ?? data['content'] ?? []) as List;
              final total =
                  (data['totalItem'] ?? data['totalElements'] ?? 0) as num;

              if (items.isEmpty) {
                return Center(
                  child: Text(
                    'event.tickets_empty'.tr(),
                    style: const TextStyle(color: AppColors.textSecondary),
                  ),
                );
              }

              return Column(
                children: [
                  Expanded(
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (_, i) {
                        final t = items[i] as Map;
                        final tStatus = t['status']?.toString() ?? '';
                        final cancellable = _cancellableStatuses.contains(
                          tStatus.toUpperCase(),
                        );
                        return _TicketRow(
                          ticket: t,
                          cancellable: cancellable,
                          onCancel: () {
                            final code = t['ticketCode']?.toString() ?? '';
                            if (code.isNotEmpty) onCancelTicket(code);
                          },
                        );
                      },
                    ),
                  ),
                  _PaginationRow(
                    page: page,
                    limit: limit,
                    total: total.toInt(),
                    onPageChanged: onPageChanged,
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }
}

class _TicketRow extends StatelessWidget {
  const _TicketRow({
    required this.ticket,
    required this.cancellable,
    required this.onCancel,
  });

  final Map ticket;
  final bool cancellable;
  final VoidCallback onCancel;

  Color _statusColor(String s) {
    switch (s.toUpperCase()) {
      case 'CHECKED_IN':
      case 'USED':
        return AppColors.success;
      case 'CANCELLED':
        return AppColors.error;
      case 'PENDING':
        return Colors.orange;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final code = ticket['ticketCode']?.toString() ?? '—';
    final tStatus = ticket['status']?.toString() ?? '';
    final memberId = ticket['memberId'];
    final guestEmail = ticket['guestEmail']?.toString();
    final guestName = ticket['guestName']?.toString();
    final registeredAt = _fmtDate(ticket['registeredAt']);
    final checkedInAt = _fmtDate(ticket['checkedInAt']);
    final attendee =
        guestName ?? guestEmail ?? (memberId != null ? '#$memberId' : '—');

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  code,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontFamily: 'monospace',
                  ),
                ),
                Text(
                  attendee,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (registeredAt != null)
                  Text(
                    '${'event.col_registered_at'.tr()}: $registeredAt',
                    style: const TextStyle(fontSize: 11),
                  ),
                if (checkedInAt != null)
                  Text(
                    '${'event.col_checked_in_at'.tr()}: $checkedInAt',
                    style: const TextStyle(fontSize: 11),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _statusColor(tStatus).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  tStatus,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: _statusColor(tStatus),
                  ),
                ),
              ),
              if (cancellable)
                IconButton(
                  icon: const Icon(
                    Icons.cancel_outlined,
                    size: 20,
                    color: AppColors.error,
                  ),
                  tooltip: 'event.tooltip_cancel_ticket'.tr(),
                  onPressed: onCancel,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
            ],
          ),
        ],
      ),
    );
  }

  String? _fmtDate(dynamic v) {
    if (v == null) return null;
    DateTime? dt;
    if (v is String) dt = DateTime.tryParse(v);
    if (dt == null) return null;
    return DateFormat('dd/MM/yyyy HH:mm').format(dt);
  }
}

// ── Interests tab ────────────────────────────────────────────────────────────

class _InterestsTab extends ConsumerWidget {
  const _InterestsTab({
    required this.eventId,
    required this.page,
    required this.limit,
    required this.onPageChanged,
  });

  final int eventId;
  final int page;
  final int limit;
  final ValueChanged<int> onPageChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = _PageQuery(eventId: eventId, page: page, limit: limit);
    final async = ref.watch(_adminInterestsProvider(query));

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error:
          (_, __) => ErrorView(
            message: 'event.manage_load_failed'.tr(),
            onRetry: () => ref.invalidate(_adminInterestsProvider(query)),
          ),
      data: (data) {
        final items = (data['items'] ?? data['content'] ?? []) as List;
        final total = (data['totalItem'] ?? data['totalElements'] ?? 0) as num;

        if (items.isEmpty) {
          return Center(
            child: Text(
              'event.interests_empty'.tr(),
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          );
        }

        return Column(
          children: [
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                itemCount: items.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (_, i) {
                  final item = items[i] as Map;
                  final memberId = item['memberId'];
                  final createdAt = item['createdAt']?.toString() ?? '';
                  DateTime? dt =
                      createdAt.isNotEmpty
                          ? DateTime.tryParse(createdAt)
                          : null;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.favorite_border_outlined,
                          size: 18,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            memberId != null ? '#$memberId' : '—',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        if (dt != null)
                          Text(
                            DateFormat('dd/MM/yyyy HH:mm').format(dt),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
            _PaginationRow(
              page: page,
              limit: limit,
              total: total.toInt(),
              onPageChanged: onPageChanged,
            ),
          ],
        );
      },
    );
  }
}

// ── Pagination row ───────────────────────────────────────────────────────────

class _PaginationRow extends StatelessWidget {
  const _PaginationRow({
    required this.page,
    required this.limit,
    required this.total,
    required this.onPageChanged,
  });

  final int page;
  final int limit;
  final int total;
  final ValueChanged<int> onPageChanged;

  @override
  Widget build(BuildContext context) {
    final totalPages = (total / limit).ceil();
    if (totalPages <= 1) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: page > 0 ? () => onPageChanged(page - 1) : null,
          ),
          Text('${page + 1} / $totalPages'),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed:
                page < totalPages - 1 ? () => onPageChanged(page + 1) : null,
          ),
        ],
      ),
    );
  }
}
