<?php

namespace Drupal\wormchat\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\media\Entity\Media;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a 'Worm Feeding Block'.
 *
 * @Block(
 *   id = "worm_feeding_block",
 *   admin_label = @Translation("Worm Feeding Block")
 * )
 */
class WormFeedingBlock extends BlockBase implements ContainerFactoryPluginInterface {

  protected $fileUrlGenerator;

  public function __construct(array $configuration, $plugin_id, $plugin_definition, FileUrlGeneratorInterface $file_url_generator) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->fileUrlGenerator = $file_url_generator;
  }

  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('file_url_generator')
    );
  }

  public function build() {

    // Load all media entities of type "worm_food"
    $media_ids = \Drupal::entityQuery('media')
      ->condition('bundle', 'worm_food')
      ->accessCheck(FALSE)
      ->execute();

    $items = [];
    $loaded_names = []; // Track which foods have been loaded from media
    
    if ($media_ids) {
      $medias = Media::loadMultiple($media_ids);
      foreach ($medias as $media) {
        // Check if field exists before accessing
        if (!$media->hasField('field_worm_food_image')) {
          continue;
        }
        
        $img = $media->get('field_worm_food_image')->entity;
        if (!$img) {
          continue;
        }
        
        // Get food name from media label
        $food_name = $media->label();
        $loaded_names[] = strtolower($food_name);
        
        // Try to load color from JSON file
        $color = $this->loadColorFromJson($food_name);
        
        $items[] = [
          'id' => $media->id(),
          'name' => $food_name,
          'src' => $this->fileUrlGenerator->generateAbsoluteString($img->getFileUri()),
          'color' => $color ?? 'gray', // Default to gray if no color found
        ];
      }
    }

    // FALLBACK: Load foods from JSON files that don't have media entities
    // This ensures all foods with color attributes are displayed
    $json_foods = $this->loadAllFoodsFromJson();
    foreach ($json_foods as $food_name => $food_data) {
      if (!in_array(strtolower($food_name), $loaded_names)) {
        // Use the 'id' from JSON for image path, not derived from name
        $food_id = $food_data['id'] ?? strtolower(str_replace(' ', '_', $food_name));
        $default_src = '/modules/custom/wormchat/assets/foods/' . $food_id . '.jpg';
        
        $items[] = [
          'id' => 'json_' . $food_id,
          'name' => $food_name,
          'src' => $default_src,
          'color' => $food_data['color'],
        ];
      }
    }

    return [
      '#theme' => 'worm_feeding_block',
      '#foods' => $items,
      '#attached' => [
        'library' => [
          'wormchat/wormFeeding',
        ],
      ],
    ];
  }

  /**
   * Load all food names and colors from JSON files.
   *
   * @return array
   *   Associative array of food_name => color
   */
  private function loadAllFoodsFromJson() {
    $foods = [];
    
    // Get the module path
    $module_path = \Drupal::service('extension.list.module')->getPath('wormchat');
    $json_dir = $module_path . '/assets/foods';

    if (!is_dir($json_dir)) {
      return $foods;
    }

    // Load all JSON files
    $json_files = glob($json_dir . '/*.json');
    foreach ($json_files as $file) {
      if (is_file($file)) {
        $json_data = json_decode(file_get_contents($file), TRUE);
        
        if ($json_data && isset($json_data['name']) && isset($json_data['color'])) {
          // Store the full data including id for image path lookup
          $foods[$json_data['name']] = [
            'color' => $json_data['color'],
            'id' => $json_data['id'] ?? null,
          ];
        }
      }
    }

    return $foods;
  }

  /**
   * Load color attribute from JSON food files.
   *
   * @param string $food_name
   *   The food name (label) to search for.
   *
   * @return string|null
   *   The color value if found, NULL otherwise.
   */
  private function loadColorFromJson($food_name) {
    // Get the module path
    $module_path = \Drupal::service('extension.list.module')->getPath('wormchat');
    $json_dir = $module_path . '/assets/foods';

    if (!is_dir($json_dir)) {
      return NULL;
    }

    // Search all JSON files in the foods directory
    $json_files = glob($json_dir . '/*.json');
    foreach ($json_files as $file) {
      if (is_file($file)) {
        $json_data = json_decode(file_get_contents($file), TRUE);
        
        // Match by name (case-insensitive)
        if ($json_data && isset($json_data['name']) && strtolower($json_data['name']) === strtolower($food_name)) {
          return $json_data['color'] ?? NULL;
        }
      }
    }

    return NULL;
  }
}
