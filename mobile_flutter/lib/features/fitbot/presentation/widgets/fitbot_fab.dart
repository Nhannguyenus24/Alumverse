import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import 'fitbot_chat_window.dart';

/// Floating FitBot launcher. Tap to open/close an anchored chat window that
/// floats above the page (mirrors the web `FitBot` avatar + chat window). Meant
/// to be stacked above the messaging FAB in the app shell.
class FitBotFab extends StatefulWidget {
  const FitBotFab({super.key});

  @override
  State<FitBotFab> createState() => _FitBotFabState();
}

class _FitBotFabState extends State<FitBotFab>
    with SingleTickerProviderStateMixin {
  bool _open = false;
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 500),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  void _toggle() => setState(() => _open = !_open);

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (_open)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: 360,
                maxHeight: MediaQuery.of(context).size.height * 0.62,
              ),
              child: FitBotChatWindow(onClose: _toggle),
            ),
          ),
        ScaleTransition(
          scale: _open
              ? const AlwaysStoppedAnimation(1.0)
              : Tween(begin: 1.0, end: 1.2).animate(_pulse),
          child: _open
              ? FloatingActionButton(
                  heroTag: 'fitbot-fab',
                  onPressed: _toggle,
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.primary,
                  tooltip: 'common.close'.tr(),
                  child: const Icon(Icons.close),
                )
              : GestureDetector(
                  onTap: _toggle,
                  child: SizedBox(
                    width: 60,
                    height: 60,
                    child: Image.asset(
                      'assets/fitbot/FITBOT.png',
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
        ),
      ],
    );
  }
}
