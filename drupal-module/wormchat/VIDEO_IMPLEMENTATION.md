# WormChat Video Implementation - Summary

## ✅ What Was Implemented

### 1. **Database Schema** (`wormchat.install`)
- ✅ New media type: `worm_state_video`
- ✅ Field: `field_worm_state_video_file` (File type, accepts mp4/webm/ogg/ogv)
- ✅ Field: `field_worm_state` (String, stores state name: healthy, sick, dormant, etc)
- ✅ Field: `field_worm_state_description` (Text, optional description)
- ✅ Directory: `public://worm/videos/` (automatically created on module install)

### 2. **Helper Functions** (`wormchat.videos.inc`)
```php
wormchat_get_video_url($state)           // Get video URL by state
wormchat_get_all_videos()                // Get all videos with metadata
wormchat_get_video_data($state)          // Get complete video data object
wormchat_video_exists($state)            // Check if video exists
wormchat_get_available_states()          // List all states with videos
```

### 3. **REST API Controller** (`src/Controller/WormVideoController.php`)
Provides JSON endpoints for video access:
- `GET /api/worm/video/{state}` - Get video for specific state
- `GET /api/worm/videos` - Get all videos
- `GET /api/worm/video-states` - List available states
- `GET /api/worm/video/{state}/exists` - Check if state has video

### 4. **Routing** (`wormchat.routing.yml`)
All video API routes configured and ready to use.

### 5. **Documentation** (`VIDEOS.md`)
Comprehensive 400+ line guide covering:
- Overview & architecture
- Method 1: Web UI upload (easiest)
- Method 2: SFTP/SSH bulk upload
- Method 3: Programmatic creation
- Video encoding best practices
- JavaScript integration examples
- Troubleshooting guide

---

## 🚀 How to Use

### Step 1: Deploy Module
```bash
cd /path/to/drupal/wurmsites/wurm-drupal10-site

# Run database updates to create fields
drush updatedb
# Or: drush migrate-db
```

### Step 2: Upload Videos

**Option A: Web UI (Easiest)**
1. Go to `/admin/content/media`
2. Click "+ Add media"
3. Select "Worm State Video"
4. Upload video file
5. Fill in:
   - Worm State: `healthy` (or any state name)
   - Description: (optional)
6. Click Save

**Option B: SFTP + Drush**
```bash
# Upload file via SFTP
sftp user@host
cd /web/sites/default/files/worm/videos/
put healthy_worm.mp4

# Create media entity
drush ev "
\$file = \Drupal\file\Entity\File::create([
  'filename' => 'healthy_worm.mp4',
  'uri' => 'public://worm/videos/healthy_worm.mp4',
  'status' => 1,
]);
\$file->save();

\$media = \Drupal\media\Entity\Media::create([
  'bundle' => 'worm_state_video',
  'name' => 'Healthy Worm',
  'field_worm_state_video_file' => ['target_id' => \$file->id()],
  'field_worm_state' => 'healthy',
]);
\$media->save();
"
```

### Step 3: Use in JavaScript

```javascript
// Fetch and play video
fetch('/api/worm/video/healthy')
  .then(res => res.json())
  .then(data => {
    const video = document.createElement('video');
    video.src = data.url;
    video.controls = true;
    video.play();
    document.body.appendChild(video);
  });

// Or use the helper function (after including wormchat.videos.inc in Drupal)
fetch('/api/worm/video/healthy')
  .then(r => r.json())
  .then(d => console.log('Video URL:', d.url));
```

---

## 📋 Available API Endpoints

### Get Video for State
```
GET /api/worm/video/healthy

Response (200):
{
  "id": 123,
  "title": "Healthy Worm",
  "url": "/sites/default/files/worm/videos/healthy_worm.mp4",
  "description": "Normal behavior",
  "filename": "healthy_worm.mp4",
  "size": 9450000,
  "created": 1702074000
}

Response (404):
{
  "error": "No video found for state: unknown_state"
}
```

