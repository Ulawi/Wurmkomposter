# Quick Start: Upload Your First Worm State Video

This is a simplified guide to get videos up and running.

## Prerequisites
- ✅ WormChat module installed
- ✅ Drupal 10 running
- ✅ Video file (MP4 recommended)

## 5-Minute Setup

### 1. Convert Video to MP4 (if needed)
```bash
ffmpeg -i your_video.mov -c:v libx264 -preset slow -crf 22 \
        -c:a aac -b:a 192k healthy_worm.mp4
```

### 2. Go to Media Admin
Visit: `http://your-site.de/admin/content/media`

### 3. Click "+ Add media"

### 4. Select "Worm State Video"

### 5. Upload & Fill Form
- **Video File:** Upload `healthy_worm.mp4`
- **Worm State:** `dry` (or wet, hot, cold, hungry, cnLow, cnHigh, satt, dry+hot, dry+cold, dry+hungry, ..., happy)
- **Description:** "Wurm erklärt, welches Futter den CN wert hebt." (optional)

### 6. Click "Save"

### 7. Test API
Visit: `http://your-site.local/api/worm/video/dry`

Should return JSON with video URL!

## Success! 🎉

Your video is now available at:
```
/api/worm/video/dry
```

## Use in JavaScript
```javascript
fetch('/api/worm/video/dry')
  .then(r => r.json())
  .then(data => {
    console.log('Video URL:', data.url);
    
    // Create video player
    const video = document.createElement('video');
    video.src = data.url;
    video.play();
  });
```

## Bulk Upload

To upload multiple videos quickly:

```bash
# Create directory
mkdir -p ~/worm_videos

# Convert all MOV files to MP4
cd ~/worm_videos
for file in *.mov; do
  ffmpeg -i "$file" -c:v libx264 -preset slow -crf 22 \
          -c:a aac -b:a 192k "${file%.*}.mp4"
done

# Upload all MP4 files
sftp user@host << EOF
cd /web/sites/default/files/worm/videos/
mput *.mp4
EOF
```

Then create media entities using Drush:

```bash
drush ev "
\$videos = [
  ['file' => 'healthy_worm.mp4', 'state' => 'healthy'],
  ['file' => 'sick_worm.mp4', 'state' => 'sick'],
  ['file' => 'dormant_worm.mp4', 'state' => 'dormant'],
];

foreach (\$videos as \$v) {
  \$file = \Drupal\file\Entity\File::create([
    'filename' => \$v['file'],
    'uri' => 'public://worm/videos/' . \$v['file'],
    'status' => 1,
  ]);
  \$file->save();

  \$media = \Drupal\media\Entity\Media::create([
    'bundle' => 'worm_state_video',
    'name' => ucfirst(\$v['state']) . ' Worm',
    'field_worm_state_video_file' => ['target_id' => \$file->id()],
    'field_worm_state' => \$v['state'],
  ]);
  \$media->save();
  echo 'Created: ' . \$v['state'] . \"\n\";
}
"
```

---

## Troubleshooting

**Error: "No video found"**
- Check state name is lowercase
- Verify video was saved in Drupal

**API returns 404**
- Visit `/admin/content/media` to see videos
- Ensure state field is filled

**Video won't play**
- Check file format (must be MP4/WebM/OGV)
- Look in browser console for errors

---

## Full Documentation

For detailed setup, see: `/wormchat/VIDEOS.md`

