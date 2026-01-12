<?php

namespace Drupal\wormchat\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Controller for retrieving device token.
 */
class UserDeviceKeyController extends ControllerBase {

  /**
   * GET endpoint - Retrieve device token for authenticated user.
   */
  public function getToken() {
    $user = \Drupal::currentUser();

    // Only authenticated users can access their device key
    if ($user->isAnonymous()) {
      return new JsonResponse([
        'error' => 'You must be logged in',
      ], 401);
    }

    $device_token = \wormchat_get_device_token($user->id());

    if (empty($device_token)) {
      return new JsonResponse([
        'error' => 'Device token not configured for this user',
      ], 403);
    }

    return new JsonResponse([
      'deviceKey' => $device_token,
    ]);
  }
}
