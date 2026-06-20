import 'package:emoji_picker_flutter/emoji_picker_flutter.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Bottom sheet wrapping the emoji picker. Opens via [show] and calls
/// [onEmojiSelected] with the emoji character string when the user taps one.
class EmojiPickerSheet extends StatelessWidget {
  const EmojiPickerSheet({super.key, required this.onEmojiSelected});

  final void Function(String emoji) onEmojiSelected;

  static Future<void> show(
    BuildContext context,
    void Function(String emoji) onEmojiSelected,
  ) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => EmojiPickerSheet(onEmojiSelected: onEmojiSelected),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 300,
      child: EmojiPicker(
        onEmojiSelected: (_, emoji) => onEmojiSelected(emoji.emoji),
        config: const Config(
          height: 300,
          checkPlatformCompatibility: true,
          emojiViewConfig: EmojiViewConfig(
            columns: 8,
            emojiSizeMax: 28,
            backgroundColor: AppColors.surface,
          ),
          categoryViewConfig: CategoryViewConfig(
            initCategory: Category.SMILEYS,
            backgroundColor: AppColors.surface,
            indicatorColor: AppColors.primary,
            iconColor: AppColors.textSecondary,
            iconColorSelected: AppColors.primary,
          ),
          bottomActionBarConfig: BottomActionBarConfig(
            showSearchViewButton: true,
            backgroundColor: AppColors.surface,
            buttonColor: AppColors.primary,
          ),
          searchViewConfig: SearchViewConfig(
            backgroundColor: AppColors.surface,
            buttonIconColor: AppColors.primary,
          ),
        ),
      ),
    );
  }
}
