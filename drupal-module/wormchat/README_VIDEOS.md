# WormChat Video System - Complete Implementation ✅

## 📋 Overview

The WormChat module now supports **state-based video playback** using Drupal Media Entities. Videos are managed through the Drupal admin interface and served via REST API endpoints.

---

## 🏗️ Architecture

```
User uploads video via /admin/content/media
        ↓
Drupal Media Entity (bundle: worm_state_video)
        ↓
Stored: public://worm/videos/
        ↓
REST API (/api/worm/video/*)
        ↓
JavaScript fetches and plays video
```

### 1. **Database Schema** (wormchat.install)
```php
Media Type: worm_state_video
├── field_worm_state_video_file (File)
├── field_worm_state (String)
└── field_worm_state_description (Text)
```

### 2. **Helper Functions** (wormchat.videos.inc)
```php
✅ wormchat_get_video_url($state)
✅ wormchat_get_all_videos()
✅ wormchat_get_video_data($state)
✅ wormchat_video_exists($state)
✅ wormchat_get_available_states()
```

### 3. **REST API Controller** (src/Controller/WormVideoController.php)
```php
✅ getVideoByState($state)      → GET /api/worm/video/{state}
✅ getAllVideos()                → GET /api/worm/videos
✅ getAvailableStates()          → GET /api/worm/video-states
✅ checkVideoExists($state)      → GET /api/worm/video/{state}/exists
```

### 4. **API Routes** (wormchat.routing.yml)
```yaml
✅ wormchat.video.by_state      → /api/worm/video/{state}
✅ wormchat.video.all           → /api/worm/videos
✅ wormchat.video.states        → /api/worm/video-states
✅ wormchat.video.exists        → /api/worm/video/{state}/exists
```

### 5. **Documentation Files**
```
📄 VIDEOS.md                   ← Comprehensive 400+ line guide
📄 QUICKSTART_VIDEOS.md        ← 5-minute setup guide
📄 VIDEO_IMPLEMENTATION.md     ← Technical summary
```

---

## 🚀 Getting Started

### Step 1: Deploy Changes
```bash
cd /path/to/drupal/

# Update database schema
drush updatedb

# Clear cache
drush cache:rebuild
```

### Step 2: Upload First Video
**Easiest way - Web UI:**
1. Go to `/admin/content/media`
2. Click "+ Add media"
3. Select "Worm State Video"
4. Upload video file (MP4 recommended)
5. Fill: State = `hot`
6. Save

### Step 3: Test API
```bash
curl http://localhost/api/worm/video/hot
```

Expected response:
```json
{
  "id": 123,
  "title": "Temperature too high",
  "url": "/sites/default/files/worm/videos/hot_3.mp4",
  "description": "",
  "filename": "hot_3.mp4",
  "size": 9450000,
  "created": 1702074000
}
```

### Step 4: Use in Application
```javascript
// Fetch and play video
fetch('/api/worm/video/hot')
  .then(r => r.json())
  .then(data => {
    const video = document.createElement('video');
    video.src = data.url;
    video.controls = true;
    video.play();
  });
```

---

## 📁 Files Created & Modified

### **Created:**
```
✅ web/modules/custom/wormchat/VIDEOS.md
✅ web/modules/custom/wormchat/QUICKSTART_VIDEOS.md
✅ web/modules/custom/wormchat/VIDEO_IMPLEMENTATION.md
✅ web/modules/custom/wormchat/wormchat.videos.inc
✅ web/modules/custom/wormchat/src/Controller/WormVideoController.php
```

### **Modified:**
```
✅ web/modules/custom/wormchat/wormchat.install
   └─ Added video media type & fields
   
✅ web/modules/custom/wormchat/wormchat.routing.yml
   └─ Added 4 video API routes
```

---

## 🎬 Supported Video States

