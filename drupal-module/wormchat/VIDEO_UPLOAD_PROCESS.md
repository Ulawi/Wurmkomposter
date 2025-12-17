# Video Upload Process - State-Based Organization

## Overview

The wormchat module organizes worm state videos in a simple, folder-based structure. Videos are stored in state-specific subdirectories, and the media name field is used only for display/organization in the Drupal admin interface.

---

## Directory Structure

### Storage Organization
```
/web/sites/default/files/worm/videos/
├── cold/
│   ├── eating.mp4
│   ├── sleeping.mp4
│   └── moving.mp4
├── hot/
│   ├── eating.mp4
│   └── resting.mp4
├── dry/
│   ├── response.mp4
│   └── curling.mp4
├── wet/
│   └── active.mp4
└── hungry/
    ├── searching.mp4
    └── feeding.mp4
```

### Key Principle
**Any file in a state folder belongs to that state, regardless of its filename.** Files can be named anything - the folder name determines the state.

---

## Media Entity Storage

### User Input (Stored in Database)
- **Name**: The media entity name field (e.g., `eating`, `resting`, `movement`)
  - This is saved to the database (standard Drupal media entity name)
  - Used for organizing and displaying media in the admin interface
  - Auto-incremented if duplicate: `eating` → `eating_1` → `eating_2`
- **State**: The worm state field (e.g., `cold`, `hot`, `dry`, `wet`, `hungry`)
  - Stored in the database (`field_worm_state`)
  - Determines which state folder the video goes into
- **File**: The actual uploaded video file
  - Stored in `/worm/videos/{state}/` subdirectory
  - **Filename is NOT stored in database** - any name is fine
  - **Folder location (state) determines state**, not the filename




---

## Implementation Details

### 1. Form Fields (Drupal Media Type: worm_state_video)

The worm state video media type has the following fields:

**Standard Drupal Fields:**
- **name** - The media entity name (displayed in admin interface for organization)

**Custom Fields:**
- **field_worm_state** - String field storing the worm state (cold, hot, etc.)
- **field_worm_state_video_file** - File field for the uploaded video

### 2. Form Submission Hooks (wormchat.module)

When a video form is submitted, the following sequence occurs:

**Validation Phase:**
- `wormchat_validate_video_name_unique()` - Validates that the media name field is not empty
- Standard Drupal file upload validation (format, size, etc.)

**Submit Handler Phase:**
- `wormchat_organize_video_by_state()` - Main upload processing function

### 3. Upload Organization Handler (wormchat.module)

The `wormchat_organize_video_by_state()` function:

1. Gets the **state** value from `field_worm_state`
2. Gets the **name** from the media entity's name property
3. Calls `_wormchat_get_unique_media_name()` to check if name is unique in database
4. If collision detected, auto-increments name (e.g., `eating` → `eating_1`)
5. Calls `_wormchat_move_file_to_state_folder()` to move file to state subfolder
6. Updates the media entity with the final unique name
7. Saves the updated media entity back to database

### 4. Name Uniqueness Handler (wormchat.module)

The `_wormchat_get_unique_media_name($base_name, $media_id)` function:

1. Queries database for existing worm_state_video media with the same name
2. If no collision found, returns the base name as-is
3. If collision found, increments a counter until finding an unused name
4. Returns the final unique media name (e.g., `eating`, `eating_1`, `eating_2`)

### 5. File Organization Logic (wormchat.module)

The `_wormchat_move_file_to_state_folder($file, $state)` function:

1. Ensures the state folder exists: `/web/sites/default/files/worm/videos/{state}/`
2. Creates the folder if it doesn't exist
3. Moves the uploaded file to: `/web/sites/default/files/worm/videos/{state}/{original_filename}`
4. Updates the Drupal file entity URI to reflect new location
5. Logs the operation for debugging

**Key Point**: Filename is preserved from upload - we don't rename it. The state is determined by folder location.

### 6. Database Fields

The `worm_state_video` media bundle stores the following fields:

| Field Name | Type | Stored? | Purpose |
|-----------|------|---------|---------|
| **name** | String (Standard Drupal) | Yes | Media entity name for admin organization. Auto-incremented if duplicate (e.g., `eating`, `eating_1`, `eating_2`). |
| **field_worm_state_video_file** | File | Yes | The actual video file (.mp4, .webm, .ogg, .ogv) |
| **field_worm_state** | String | Yes | The worm state (e.g., "cold", "hot"). Determines folder location. |
| **field_worm_state_description** | Text | Yes | Optional detailed description of the video |
| **File Location** | - | No | Derived from state and filename: `/worm/videos/{state}/{filename}`. NOT stored in database. |

**Key Points**: 
- Media names are globally unique; auto-incremented with `_{number}` suffix if collision detected
- **Filename is NOT modified** - uploaded file retains original name
- **Folder location determines state**, not the filename
- Database stores: media name (unique) + state + file entity (with new path)

---

## Upload Flow

### Step 1: User Creates Video Media Entity
User navigates to `/admin/content/media/create/worm_state_video`

### Step 2: Fill Form
```
Media Name:          "eating"  ← Name for this video (for admin organization)
Worm State:          "cold"    ← State folder where this video goes
File upload:         my_video.mp4 ← Any filename is fine
```

### Step 3: Submit Form
User clicks "Save"

### Step 4: System Processing
1. **Validation**: Checks that name field is not empty
2. **Save Media Entity**: Drupal saves initial media entity
3. **Check Uniqueness**: Query database to verify "eating" is unique
4. **Move File**: File moved to `/web/sites/default/files/worm/videos/cold/my_video.mp4`
5. **Auto-increment if needed**: If "eating" already exists, rename to "eating_1"
6. **Update Entity**: Media entity updated with final unique name
7. **Save Again**: Updated media entity persisted to database

