# 🎬 WormChat Video System - Documentation Index

## Quick Navigation

### 🚀 **I want to get started now**
→ Read: **[QUICKSTART_VIDEOS.md](QUICKSTART_VIDEOS.md)** (5 minutes)

### 📚 **I want complete documentation**
→ Read: **[VIDEOS.md](VIDEOS.md)** (comprehensive guide with all options)


### 📋 **I want technical reference**
→ See: **[VIDEO_IMPLEMENTATION.md](VIDEO_IMPLEMENTATION.md)**

### 📖 **I want the summary overview**
→ Read: **[README_VIDEOS.md](README_VIDEOS.md)**

---

## 📁 What's in This Directory

### Documentation Files (5 files)
```
QUICKSTART_VIDEOS.md            ← START HERE (5-minute setup)
VIDEOS.md                       ← Comprehensive guide (400+ lines)
VIDEO_IMPLEMENTATION.md         ← Technical summary
README_VIDEOS.md                ← Complete overview
```

### Code Files
```
wormchat.videos.inc             ← Helper PHP functions
src/Controller/
    └── WormVideoController.php ← REST API endpoints
```

### Configuration Files (Modified)
```
wormchat.install                ← Database schema (video media type)
wormchat.routing.yml            ← API routes
```

## 🎯 Choose Your Path

### Path 1: **Quick Start (5 min)**
1. Read: **QUICKSTART_VIDEOS.md**
2. Upload 1 video via `/admin/content/media`
3. Test: `curl /api/worm/video/healthy`
4. Done! ✅

### Path 2: **Full Setup (30 min)**
1. Read: **VIDEOS.md** (Method 1: Web UI)
2. Run: `drush updatedb && drush cache:rebuild`
3. Upload 4+ videos (healthy, sick, dormant, hungry)
4. Test all API endpoints
5. Integrate into application

### Path 3: **Bulk Upload (15 min)**
1. Read: **VIDEOS.md** (Method 2: SFTP/Drush)
2. Convert videos: `ffmpeg -i input.mov ... output.mp4`
3. Upload via SFTP to `/web/sites/default/files/worm/videos/`
4. Create media entities via Drush
5. Test API endpoints

### Path 4: **Programmatic Integration**
1. Read: **VIDEOS.md** (Method 3: PHP Code)
2. Use `wormchat_get_video_url()` function in your code
3. Or call REST API: `fetch('/api/worm/video/healthy')`
4. Integrate video playback into your app

### Path 5: **Deployment (Production)**
1. Read: **DEPLOYMENT_CHECKLIST.md**
2. Follow each step systematically
3. Verify each step
4. Rollback procedure if needed

---

## 🚀 Quick Commands

```bash
# Deploy to production
cd /home/cazz2/wurmsites/wurm-drupal10-site
drush updatedb
drush cache:rebuild

# Test API
curl http://localhost/api/worm/videos
curl http://localhost/api/worm/video/happy

# Create video via Drush
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

# List videos
drush eval "
\$videos = \Drupal::entityQuery('media')
  ->condition('bundle', 'worm_state_video')
  ->accessCheck(FALSE)
  ->execute();
foreach (\$videos as \$id) {
  \$m = \Drupal\media\Entity\Media::load(\$id);
  echo \$m->field_worm_state->value . \": \" . \$m->label() . \"\n\";
}
"

# Clear cache
drush cache:rebuild

# Show logs
drush watchdog:show
```

---

## 📊 System Overview

```
User Browser                          Drupal Server
    ↓                                        ↓
    └─→ fetch('/api/worm/video/happy')    │
            ↓                                │
            └─→ WormVideoController.php ←───┘
                    ↓
                    Query: Media (worm_state_video)
                    where state = 'happy'
                    ↓
                    Return: { url, title, description, ... }
                    ↓
            ← JSON Response ←
    ↓
Play <video src="...">
```

### Files Stored
```
/web/sites/default/files/worm/videos/
├── healthy_worm.mp4
├── sick_worm.mp4
├── dormant_worm.mp4
└── hungry_worm.mp4
```

### Database
```
media (bundle: worm_state_video)
├── field_worm_state_video_file → Points to file
├── field_worm_state → "healthy", "sick", etc
└── field_worm_state_description → Optional text
```

### API Endpoints
```
GET /api/worm/videos                  → All videos
GET /api/worm/video/{state}           → Specific video
GET /api/worm/video-states            → List of states
GET /api/worm/video/{state}/exists    → Check if exists
```

---

## ✨ Features

✅ **Media Management**
- Create/Edit/Delete videos via Drupal admin
- Web UI at `/admin/content/media`
- Support for MP4, WebM, OGG formats

✅ **REST API**
- 4 endpoints for different use cases
- JSON responses
- CORS-friendly

✅ **Helper Functions**
- `wormchat_get_video_url()` - Get URL by state
- `wormchat_get_all_videos()` - Get all videos
- `wormchat_get_video_data()` - Get full data
- `wormchat_video_exists()` - Check if exists
- `wormchat_get_available_states()` - List states

✅ **Documentation**
- 400+ lines of guides
- 3 upload methods
- Encoding examples
- JavaScript integration
- Troubleshooting

---

## 📖 Documentation Hierarchy

```
1. QUICKSTART_VIDEOS.md          (Start here - 5 min)
   ↓
2. VIDEOS.md                     (Deep dive - 30 min)
   ├─ Architecture
   ├─ 3 upload methods
   ├─ Video encoding
   ├─ Integration examples
   └─ Troubleshooting
   ↓
3. README_VIDEOS.md              (Complete summary)
   ├─ What was implemented
   ├─ API reference
   ├─ Code examples
   └─ Verification checklist
   ↓
4. VIDEO_IMPLEMENTATION.md       (Technical details)
   ├─ File listing
   ├─ API endpoints
   └─ Usage examples

```

---

## 🎬 Video States Reference

```
happy           Everything is fine
cold            Temperature is too low
hot             Temperature is too high
hungry          Needs food
dry             Soil needs more moisture
wet             Soil contains too much water
cnHigh          Last foods containesd too much carbon
cnLow           Last foods contained too much nitrogen

Combinations of states are also possible: wet_hot, cold_dry, ... happy can not be combined, nor can clod+hot, wet+dry or cnHigh+cnLow

Custom states:  Add any custom state you need! But be aware, the states mut be added to Thingsboard, too. Thingsboard does the logic of what states the worms are in. 
```

---

## 🔍 Verification Checklist

After setup, verify:

- [ ] Media type `worm_state_video` exists
- [ ] Fields created (file, state, description)
- [ ] Directory `/web/sites/default/files/worm/videos/` exists
- [ ] Can access `/admin/content/media`
- [ ] Can upload video via Web UI
- [ ] Can query `/api/worm/videos` endpoint
- [ ] Can get specific state: `/api/worm/video/healthy`
- [ ] Can list states: `/api/worm/video-states`
- [ ] Can check existence: `/api/worm/video/healthy/exists`

---

## 📞 Need Help?

### For Quick Questions
→ See: **QUICKSTART_VIDEOS.md**

### For Detailed Information
→ See: **VIDEOS.md**

### For Troubleshooting
→ Search: **VIDEOS.md** "Troubleshooting" section

### For Logs
```bash
drush watchdog:show
```

### For API Testing
```bash
curl http://localhost/api/worm/videos
curl http://localhost/api/worm/video/healthy
curl http://localhost/api/worm/video-states
```

---

## 🎉 You're All Set!

Everything is implemented and documented. Choose your path above and get started!

**Questions?** Read the appropriate documentation file based on what you need.