### Predefined States:
| State | Use Case |
|-------|----------|
| `dry` | substrate is too dry |
| `wet` | substrate is too wet |
| `hot` | temperature too high |
| `hungry` | Needs food |
| `cold` | temperature too low |
| `cnLow` | ratio of c/n is too low |
| `cnHigh` | ratio of c/n is too high |
| `satt` | has enough food |
| `happy` | every value is within the designated range: temperature, moisture, cn, food amount |

**Custom states:** You can add any custom state name! You will need to update thingsboard to send the state in order for the video to be played. 

---

## 🎥 Video Formats Supported

| Format | Support | Quality | Size | Recommendation |
|--------|---------|---------|------|-----------------|
| **MP4** | ✅ Yes | High | Medium | ⭐ Best |
| **WebM** | ✅ Yes | High | Low | ⭐ Best compression |
| **OGV** | ✅ Yes | High | Medium | ✅ Good |
| **MOV** | ❌ Convert to MP4 | - | - | ❌ Not supported |
| **AVI** | ❌ Convert to MP4 | - | - | ❌ Not supported |

### Convert Videos:
```bash
# MOV → MP4
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 22 \
        -c:a aac -b:a 192k output.mp4

# MP4 (optimize for web)
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 28 \
        -c:a aac -b:a 128k -vf scale=1280:-1 output_optimized.mp4
```

---

## 📚 API Endpoints

### Get Video for State
```
GET /api/worm/video/healthy
GET /api/worm/video/sick
GET /api/worm/video/{state}

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
{ "error": "No video found for state: unknown_state" }
```

### Get All Videos
```
GET /api/worm/videos

Response (200):
{
  "healthy": { ... },
  "sick": { ... },
  "dormant": { ... }
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

## 🔧 Usage Examples

### JavaScript: Fetch and Play
```javascript
function playWormVideo(state) {
  fetch(`/api/worm/video/${state}`)
    .then(response => {
      if (!response.ok) throw new Error(`No video for state: ${state}`);
      return response.json();
    })
    .then(data => {
      const video = document.createElement('video');
      video.src = data.url;
      video.controls = true;
      video.width = 640;
      video.height = 480;
      video.autoplay = true;
      
      document.body.appendChild(video);
      console.log(`Playing: ${data.title}`);
    })
    .catch(error => console.error('Error:', error));
}

// Usage
playWormVideo('healthy');
playWormVideo('sick');
```

### PHP: Get Video Data
```php
<?php
// Load helper functions
require_once 'wormchat.videos.inc';

// Get video URL
$url = wormchat_get_video_url('healthy');
echo "Video: " . $url;

// Get all video data
$video = wormchat_get_video_data('healthy');
echo $video['title'];  // "Healthy Worm"
echo $video['url'];    // "/sites/default/files/worm/videos/healthy_worm.mp4"

// Check if video exists
if (wormchat_video_exists('sick')) {
  echo "Sick video available";
}

// Get available states
$states = wormchat_get_available_states();
// Returns: ['healthy', 'sick', 'dormant']
?>
```

### Drupal: Create Video Programmatically
```php
<?php
// Create file entity
$file = \Drupal\file\Entity\File::create([
  'filename' => 'healthy_worm.mp4',
  'uri' => 'public://worm/videos/healthy_worm.mp4',
  'status' => 1,
]);
$file->save();

// Create media entity
$media = \Drupal\media\Entity\Media::create([
  'bundle' => 'worm_state_video',
  'name' => 'Healthy Worm Video',
  'field_worm_state_video_file' => ['target_id' => $file->id()],
  'field_worm_state' => 'healthy',
  'field_worm_state_description' => 'Shows healthy worm behavior',
]);
$media->save();
?>
```

---

## ✅ Verification Checklist

### 1. Database Schema
```bash
# Check media type exists
drush eval "echo \Drupal\media\Entity\MediaType::load('worm_state_video') ? '✓' : '✗';"

