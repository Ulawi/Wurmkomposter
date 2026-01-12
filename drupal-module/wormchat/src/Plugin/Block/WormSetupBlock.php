<?php

namespace Drupal\wormchat\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\KeyValueStore\KeyValueFactoryInterface;
use Drupal\Core\Path\PathMatcherInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a 'Worm Setup Block' block.
 *
 * @Block(
 *   id = "worm_setup_block",
 *   admin_label = @Translation("Worm Setup Block"),
 *   category = @Translation("Wormchat"),
 * )
 */
class WormSetupBlock extends BlockBase implements ContainerFactoryPluginInterface {

  /**
   * The KeyValue store.
   *
   * @var \Drupal\Core\KeyValueStore\KeyValueStoreInterface
   */
  protected $keyValue;

  /**
   * The path matcher service.
   *
   * @var \Drupal\Core\Path\PathMatcherInterface
   */
  protected $pathMatcher;

  /**
   * Constructs a new WormSetupBlock instance.
   *
   * @param array $configuration
   *   The plugin configuration.
   * @param string $plugin_id
   *   The plugin ID.
   * @param mixed $plugin_definition
   *   The plugin definition.
   * @param \Drupal\Core\KeyValueStore\KeyValueFactoryInterface $key_value_factory
   *   The key-value factory service.
   * @param \Drupal\Core\Path\PathMatcherInterface $path_matcher
   *   The path matcher service.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, KeyValueFactoryInterface $key_value_factory, PathMatcherInterface $path_matcher) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->keyValue = $key_value_factory->get('wormchat_device_tokens');
    $this->pathMatcher = $path_matcher;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('keyvalue'),
      $container->get('path.matcher')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function build() {
    // Check if device is already provisioned
    $has_token = $this->keyValue->has('device_token');

    // Get base path for manifest
    $base_path = base_path();

    return [
      '#theme' => 'worm_setup_page',
      '#has_token' => $has_token,
      '#base_path' => $base_path,
      '#attached' => [
        'library' => [
          'wormchat/setup',
          'wormchat/wormSetup',
        ],
        'drupalSettings' => [
          'wormchat' => [
            'setupApiUrl' => '/api/wormchat/device-provision',
          ],
        ],
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheContexts() {
    return ['user'];
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheTags() {
    return ['wormchat:device_tokens'];
  }

}
