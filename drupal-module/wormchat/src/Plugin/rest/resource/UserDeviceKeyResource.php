<?php

namespace Drupal\wormchat\Plugin\rest\resource;

use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Provides a resource for fetching the current user's device key securely.
 *
 * @RestResource(
 *   id = "user_device_key",
 *   label = @Translation("User Device Key"),
 *   uri_paths = {
 *     "canonical" = "/api/v1/user/device-key"
 *   }
 * )
 */
class UserDeviceKeyResource extends ResourceBase {

  /**
   * Responds to GET requests.
   */
  public function get() {
    $user = \Drupal::currentUser();

    // Only authenticated users can access their device key
    if ($user->isAnonymous()) {
      throw new AccessDeniedHttpException('You must be logged in.');
    }

    $device_key = '';
    if ($user->hasField('field_device_access_token')) {
      $device_key = $user->get('field_device_access_token')->value ?? '';
    }

    if (empty($device_key)) {
      throw new AccessDeniedHttpException('Device key not configured for this user.');
    }

    return new ResourceResponse([
      'deviceKey' => $device_key,
    ]);
  }
}