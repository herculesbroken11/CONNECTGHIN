import 'package:flutter/material.dart';
import 'package:connectghin/core/util/media_url.dart';
import 'package:connectghin/features/profile/domain/user_profile_models.dart';

/// Square profile photo area: default placeholder when [photo] is null.
class ProfilePhotoSlot extends StatelessWidget {
  const ProfilePhotoSlot({super.key, this.photo});

  final ProfilePhoto? photo;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: AspectRatio(
        aspectRatio: 1,
        child: photo == null
            ? ColoredBox(
                color: cs.surfaceContainerHighest,
                child: Center(
                  child: Icon(
                    Icons.person_outline,
                    size: 72,
                    color: cs.outline,
                  ),
                ),
              )
            : Image.network(
                resolveMediaUrl(photo!.imageUrl),
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => ColoredBox(
                  color: cs.surfaceContainerHighest,
                  child: Center(
                    child: Icon(
                      Icons.broken_image_outlined,
                      size: 48,
                      color: cs.outline,
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
