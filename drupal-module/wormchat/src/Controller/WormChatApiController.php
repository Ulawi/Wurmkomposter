<?php

namespace Drupal\wormchat\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Controller for WormChat API endpoints.
 */
class WormChatApiController extends ControllerBase {

  /**
   * Check if this is the user's first time chatting.
   * 
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   */
  public function checkFirstChat() {
    $user = $this->entityTypeManager()->getStorage('user')->load($this->currentUser()->id());
    
    if (!$user) {
      return new JsonResponse(['error' => 'User not found'], 404);
    }

    // Check if field_first_chat_seen exists and is set
    $firstChatSeen = FALSE;
    if ($user->hasField('field_first_chat_seen')) {
      $value = $user->get('field_first_chat_seen')->value;
      $firstChatSeen = (bool) $value;
    }

    return new JsonResponse([
      'is_first_chat' => !$firstChatSeen,
      'user_id' => $user->id(),
    ]);
  }

  /**
   * Mark the first chat as seen.
   * 
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   */
  public function markFirstChatSeen() {
    $user = $this->entityTypeManager()->getStorage('user')->load($this->currentUser()->id());
    
    if (!$user) {
      return new JsonResponse(['error' => 'User not found'], 404);
    }

    if ($user->hasField('field_first_chat_seen')) {
      $user->set('field_first_chat_seen', TRUE);
      $user->save();
      \Drupal::logger('wormchat')->info('Marked first chat as seen for user %uid', ['%uid' => $user->id()]);
    }

    return new JsonResponse([
      'success' => TRUE,
      'message' => 'First chat marked as seen',
      'user_id' => $user->id(),
    ]);
  }

}
