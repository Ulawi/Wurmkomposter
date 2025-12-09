<?php

namespace Drupal\wormchat\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\user\Entity\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class TelemetryController extends ControllerBase {

  public function sendTelemetry(Request $request) {
    try {
      $user = $this->currentUser();
      
      // Only authenticated users can send telemetry
      if ($user->isAnonymous()) {
        \Drupal::logger('wormchat')->warning('Anonymous user attempted to send telemetry');
        return new JsonResponse(['error' => 'Unauthorized'], 401);
      }

      $content = $request->getContent();
      \Drupal::logger('wormchat')->info('Telemetry request received: @content', ['@content' => $content]);
      
      $data = json_decode($content, TRUE);
      
      if (!$data || !isset($data['material']) || !isset($data['amount_cups'])) {
        \Drupal::logger('wormchat')->warning('Invalid telemetry data: @data', ['@data' => print_r($data, TRUE)]);
        return new JsonResponse(['error' => 'Invalid data'], 400);
      }

      // Retrieve device token from user
      $device_token = $this->getUserDeviceToken($user->id());
      
      if (!$device_token) {
        \Drupal::logger('wormchat')->warning('No device token for user @uid', ['@uid' => $user->id()]);
        return new JsonResponse(['error' => 'No device token configured'], 403);
      }

      // Send to ThingsBoard
      $result = $this->sendToThingsBoard($device_token, $data);

      if ($result['success']) {
        \Drupal::logger('wormchat')->info('Telemetry sent successfully');
        return new JsonResponse(['success' => TRUE, 'message' => 'Telemetry sent']);
      } else {
        \Drupal::logger('wormchat')->error('Telemetry send failed: @error', ['@error' => $result['error']]);
        return new JsonResponse(['error' => $result['error']], 500);
      }
    } catch (\Exception $e) {
      \Drupal::logger('wormchat')->error('Exception in sendTelemetry: @error', ['@error' => $e->getMessage()]);
      return new JsonResponse(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
  }

  public function getDeviceKey() {
    $user = $this->currentUser();
    
    // Only authenticated users can access their device key
    if ($user->isAnonymous()) {
      return new JsonResponse(['error' => 'Unauthorized'], 401);
    }

    $device_token = $this->getUserDeviceToken($user->id());
    
    if (!$device_token) {
      return new JsonResponse(['error' => 'No device token configured'], 403);
    }

    return new JsonResponse(['device_key' => $device_token]);
  }

  /**
   * Get current worm state from ThingsBoard.
   * Fetches the latest worm_condition telemetry value.
   */
  public function getWormState() {
    try {
      $user = $this->currentUser();
      
      // Only authenticated users can access worm state
      if ($user->isAnonymous()) {
        \Drupal::logger('wormchat')->warning('Anonymous user attempted to get worm state');
        return new JsonResponse(['error' => 'Unauthorized'], 401);
      }

      // Retrieve device token from user
      $device_token = $this->getUserDeviceToken($user->id());
      
      if (!$device_token) {
        \Drupal::logger('wormchat')->warning('No device token for user @uid', ['@uid' => $user->id()]);
        return new JsonResponse(['error' => 'No device token configured'], 403);
      }

      // Fetch from ThingsBoard
      $result = $this->fetchFromThingsBoard($device_token);

      if ($result['success']) {
        \Drupal::logger('wormchat')->info('Worm state fetched: @state', ['@state' => $result['state']]);
        return new JsonResponse(['worm_condition' => $result['state']]);
      } else {
        \Drupal::logger('wormchat')->error('Failed to fetch worm state: @error', ['@error' => $result['error']]);
        return new JsonResponse(['error' => $result['error']], 500);
      }
    } catch (\Exception $e) {
      \Drupal::logger('wormchat')->error('Exception in getWormState: @error', ['@error' => $e->getMessage()]);
      return new JsonResponse(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
  }

  private function getUserDeviceToken($uid) {
    try {
      // Load user entity
      $user = User::load($uid);
      
      if (!$user) {
        \Drupal::logger('wormchat')->error('User @uid not found', ['@uid' => $uid]);
        return NULL;
      }

      // Get token from user field
      if ($user->hasField('field_device_access_token')) {
        $token = $user->get('field_device_access_token')->value;
        
        if ($token) {
          \Drupal::logger('wormchat')->info('Device token retrieved for user @uid', ['@uid' => $uid]);
          return $token;
        }
      }

      \Drupal::logger('wormchat')->warning('No device token field or value for user @uid', ['@uid' => $uid]);
      return NULL;
    } catch (\Exception $e) {
      \Drupal::logger('wormchat')->error('Error retrieving device token: @error', ['@error' => $e->getMessage()]);
      return NULL;
    }
  }

  private function sendToThingsBoard($device_token, $data) {
    // Use external ThingsBoard Cloud instance
    $thingsboard_url = 'https://thingsboard.cloud/api/v1/' . $device_token . '/telemetry';

    try {
      $json_data = json_encode($data);
      
      // Log the EXACT curl command equivalent
      $curl_command = 'curl -X POST "' . $thingsboard_url . '" ' .
        '--header "Content-Type: application/json" ' .
        '--data \'' . $json_data . '\'';
      
      \Drupal::logger('wormchat')->info('Equivalent curl command: @curl', ['@curl' => $curl_command]);
      \Drupal::logger('wormchat')->info('Device token: @token', ['@token' => $device_token]);
      \Drupal::logger('wormchat')->info('Payload data: @data', ['@data' => $json_data]);

      $response = \Drupal::httpClient()->post($thingsboard_url, [
        'headers' => [
          'Content-Type' => 'application/json',
        ],
        'body' => $json_data,
        'timeout' => 10,
        'connect_timeout' => 5,
        'verify' => TRUE,
      ]);

      $status = $response->getStatusCode();
      $body = (string)$response->getBody();
      
      \Drupal::logger('wormchat')->info('ThingsBoard response: @status - @body', [
        '@status' => $status,
        '@body' => $body
      ]);

      if ($status === 200) {
        \Drupal::logger('wormchat')->info('Telemetry sent successfully to ThingsBoard Cloud');
        return ['success' => TRUE];
      } else {
        $error = 'ThingsBoard API error: ' . $status . ' - ' . $body;
        \Drupal::logger('wormchat')->error($error);
        return ['success' => FALSE, 'error' => $error];
      }
    } catch (\Exception $e) {
      $error_msg = $e->getMessage();
      $error_code = $e->getCode();
      
      \Drupal::logger('wormchat')->error('Failed to send telemetry - Code: @code, Message: @error', [
        '@code' => $error_code,
        '@error' => $error_msg
      ]);
      
      return ['success' => FALSE, 'error' => $error_msg];
    }
  }

  /**
   * Fetch telemetry data from ThingsBoard.
   * Gets the latest worm_condition value.
   * Uses the /telemetry endpoint as documented in ThingsBoard API.
   *
   * @param string $device_token - ThingsBoard device access token
   * @return array - ['success' => bool, 'state' => string or 'error' => string]
   */
  private function fetchFromThingsBoard($device_token) {
    // ThingsBoard shared attributes endpoint
    // Format: /api/v1/$ACCESS_TOKEN/attributes?sharedKeys=key1,key2
    $thingsboard_url = 'https://thingsboard.cloud/api/v1/' . $device_token . '/attributes?sharedKeys=worm_condition';

    try {
      \Drupal::logger('wormchat')->info('Fetching worm_condition from ThingsBoard attributes: @url', ['@url' => $thingsboard_url]);

      $response = \Drupal::httpClient()->get($thingsboard_url, [
        'headers' => [
          'Content-Type' => 'application/json',
        ],
        'timeout' => 10,
        'connect_timeout' => 5,
        'verify' => TRUE,
      ]);

      $status = $response->getStatusCode();
      $body = (string)$response->getBody();
      
      \Drupal::logger('wormchat')->info('ThingsBoard response status: @status', ['@status' => $status]);
      \Drupal::logger('wormchat')->info('ThingsBoard response body: @body', ['@body' => $body]);

      if ($status === 200) {
        $data = json_decode($body, TRUE);

        // ThingsBoard shared attributes response format:
        // { "shared": { "worm_condition": "happy" } }
        
        $state = NULL;
        
        // Check for nested "shared" key with worm_condition
        if (isset($data['shared']) && is_array($data['shared']) && isset($data['shared']['worm_condition'])) {
          $state = $data['shared']['worm_condition'];
          \Drupal::logger('wormchat')->info('✓ Found worm_condition in shared.worm_condition: @state', ['@state' => $state]);
        }
        // Try direct key (fallback, shouldn't happen with this endpoint)
        elseif (isset($data['worm_condition'])) {
          $state = $data['worm_condition'];
          \Drupal::logger('wormchat')->info('Found worm_condition in root level: @state', ['@state' => $state]);
        }

        if ($state) {
          \Drupal::logger('wormchat')->info('✓ Extracted worm_condition: @state', ['@state' => $state]);
          return ['success' => TRUE, 'state' => $state];
        }

        // If we get here, worm_condition wasn't found
        $error = 'worm_condition not found in shared attributes response';
        \Drupal::logger('wormchat')->warning('Full response for debugging: @response', ['@response' => print_r($data, TRUE)]);
        \Drupal::logger('wormchat')->error($error);
        return ['success' => FALSE, 'error' => $error];

      } else {
        $error = 'ThingsBoard API error: ' . $status . ' - ' . $body;
        \Drupal::logger('wormchat')->error($error);
        return ['success' => FALSE, 'error' => $error];
      }
    } catch (\Exception $e) {
      $error_msg = $e->getMessage();
      $error_code = $e->getCode();
      
      \Drupal::logger('wormchat')->error('Failed to fetch worm_condition from ThingsBoard - Code: @code, Message: @error', [
        '@code' => $error_code,
        '@error' => $error_msg
      ]);
      
      return ['success' => FALSE, 'error' => $error_msg];
    }
  }
}