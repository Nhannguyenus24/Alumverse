import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// Full-screen, pinch-to-zoom viewer for a chat image attachment.
class ImageViewerPage extends StatelessWidget {
  const ImageViewerPage({super.key, required this.imageUrl, this.heroTag});

  final String imageUrl;
  final Object? heroTag;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: Center(
        child: InteractiveViewer(
          minScale: 1,
          maxScale: 5,
          child: Hero(
            tag: heroTag ?? imageUrl,
            child: CachedNetworkImage(
              imageUrl: imageUrl,
              fit: BoxFit.contain,
              placeholder:
                  (context, _) =>
                      const CircularProgressIndicator(color: Colors.white),
              errorWidget:
                  (context, _, __) => const Icon(
                    Icons.broken_image_outlined,
                    color: Colors.white54,
                    size: 48,
                  ),
            ),
          ),
        ),
      ),
    );
  }
}
