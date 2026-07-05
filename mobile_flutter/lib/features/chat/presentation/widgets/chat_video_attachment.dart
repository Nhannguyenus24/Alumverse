import 'package:chewie/chewie.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';

import '../../../../core/theme/app_colors.dart';

/// A chat video attachment. Renders a poster (grey box + play icon — not a
/// real video frame) and only initializes the player on tap, so scrolling a
/// message list with many videos stays cheap. Falls back to an "open
/// externally" button if playback fails (e.g. webm on iOS, mov on Firefox-
/// class browsers via a WebView).
class ChatVideoAttachment extends StatefulWidget {
  const ChatVideoAttachment({super.key, required this.url, this.fileName});

  final String url;
  final String? fileName;

  @override
  State<ChatVideoAttachment> createState() => _ChatVideoAttachmentState();
}

class _ChatVideoAttachmentState extends State<ChatVideoAttachment> {
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  bool _isLoading = false;
  bool _failed = false;

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _play() async {
    setState(() => _isLoading = true);
    try {
      final controller = VideoPlayerController.networkUrl(
        Uri.parse(widget.url),
      );
      await controller.initialize();
      if (!mounted) {
        controller.dispose();
        return;
      }
      setState(() {
        _videoController = controller;
        _chewieController = ChewieController(
          videoPlayerController: controller,
          autoPlay: true,
          looping: false,
        );
        _isLoading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _failed = true;
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _openExternally() async {
    final uri = Uri.tryParse(widget.url);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    const width = 220.0;
    const height = 160.0;

    if (_failed) {
      return Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.videocam_off_outlined,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 6),
            Text(
              widget.fileName ?? 'chat.attachment_unavailable'.tr(),
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),
            TextButton.icon(
              onPressed: _openExternally,
              icon: const Icon(Icons.open_in_new, size: 16),
              label: Text(
                'chat.open_externally'.tr(),
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),
      );
    }

    if (_chewieController != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: SizedBox(
          width: width,
          height: height,
          child: Chewie(controller: _chewieController!),
        ),
      );
    }

    return GestureDetector(
      onTap: _isLoading ? null : _play,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.black87,
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.center,
        child:
            _isLoading
                ? const CircularProgressIndicator(color: Colors.white)
                : const Icon(
                  Icons.play_circle_fill,
                  color: Colors.white,
                  size: 48,
                ),
      ),
    );
  }
}
