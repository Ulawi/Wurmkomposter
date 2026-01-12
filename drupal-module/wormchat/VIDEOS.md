# Worm State Videos - Complete Setup & Upload Guide

## Overview

The WormChat module supports playing different videos based on worm health/behavior states. Videos are stored as **Drupal Media Entities** in the `public://worm/videos/` directory.

**Supported states:** `dry', 'wet', 'hot', 'cold', 'hungry', 'cnLow', 'cnHigh', 'happy', 'satt'


## Architecture

### Video Storage Location
```
/web/sites/default/files/worm/videos/
```

### Video Media Type
- **Type ID:** `worm_state_video`
- **Fields:**
  - `field_worm_state_video_file` - The video file (mp4, webm, ogg, ogv)
  - `field_worm_state` - The worm state (healthy, sick, dormant, etc)
  - `field_worm_state_description` - Optional description of the video

### Supported Video Formats
- ✅ **MP4** (H.264) - Most compatible, recommended
- ✅ **WebM** (VP8/VP9) - Web-optimized, smaller file size
- ✅ **OGG Theora** (OGV) - Open format
- ❌ AVI, MOV, MKV - Not supported without conversion

---

## Method 1: Web UI Upload (Easiest)

### Step 1: Navigate to Media Administration

1. Login to Drupal as an administrator
2. Go to: **Content > Media**
3. Or use direct URL: `/admin/content/media`

### Step 2: Add New Media

1. Click **"+ Add media"** button
2. Select **"Worm State Video"** from the media type list

### Step 3: Fill in Video Details

**Title:** (Auto-filled by Drupal, optional)

**Video File:** 
- Click **"Choose File"** or drag/drop your video
- Select your video file (must be mp4, webm, ogg, or ogv)
- File will be uploaded to `public://worm/videos/`

**Worm State:** *(Required field)*
- Enter the worm state name
- Examples: 'dry', 'wet', 'hot', 'cold', 'hungry', 'cnLow', 'cnHigh', 'happy', 
- **Use lowercase with underscores (no spaces)**
- This value is used to match with worm state in the application
- Examples: 'dry_cnHigh'

**State Description:** *(Optional)*
- Describe what the video shows
- Example: "Worm shows happy behavior and has just been fed"

### Step 4: Save

1. Click **"Save"** button
2. Video is now available in the system
3. Check the **"Worm State Video"** collection to verify

---

## Method 2: Bulk Upload via SFTP/SSH

### Step 1: Prepare Videos

Ensure all videos are converted to MP4 format (recommended for compatibility):

```bash
# Convert video to MP4 using ffmpeg
ffmpeg -i input_video.mov -c:v libx264 -preset slow -crf 22 \
        -c:a aac -b:a 192k output_video.mp4

# Reduce file size (recommended for web)
ffmpeg -i input_video.mov -c:v libx264 -preset slow -crf 28 \
        -c:a aac -b:a 128k -vf scale=1280:-1 output_video.mp4
```

### Step 2: Upload Files via SFTP

```bash
# Using SFTP from your local machine
sftp -r username@server.com

# Navigate to video directory
cd /web/sites/default/files/worm/videos/

# Upload your video files
put healthy_worm.mp4
put sick_worm.mp4
put dormant_worm.mp4

exit
```

### Step 3: Create Media Entities (via Drupal Console)

Use Drupal Console to create media entities programmatically:

```bash
cd /home/cazz2/wurmsites/wurm-drupal10-site

# Create a worm state video entity
drush media:create worm_state_video \
  --title="Healthy Worm" \
  --field_worm_state_video_file="public://worm/videos/healthy_worm.mp4" \
  --field_worm_state="happy" \
  --field_worm_state_description="Worm showing healthy behavior"
```

Or use Drush directly:

```bash
drush ev "
\$media = \Drupal\media\Entity\Media::create([
  'bundle' => 'worm_state_video',
  'name' => 'Healthy Worm',
  'field_worm_state_video_file' => [
    'target_id' => \$file->id(),
  ],
  'field_worm_state' => 'healthy',
  'field_worm_state_description' => 'Worm showing healthy behavior',
]);
\$media->save();
"
```

---

## Method 3: Programmatic Upload (For Developers)

### Create Video from PHP Code

```php
<?php
// Example: Create a worm state video entity

// Step 1: Get the video file
\$video_path = 'public://worm/videos/healthy_worm.mp4';
\$file = \Drupal\file\Entity\File::create([
  'filename' => 'healthy_worm.mp4',
  'uri' => \$video_path,
  'status' => 1,  // Mark as permanent
]);
\$file->save();

// Step 2: Create the media entity
\$media = \Drupal\media\Entity\Media::create([
  'bundle' => 'worm_state_video',
  'name' => 'Healthy Worm',
  'field_worm_state_video_file' => [
    'target_id' => \$file->id(),
  ],
  'field_worm_state' => 'happy',
  'field_worm_state_description' => 'Worm showing healthy behavior with normal movement',
]);
\$media->save();

echo "Video created: " . \$media->id();
?>
```
---

## Using Videos in JavaScript

### Fetch Video by Worm State

Create a helper function in your controller:

```php
<?php
namespace Drupal\wormchat\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

class WormVideoController extends ControllerBase {
  
  /**
   * Get video URL for a specific worm state.
   */
  public function getVideoByState(\$state) {
    // Query for video by worm state
    \$videos = \Drupal::entityQuery('media')
      ->condition('bundle', 'worm_state_video')
      ->condition('field_worm_state', \$state)
      ->accessCheck(FALSE)
      ->execute();

    if (empty(\$videos)) {
      return new JsonResponse(['error' => 'No video found for state: ' . \$state], 404);
    }

    // Load the first matching video
    \$video = \Drupal\media\Entity\Media::load(reset(\$videos));
    \$file = \$video->field_worm_state_video_file->entity;
    \$url = \$file->createFileUrl(FALSE);

    return new JsonResponse([
      'videoUrl' => \$url,
      'state' => \$state,
      'title' => \$video->name->value,
      'description' => \$video->field_worm_state_description->value ?? '',
    ]);
  }
}
?>
```

### Register Route in `.routing.yml`

```yaml
wormchat.video_by_state:
  path: '/api/worm/video/{state}'
  defaults:
    _controller: '\Drupal\wormchat\Controller\WormVideoController::getVideoByState'
  methods: [GET]
  requirements:
    _permission: 'access content'
```

### Call from JavaScript

```javascript
/**
 * Play video for worm state.
 */
function playWormStateVideo(wormState) {
  fetch('/api/worm/video/' + wormState)
    .then(response => {
      if (!response.ok) throw new Error('Video not found');
      return response.json();
    })
    .then(data => {
      console.log('Playing video for state:', wormState);
      
      // Create video player
      const video = document.createElement('video');
      video.src = data.videoUrl;
      video.controls = true;
      video.width = 640;
      video.height = 480;
      
      // Append to page
      document.body.appendChild(video);
      
      // Play automatically
      video.play();
    })
    .catch(error => {
      console.error('Error loading video:', error);
    });
}

// Usage:
playWormStateVideo('healthy');
playWormStateVideo('sick');
```

---

## Video Best Practices

### File Size Recommendations

| Format | Resolution | Bitrate | File Size (30s) |
|--------|-----------|---------|----------------|
| MP4 | 720p | 2500 kbps | ~9 MB |
| MP4 | 480p | 1500 kbps | ~5 MB |
| WebM | 720p | 2000 kbps | ~7 MB |
| WebM | 480p | 1000 kbps | ~3 MB |

### Encoding Recommendations

**For MP4 (Best Compatibility):**
```bash
ffmpeg -i input.mov \
  -c:v libx264 \
  -preset slow \
  -crf 22 \
  -c:a aac \
  -b:a 192k \
  -vf scale=1280:720 \
  output.mp4
```

**For WebM (Best File Size):**
```bash
ffmpeg -i input.mov \
  -c:v libvpx-vp9 \
  -b:v 1500k \
  -c:a libopus \
  -b:a 128k \
  -vf scale=1280:720 \
  output.webm
```

### Naming Convention

| State | Use Case |
|-------|----------|
| `dry` | substrate is too dry |
| `wet` | substrate is too wet |
| `hot` | temperature too high |
| `hungry` | Needs food |
| `cold` | temperature too low |
| `cnLow` | ratio of carbon/nitrogen is too low |
| `cnHigh` | ratio of c/n is too high |
| `satt` | has enough food |
| `happy` | every value is within the designated range: temperature, moisture, cn, food amount |

**Custom states:** You can add any custom state name! You will need to update thingsboard to send the state in order for the video to be played.

---

## Verification & Troubleshooting

### Verify Videos are Uploaded

```bash
# Check files exist
ls -la /web/sites/default/files/worm/videos/

# Check file permissions (should be 644)
stat /web/sites/default/files/worm/videos/healthy_worm.mp4
```

### Verify Media Entities Created

```bash
# Using Drush
drush media:list

# Or query database
drush sql:query "SELECT id, name, field_worm_state FROM media WHERE type = 'worm_state_video';"
```

### Common Issues

**Issue:** Video doesn't appear in admin interface
- **Solution:** Clear Drupal cache: `drush cache:rebuild`

**Issue:** Video file upload fails
- **Solution:** Check file permissions on `/web/sites/default/files/` directory (should be 755)
- Ensure Apache/PHP has write permissions

**Issue:** Video plays but won't start automatically
- **Solution:** Browser autoplay may be restricted. Add attribute: `<video autoplay muted>`

**Issue:** "No video found" error
- **Solution:** Verify field_worm_state value matches exactly (case-sensitive, use lowercase)

---

## Security Notes

✅ **Done by Drupal:**
- File type validation (only video formats allowed)
- User permission checking
- Virus scanning (if installed)

✅ **Best Practices:**
- Limit video file size (e.g., max 100 MB)
- Use HTTP/HTTPS for streaming
- Implement access control on sensitive videos

---

## Summary of Setup Steps

1. ✅ **Module Installation** - Run `drush updatedb` to create fields
2. 📤 **Upload Videos** - Use Web UI or SFTP upload
3. 📝 **Create Media Entities** - Fill in worm state details
4. 🎬 **Test Video Playback** - Verify videos play in application
5. 🔧 **Integrate with App** - Call video API from JavaScript

---

## Support

For issues or questions:
- Check Drupal logs: `drush watchdog:show`
- View media entities: `/admin/content/media`
- Review field configuration: `/admin/structure/media/manage/worm_state_video/fields`