### Get All Videos
```
GET /api/worm/videos

Response (200):
{
  "healthy": {
    "id": 123,
    "title": "Healthy Worm",
    "url": "/sites/default/files/worm/videos/healthy_worm.mp4",
    ...
  },
  "sick": {
    "id": 124,
    "title": "Sick Worm",
    ...
  }
}
```

### Get Available States
```
GET /api/worm/video-states

Response (200):
{
  "states": ["healthy", "sick", "dormant"],
  "count": 3
}
```

### Check If Video Exists
```
GET /api/worm/video/healthy/exists

Response (200):
{
  "state": "healthy",
  "exists": true
}
```

---

## 📁 Files Created/Modified

### Created:
- ✅ `/wormchat/VIDEOS.md` - Complete documentation
- ✅ `/wormchat/wormchat.videos.inc` - Helper functions
- ✅ `/wormchat/src/Controller/WormVideoController.php` - REST API controller

### Modified:
- ✅ `/wormchat/wormchat.install` - Added video media type and fields
- ✅ `/wormchat/wormchat.routing.yml` - Added video API routes

---

## 🎥 Supported Video States

Predefined states (you can add any custom state):
- `healthy` - Normal behavior with activity
- `sick` - Poor health, sluggish
- `dormant` - Hibernating/inactive
- `hungry` - Needs feeding
- `overfed` - Too much food
- `escape_attempt` - Trying to escape
- `active` - Moving around
- `inactive` - Minimal movement

---

## 🎬 Video Format Support

| Format | Support | Recommendation |
|--------|---------|-----------------|
| **MP4** | ✅ Yes | Best compatibility |
| **WebM** | ✅ Yes | Best compression |
| **OGV** | ✅ Yes | Open format |
| **MOV** | ❌ No | Convert to MP4 |
| **AVI** | ❌ No | Convert to MP4 |
| **MKV** | ❌ No | Convert to MP4 |

Convert videos using FFmpeg:
```bash
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 22 \
        -c:a aac -b:a 192k output.mp4
```

---

## 🔍 Verification

### Verify Installation
```bash
cd /home/cazz2/wurmsites/wurm-drupal10-site

# Check if media type exists
drush eval "echo \Drupal\media\Entity\MediaType::load('worm_state_video') ? 'OK' : 'MISSING';"

# Check if fields exist
drush eval "
\$field = \Drupal\field\Entity\FieldConfig::loadByName('media', 'worm_state_video', 'field_worm_state_video_file');
echo \$field ? 'OK' : 'MISSING';
"

# List all videos
drush eval "
\$videos = \Drupal::entityQuery('media')
  ->condition('bundle', 'worm_state_video')
  ->accessCheck(FALSE)
  ->execute();
echo count(\$videos) . ' videos found';
"
```

### Check Video Storage
```bash
# Verify directory exists
ls -la /web/sites/default/files/worm/videos/

# Check file permissions (should be 644)
stat /web/sites/default/files/worm/videos/*.mp4
```

---

## 🚨 Common Issues & Solutions

### Issue: "Media type not found"
**Solution:** Run `drush updatedb` to create schema

### Issue: Upload fails with "File not allowed"
**Solution:** Check field file extension settings in `/admin/structure/media/manage/worm_state_video/fields`

### Issue: API returns 404 for valid state
**Solution:** Verify state name is lowercase and matches exactly (no spaces)

### Issue: Video won't play in browser
**Solution:** Check browser console for CORS or media codec issues

---

## 📚 Next Steps

1. **Upload Videos** - Follow VIDEOS.md guide to add your videos
2. **Test API** - Visit `/api/worm/videos` to verify setup
3. **Integrate with App** - Call video API when needed in application
4. **Monitor** - Check `/admin/content/media` to manage videos

---

## 📞 Support Resources

- **Full Documentation:** `/wormchat/VIDEOS.md`
- **Helper Functions:** `/wormchat/wormchat.videos.inc`
- **API Controller:** `/wormchat/src/Controller/WormVideoController.php`
- **Drupal Logs:** `drush watchdog:show`
- **Media Admin:** `/admin/content/media`