### Step 5: Result
- Media entity saved in database with name and state
- Video file is stored at: `/sites/default/files/worm/videos/cold/my_video.mp4`
- Admin can see organized list of videos with their names and states

---

## Video Playback Integration

Once the file is moved to the state folder, it becomes available for the video playback system:

### Backend (wormchat.videos.inc)
The `wormchat_get_random_video_by_state()` function:
1. Scans state-specific folder: `/sites/default/files/worm/videos/{state}/`
2. Finds all `.mp4` files in that folder
3. Randomly selects one file (any filename works)
4. Returns the URL to the selected file

### Frontend (js/wormchat.js)
When the chatwindow needs to display a video for state "cold":
```javascript
fetch('/api/worm/video/cold/random')
  .then(response => response.json())
  .then(data => {
    // data.video contains the file URL
    // e.g., "/sites/default/files/worm/videos/cold/my_video.mp4"
    video.src = data.video;
  })
```

---

## Scenarios and Examples

### Scenario 1: New Video Upload
```
User uploads:      state="cold", name="eating", file="my_video.mp4"
System validates:  name "eating" is unique ✓
System moves:      my_video.mp4 → /worm/videos/cold/my_video.mp4
Storage path:      /web/sites/default/files/worm/videos/cold/my_video.mp4
Database entry:    name="eating", state="cold"
Public URL:        /sites/default/files/worm/videos/cold/my_video.mp4
```

### Scenario 2: Duplicate Name
```
User uploads:      state="hot", name="eating", file="another.mp4"
System checks DB:  "eating" already exists in worm_state_video ✗
System auto-increments: "eating" → "eating_1"
System moves:      another.mp4 → /worm/videos/hot/another.mp4
Database entry:    name="eating_1", state="hot"
Public URL:        /sites/default/files/worm/videos/hot/another.mp4
```

### Scenario 3: Multiple Videos with Different States
```
Directory:         /web/sites/default/files/worm/videos/
Structure:
  cold/
    - eating.mp4
    - sleeping.mp4
    - running.mp4
  hot/
    - active.mp4
    - resting.mp4
  dry/
    - buried.mp4

When API requests: /api/worm/video/cold/random
Scans:             /worm/videos/cold/ for *.mp4
Finds:             [eating.mp4, sleeping.mp4, running.mp4]
Random select:     sleeping.mp4 (example)
Return:            /sites/default/files/worm/videos/cold/sleeping.mp4
```

---

## Logging and Debugging

All operations are logged to Drupal's watchdog log at `Reports → Recent Log Messages`:

```
[wormchat] Moved video file to cold folder: eating.mp4
[wormchat] Auto-incremented media name to eating_1
[wormchat] Failed to move video file to state folder
```

To check logs via Drush:
```bash
ddev drush watchdog:show --type=wormchat
```

---

## Error Handling

### Scenario: File Move Fails
- **Cause**: Permission issues, disk space, or file I/O error
- **User Message**: "Failed to organize video file. Please contact administrator."
- **Log Entry**: Error logged with state, filename, and error details

### Scenario: State Folder Cannot Be Created
- **Cause**: Permission issues in `/web/sites/default/files/` directory
- **Behavior**: Directory creation attempted, error logged if it fails
- **Log Entry**: Info or error logged depending on result

### Scenario: Missing Fields
- **Cause**: State or name field not filled
- **User Message**: "Media name is required." (validation message)
- **Result**: Form submission is prevented, user must fill all required fields

---

## Performance Considerations

- **File Movement**: Uses standard PHP file operations (atomic, fast)
- **Duplicate Check**: Simple database query on media name (indexed, fast)
- **Directory Checks**: File system operations (minimal overhead)
- **No Complex Logic**: All operations are straightforward and efficient

---

## Maintenance

### To Verify Files Are Stored Correctly
```bash
ls -la /web/sites/default/files/worm/videos/
# Should show state subdirectories: cold, hot, dry, wet, hungry, healthy, sick, dormant, cnhigh, cnlow

ls -la /web/sites/default/files/worm/videos/cold/
# Should show video files: eating.mp4, sleeping.mp4, etc.
```

### To Check File Permissions
```bash
stat /web/sites/default/files/worm/videos/cold/eating.mp4
# Should be readable and writable by web server user
```

### To Reset or Clean Up Videos
```bash
# Remove all video files (if needed)
rm -rf /web/sites/default/files/worm/videos/*

# Or remove specific state folder
rm -rf /web/sites/default/files/worm/videos/cold/
```

### To Verify State Folders Were Created
```bash
# After module installation
ls /web/sites/default/files/worm/videos/
# Should output:
# cold
# cnhigh
# cnlow
# dormant
# dry
# healthy
# hot
# hungry
# sick
# wet
```

# Recreate directory
mkdir -p /web/sites/default/files/worm/videos
chmod 755 /web/sites/default/files/worm/videos
```

---

## Future Enhancements

Possible improvements:
1. **Video Validation**: Check video format/duration before renaming
2. **Filename Sanitization**: Remove special characters from state/name
3. **Automatic Transcoding**: Convert uploaded files to standardized format
4. **Thumbnail Generation**: Create auto-generated thumbnails for admin interface
5. **Soft Delete**: Archive instead of immediately deleting old files
6. **Version Control**: Track which videos were uploaded when by which user
