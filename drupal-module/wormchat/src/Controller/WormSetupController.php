<?php

namespace Drupal\wormchat\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Block\BlockManagerInterface;
use Drupal\Core\Plugin\Context\ContextRepositoryInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Setup controller for device provisioning and firmware flashing.
 */
class WormSetupController extends ControllerBase {

  /**
   * The block manager.
   *
   * @var \Drupal\Core\Block\BlockManagerInterface
   */
  protected $blockManager;

  /**
   * The context repository.
   *
   * @var \Drupal\Core\Plugin\Context\ContextRepositoryInterface
   */
  protected $contextRepository;

  /**
   * Constructs a WormSetupController.
   *
   * @param \Drupal\Core\Block\BlockManagerInterface $block_manager
   *   The block manager.
   * @param \Drupal\Core\Plugin\Context\ContextRepositoryInterface $context_repository
   *   The context repository.
   */
  public function __construct(BlockManagerInterface $block_manager, ContextRepositoryInterface $context_repository) {
    $this->blockManager = $block_manager;
    $this->contextRepository = $context_repository;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('plugin.manager.block'),
      $container->get('context.repository')
    );
  }

  /**
   * Displays the device setup page with ESP Web Tools integration.
   */
  public function setupPage() {
    $user = \Drupal::currentUser();

    // Redirect if not logged in (shouldn't happen due to routing requirement, but safety check)
    if ($user->isAnonymous()) {
      return [
        '#markup' => '<p>' . $this->t('Please log in to access device setup.') . '</p>',
      ];
    }

    // Render the setup block
    try {
      $block_plugin = $this->blockManager->createInstance('worm_setup_block');
      $build = $block_plugin->build();
    } catch (\Exception $e) {
      $build = [
        '#markup' => '<p>' . $this->t('Unable to load device setup.') . '</p>',
      ];
    }

    return $build;
  }

  /**
   * API endpoint to receive provisioning token from ESP32.
   *
   * Expected POST body:
   * {
   *   "token": "access_token_from_thingsboard"
   * }
   */
  public function provisionDevice(Request $request) {
    $user = \Drupal::currentUser();

    // Check if user is authenticated
    if ($user->isAnonymous()) {
      return new JsonResponse(
        ['error' => $this->t('Unauthorized - please log in')],
        401
      );
    }

    // Get the JSON payload
    try {
      $data = json_decode($request->getContent(), TRUE);
    } catch (\Exception $e) {
      \Drupal::logger('wormchat')->error('Invalid JSON in provisioning request: @error', ['@error' => $e->getMessage()]);
      return new JsonResponse(
        ['error' => $this->t('Invalid request format')],
        400
      );
    }

    // Validate token exists
    if (empty($data['token'])) {
      \Drupal::logger('wormchat')->warning('Provisioning request missing token');
      return new JsonResponse(
        ['error' => $this->t('Token is required')],
        400
      );
    }

    $token = trim($data['token']);

    // Store token in secure key-value store
    try {
      if (\wormchat_set_device_token($user->id(), $token)) {
        \Drupal::logger('wormchat')->info(
          'Device provisioned for user @uid',
          ['@uid' => $user->id()]
        );

        return new JsonResponse(
          [
            'success' => TRUE,
            'message' => $this->t('Device provisioned successfully!'),
            'user_id' => $user->id(),
          ],
          200
        );
      } else {
        \Drupal::logger('wormchat')->error(
          'Failed to store device token for user @uid',
          ['@uid' => $user->id()]
        );
        return new JsonResponse(
          ['error' => $this->t('Failed to store device token')],
          500
        );
      }
    } catch (\Exception $e) {
      \Drupal::logger('wormchat')->error(
        'Error provisioning device: @error',
        ['@error' => $e->getMessage()]
      );
      return new JsonResponse(
        ['error' => $this->t('Failed to provision device: @message', ['@message' => $e->getMessage()])],
        500
      );
    }
  }

}
