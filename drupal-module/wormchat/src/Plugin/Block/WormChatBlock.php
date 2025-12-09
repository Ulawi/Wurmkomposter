<?php

namespace Drupal\wormchat\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'Worm Chat' block.
 *
 * @Block(
 *   id = "worm_chat_block",
 *   admin_label = @Translation("Worm Chat Block")
 * )
 */
class WormChatBlock extends BlockBase {
  /**
   * {@inheritdoc}
   */
  public function build() {
    return [
      '#theme' => 'worm_chat_block',
      '#video_src' => '/sites/default/files/worm/satt.mp4',
      '#bubble_image' => '/sites/default/files/pictures/wurm_closeup_w_face.jpg',
      '#attached' => [
        'library' => [
          'wormchat/wormchat',
        ],
      ],
    ];
  }
}