# Check fields exist
drush eval "
\$f = \Drupal\field\Entity\FieldConfig::loadByName('media', 'worm_state_video', 'field_worm_state_video_file');
echo \$f ? '✓' : '✗';
"

# Count videos
drush eval "
\$count = count(\Drupal::entityQuery('media')
  ->condition('bundle', 'worm_state_video')
  ->accessCheck(FALSE)
  ->execute());
echo 'Videos: ' . \$count;
"
```

### 2. File Storage
```bash
# Check directory exists
ls -la /web/sites/default/files/worm/videos/

# Check file permissions
stat /web/sites/default/files/worm/videos/*.mp4
```

### 3. API Endpoints
```bash
# Test each endpoint
curl http://localhost/api/worm/videos
curl http://localhost/api/worm/video/healthy
curl http://localhost/api/worm/video-states
curl http://localhost/api/worm/video/healthy/exists
```

### 4. Admin Interface
```
Visit: http://localhost/admin/content/media
Should see: "Worm State Video" type available
Can: Create/Edit/Delete video media entities
```

---

## 🐛 Troubleshooting

### Problem: "Media type not found"
**Solution:** Run `drush updatedb` to create schema

### Problem: Upload fails with "File not allowed"
**Solution:** 
- Check `/admin/structure/media/manage/worm_state_video/fields`
- Verify file extension settings include `.mp4`, `.webm`, `.ogg`, `.ogv`

### Problem: API returns 404 for valid state
**Solution:**
- Verify state name is **lowercase** with **underscores** (no spaces)
- Check `/admin/content/media` to verify video was created
- Ensure field_worm_state value matches exactly

### Problem: Video won't play in browser
**Solution:**
- Check browser console for CORS or codec errors
- Try different video format (MP4 most compatible)
- Verify file permissions: `chmod 644 /path/to/video.mp4`

### Problem: "Permission denied" error
**Solution:**
```bash
# Fix file permissions
sudo chown www-data:www-data /web/sites/default/files/worm/videos/ -R
sudo chmod 755 /web/sites/default/files/worm/videos/
sudo chmod 644 /web/sites/default/files/worm/videos/*.mp4
```

---

## 📖 Documentation Files

### Main Documentation
- **VIDEOS.md** (400+ lines)
  - Architecture overview
  - 3 upload methods (Web UI, SFTP, Programmatic)
  - Encoding recommendations
  - JavaScript integration
  - Troubleshooting guide
  - Security notes

- **QUICKSTART_VIDEOS.md** (5-minute setup)
  - Simple step-by-step guide
  - Common states
  - Bulk upload script
  - Quick troubleshooting

- **VIDEO_IMPLEMENTATION.md** (Technical summary)
  - Complete file listing
  - API endpoint reference
  - Usage examples
  - Verification checklist

### Code Files
- **wormchat.videos.inc** (Helper functions)
  - `wormchat_get_video_url()`
  - `wormchat_get_all_videos()`
  - `wormchat_get_video_data()`
  - `wormchat_video_exists()`
  - `wormchat_get_available_states()`

- **WormVideoController.php** (REST API)
  - `getVideoByState()`
  - `getAllVideos()`
  - `getAvailableStates()`
  - `checkVideoExists()`

---

## 🚦 Next Steps

1. **Deploy** - Run `drush updatedb && drush cache:rebuild`
2. **Test** - Visit `/admin/content/media`
3. **Upload** - Add your first video using Web UI
4. **Verify** - Check `/api/worm/videos` endpoint
5. **Integrate** - Call API from your application
6. **Monitor** - Check `/admin/content/media` to manage videos

---

## 📞 Support

- **Questions?** Read VIDEOS.md (comprehensive guide)
- **Quick start?** Read QUICKSTART_VIDEOS.md (5-minute guide)
- **Technical?** Read VIDEO_IMPLEMENTATION.md (API reference)
- **Logs:** `drush watchdog:show`
- **Admin:** `/admin/content/media`

---


