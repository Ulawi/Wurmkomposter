<?php

namespace Drupal\wormchat\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\media\Entity\Media;

class FoodListController extends ControllerBase {

  public function list() {
    // Load all worm_food media entities
    $media_ids = \Drupal::entityQuery('media')
      ->condition('bundle', 'worm_food')
      ->accessCheck(FALSE)
      ->execute();

    $items = [];
    if ($media_ids) {
      $medias = Media::loadMultiple($media_ids);
      foreach ($medias as $media) {
        $img = $media->get('field_worm_food_image')->entity;
        $img_url = $img ? file_create_url($img->getFileUri()) : '';
        
        $metadata = $media->get('field_food_metadata')->value;
        $metadata_array = $metadata ? json_decode($metadata, TRUE) : [];

        $items[] = [
          'id' => $media->id(),
          'name' => $media->label(),
          'category' => $metadata_array['category'] ?? 'N/A',
          'moisture' => $metadata_array['moisture'] ?? 'N/A',
          'decomposition_speed' => $metadata_array['decomposition_speed'] ?? 'N/A',
          'image' => $img_url,
          'edit_url' => $media->toUrl('edit-form')->toString(),
          'delete_url' => $media->toUrl('delete-form')->toString(),
        ];
      }
    }

    return [
      '#theme' => 'wormchat_food_list',
      '#items' => $items,
      '#add_url' => \Drupal\Core\Url::fromRoute('wormchat.add_food')->toString(),
    ];
  }
}