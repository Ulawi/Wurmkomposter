<?php

namespace Drupal\wormchat\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Controller for worm state video API endpoints.
 */
class WormVideoController extends ControllerBase {

  /**
   * Get video URL for a specific worm state.
   *
   * @param string $state
   *   The worm state (e.g., 'healthy', 'sick', 'dormant').
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with video data or error.
   */
  public function getVideoByState($state) {
    $video_data = wormchat_get_video_data($state);

    if (!$video_data) {
      return new JsonResponse(
        ['error' => 'No video found for state: ' . $state],
        404
      );
    }

    return new JsonResponse($video_data);
  }

  /**
   * Get all available worm state videos.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with all videos keyed by state.
   */
  public function getAllVideos() {
    $videos = wormchat_get_all_videos();

    if (empty($videos)) {
      return new JsonResponse(
        ['message' => 'No videos available yet'],
        200
      );
    }

    return new JsonResponse($videos);
  }

  /**
   * Get list of available worm states with videos.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON array of state names.
   */
  public function getAvailableStates() {
    $states = wormchat_get_available_states();

    return new JsonResponse([
      'states' => $states,
      'count' => count($states),
    ]);
  }

  /**
   * Check if a video exists for a state.
   *
   * @param string $state
   *   The worm state.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with exists flag.
   */
  public function checkVideoExists($state) {
    $exists = wormchat_video_exists($state);

    return new JsonResponse([
      'state' => $state,
      'exists' => $exists,
    ]);
  }

  /**
   * Get a random video file for a state.
   *
   * Scans the videos directory for files matching the state and randomly
   * selects one. Supports multiple videos per state (e.g., hot.mp4, hot_1.mp4, hot_345.mp4).
   *
   * @param string $state
   *   The state to search for (e.g., 'hot', 'cold', 'dry').
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with video URL and filename, or error if not found.
   */
  public function getRandomVideoForState($state) {
    if (!$state) {
      return new JsonResponse(
        ['error' => 'No state provided'],
        400
      );
    }

    $video_url = wormchat_get_random_video_by_state($state);

    if (!$video_url) {
      return new JsonResponse(
        ['error' => 'No videos found for state: ' . $state],
        404
      );
    }

    return new JsonResponse([
      'state' => $state,
      'video' => $video_url,
      'filename' => basename($video_url),
    ]);
  }
}
