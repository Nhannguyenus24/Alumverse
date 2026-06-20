import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import 'network_blocked_tab.dart';
import 'network_connections_tab.dart';
import 'network_requests_tab.dart';
import 'network_search_tab.dart';

/// Main Network screen with 4 tabs:
/// Tìm kiếm · Yêu cầu · Kết nối · Đã chặn
class NetworkPage extends StatelessWidget {
  const NetworkPage({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Kết nối'),
          bottom: TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.primary,
            indicatorWeight: 3,
            tabs: const [
              Tab(text: 'Tìm kiếm'),
              Tab(text: 'Yêu cầu'),
              Tab(text: 'Kết nối'),
              Tab(text: 'Đã chặn'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            NetworkSearchTab(),
            NetworkRequestsTab(),
            NetworkConnectionsTab(),
            NetworkBlockedTab(),
          ],
        ),
      ),
    );
  }
}
