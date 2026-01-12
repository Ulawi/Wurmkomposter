<?php

namespace Drupal\wormchat\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Controller for handling device token storage.
 */
class DeviceTokenController extends ControllerBase {

  /**
   * POST endpoint - Store device token by email.
   *
   * Expected request body:
   * {
   *   "email": "user@example.com",
   *   "device_token": "thingsboard_access_token_here"
   * }
   */
  public function storeToken(Request $request) {
    $content = $request->getContent();
    $data = json_decode($content, TRUE);

    // Validate request data
    if (!isset($data['email']) || empty($data['email'])) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'email field is required',
      ], 400);
    }

    if (!isset($data['device_token']) || empty($data['device_token'])) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'device_token field is required',
      ], 400);
    }

    $email = $data['email'];
    $device_token = $data['device_token'];

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Invalid email format',
      ], 400);
    }

    // Validate token length (ThingsBoard tokens are typically 32+ chars)
    if (strlen($device_token) < 10) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Invalid device token format',
      ], 400);
    }

    // Look up user by email
    $users = \Drupal::entityTypeManager()
      ->getStorage('user')
      ->loadByProperties(['mail' => $email]);

    if (empty($users)) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'User with email ' . $email . ' not found',
      ], 404);
    }

    // Get first matching user
    $user = reset($users);
    $user_id = $user->id();

    // Store token in keyvalue store using helper function
    try {
      \wormchat_set_device_token($user_id, $device_token);

      \Drupal::logger('wormchat')->info(
        'Device token registered for user @uid (@email) via device provisioning',
        [
          '@uid' => $user_id,
          '@email' => $email,
        ]
      );

      return new JsonResponse([
        'success' => TRUE,
        'message' => 'Device token stored successfully',
        'uid' => $user_id,
        'email' => $email,
      ]);
    } catch (\Exception $e) {
      \Drupal::logger('wormchat')->error(
        'Failed to store device token: @error',
        ['@error' => $e->getMessage()]
      );

      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Failed to store device token',
      ], 500);
    }
  }
}
