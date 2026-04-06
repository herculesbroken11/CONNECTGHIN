import 'package:flutter/material.dart';
import 'package:connectghin/core/theme/app_colors.dart';
import 'package:connectghin/core/util/media_url.dart';
import 'package:connectghin/features/profile/domain/user_profile_models.dart';

/// Square profile photo area: default placeholder when [photo] is null.
class ProfilePhotoSlot extends StatelessWidget {
  const ProfilePhotoSlot({super.key, this.photo});

  final ProfilePhoto? photo;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: AspectRatio(
        aspectRatio: 1,
        child: photo == null
            ? ColoredBox(
                color: AppColors.surfaceContainer,
                child: Center(
                  child: Icon(
                    Icons.add_a_photo_outlined,
                    size: 56,
                    color: AppColors.outlineMuted,
                  ),
                ),
              )
            : Image.network(
                resolveMediaUrl(photo!.imageUrl),
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => ColoredBox(
                  color: AppColors.surfaceContainer,
                  child: Center(
                    child: Icon(
                      Icons.broken_image_outlined,
                      size: 48,
                      color: AppColors.outlineMuted,
                    ),
                  ),
                ),
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Center(
                    child: CircularProgressIndicator(
                      value: loadingProgress.expectedTotalBytes != null
                          ? loadingProgress.cumulativeBytesLoaded /
                              loadingProgress.expectedTotalBytes!
                          : null,
                    ),
                  );
                },
              ),
      ),
    );
  }
}
