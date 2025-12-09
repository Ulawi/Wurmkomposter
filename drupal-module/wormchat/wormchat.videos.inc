<?php

/**
 * @file
 * Helper functions for worm state videos.
 */

/**
 * Get video URL for a specific worm state.
 *
 * @param string $state
 *   The worm state (e.g., 'healthy', 'sick', 'dormant').
 *
 * @return string|null
 *   The video URL or NULL if no video found.
 */
function wormchat_get_video_url($state) {
  $videos = \Drupal::entityQuery('media')
    ->condition('bundle', 'worm_state_video')
    ->condition('field_worm_state', $state)
    ->accessCheck(FALSE)
    ->execute();

  if (empty($videos)) {
    \Drupal::logger('wormchat')->warning('No video found for state: @state', ['@state' => $state]);
    return NULL;
  }

  // Load the first matching video
  $video = \Drupal\media\Entity\Media::load(reset($videos));
  if (!$video || !$video->hasField('field_worm_state_video_file')) {
    return NULL;
  }

  $file = $video->field_worm_state_video_file->entity;
  if (!$file) {
    return NULL;
  }

  return $file->createFileUrl(FALSE);
}

/**
 * Get all worm state videos.
 *
 * @return array
 *   Array of video data keyed by state.
 *   Example: ['healthy' => ['url' => '...', 'title' => '...'], ...]
 */
function wormchat_get_all_videos() {
  $videos_data = [];

  $videos = \Drupal::entityQuery('media')
    ->condition('bundle', 'worm_state_video')
    ->accessCheck(FALSE)
    ->execute();

  if (empty($videos)) {
    return $videos_data;
  }

  foreach ($videos as $video_id) {
    $video = \Drupal\media\Entity\Media::load($video_id);
    if (!$video) {
      continue;
    }

    $state = $video->field_worm_state->value ?? NULL;
    if (!$state) {
      continue;
    }

    $file = $video->field_worm_state_video_file->entity;
    if (!$file) {
      continue;
    }

    $videos_data[$state] = [
      'id' => $video->id(),
      'title' => $video->label(),
      'url' => $file->createFileUrl(FALSE),
      'description' => $video->field_worm_state_description->value ?? '',
      'filename' => $file->getFilename(),
      'size' => $file->getSize(),
      'created' => $video->getCreatedTime(),
    ];
  }

  return $videos_data;
}

/**
 * Get video data for a specific state.
 *
 * @param string $state
 *   The worm state.
 *
 * @return array|null
 *   Array with keys: id, title, url, description, filename, size, created.
 */
function wormchat_get_video_data($state) {
  $videos = \Drupal::entityQuery('media')
    ->condition('bundle', 'worm_state_video')
    ->condition('field_worm_state', $state)
    ->accessCheck(FALSE)
    ->execute();

  if (empty($videos)) {
    return NULL;
  }

  $video = \Drupal\media\Entity\Media::load(reset($videos));
  if (!$video) {
    return NULL;
  }

  $file = $video->field_worm_state_video_file->entity;
  if (!$file) {
    return NULL;
  }

  return [
    'id' => $video->id(),
    'title' => $video->label(),
    'url' => $file->createFileUrl(FALSE),
    'description' => $video->field_worm_state_description->value ?? '',
    'filename' => $file->getFilename(),
    'size' => $file->getSize(),
    'created' => $video->getCreatedTime(),
  ];
}

/**
 * Check if a video exists for a worm state.
 *
 * @param string $state
 *   The worm state.
 *
 * @return bool
 *   TRUE if video exists, FALSE otherwise.
 */
function wormchat_video_exists($state) {
  $videos = \Drupal::entityQuery('media')
    ->condition('bundle', 'worm_state_video')
    ->condition('field_worm_state', $state)
    ->accessCheck(FALSE)
    ->execute();

  return !empty($videos);
}

/**
 * Get list of all available worm states with videos.
 *
 * @return array
 *   Array of state names.
 */
function wormchat_get_available_states() {
  $videos = \Drupal::entityQuery('media')
    ->condition('bundle', 'worm_state_video')
    ->accessCheck(FALSE)
    ->execute();

  if (empty($videos)) {
    return [];
  }

  $states = [];
  foreach ($videos as $video_id) {
    $video = \Drupal\media\Entity\Media::load($video_id);
    if ($video) {
      $state = $video->field_worm_state->value;
      if ($state) {
        $states[$state] = $state;
      }
    }
  }

  return array_values($states);
}

/**
 * Get all videos matching a state prefix and randomly select one.
 *
 * Scans the /sites/default/files/worm/videos/ directory for video files
 * matching the state prefix. For example, state "hot" matches:
 * - hot.mp4
 * - hot_345.mp4
 * - hot_2.mp4
 * - etc.
 *
 * Randomly selects one from all matching files.
 *
 * @param string $state
 *   The state (prefix) to search for (e.g., 'hot', 'cold', 'dry').
 *
 * @return string|null
 *   The URL to the randomly selected video file, or NULL if no videos found.
 */
function wormchat_get_random_video_by_state($state) {
  if (!$state) {
    \Drupal::logger('wormchat')->warning('No state provided to wormchat_get_random_video_by_state');
    return NULL;
  }

  // Define the videos directory
  $videos_dir = 'public://worm/videos';
  $realpath = \Drupal::service('file_system')->realpath($videos_dir);

  if (!is_dir($realpath)) {
    \Drupal::logger('wormchat')->warning('Videos directory does not exist: @dir', ['@dir' => $realpath]);
    return NULL;
  }

  // Scan directory for files matching the state prefix
  $pattern = strtolower($state) . '_*.mp4';  // Handles: hot_1.mp4, hot_345.mp4, etc.
  $matching_files = glob($realpath . '/' . $pattern);

  // Also check for exact state name without suffix (e.g., hot.mp4)
  $exact_file = $realpath . '/' . strtolower($state) . '.mp4';
  if (file_exists($exact_file)) {
    $matching_files[] = $exact_file;
  }

  if (empty($matching_files)) {
    \Drupal::logger('wormchat')->warning('No videos found for state: @state (pattern: @pattern)', 
      ['@state' => $state, '@pattern' => $pattern]);
    return NULL;
  }

  // Randomly select one
  $selected_file = $matching_files[array_rand($matching_files)];
  $filename = basename($selected_file);

  // Convert file path to URL
  $relative_path = str_replace($realpath . '/', '', $selected_file);
  $url = file_url_transform_relative(file_create_url($videos_dir . '/' . $relative_path));

  \Drupal::logger('wormchat')->info('Selected random video for state @state: @file (from @count files)', [
    '@state' => $state,
    '@file' => $filename,
    '@count' => count($matching_files),
  ]);

  return $url;
}
