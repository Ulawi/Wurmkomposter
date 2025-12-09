# WormChat Module Installation & Usage Guide

## Installation

### Prerequisites
- Drupal 10.x
- PHP 8.0+
- Composer (for dependency management)

### Step 1: Place the Module

Copy the `wormchat` module directory into your Drupal installation:

```bash
cp -r wormchat /path/to/drupal/modules/custom/
```

**For Symlinked Installations:**

If you're using a symlink to the module (e.g., for development):

```bash
ln -s /path/to/wormchat /path/to/drupal/modules/custom/wormchat
```

The module automatically resolves symlinks during installation and operation.

### Step 2: Install the Module

Using Drush:

```bash
drush en wormchat
```

Or via Drupal Admin UI:
1. Navigate to `/admin/modules`
2. Search for "Worm Chat"
3. Check the box and click "Install"

### Step 3: Configure Module Settings

1. Go to `/admin/config/wormchat/settings`
2. Set your ThingsBoard URL (default: `https://thingsboard.cloud`)
3. Save configuration

## Adding Food Items

The module comes with a variety of food items pre-installed. If you wnat to add more or make changes to the existing ones, you have two options. 

### Method 1: Via Drupal Admin UI (Recommended)

1. Navigate to `/admin/content/media`
2. Click "Add media" → Select "Worm Food"
3. Fill in the fields:
   - **Food ID**: Unique identifier (e.g., `redcabbage`)
   - **Food Name**: Display name (e.g., `Rotkohl`)
   - **Food Color**: Color identifier (e.g., `violet`)
   - **Food Category**: Select from available options (e.g. 'Gemüse')
   - **Image**: Upload a food image 
   - **Metadata**: JSON structure with additional data (optoinal)

4. **Metadata Template:**

When you create a new food item, the metadata textarea is pre-filled with this template:

```json
{
  "moisture": "",
  "decomposition_speed": "",
  "nutrient_profile": "",
  "sensor_fingerprint": {
    "smell": "",
    "temperature_change": "",
    "pH_effect": "",
    "moisture_effect": ""
  },
  "user_guidance": {
    "do": [],
    "dont": []
  }
}
```

5. Complete the metadata fields:
   - `moisture`: "low", "medium", or "high"
   - `decomposition_speed`: "slow", "medium", or "fast"
   - `nutrient_profile`: Describe the nutrient content
   - `sensor_fingerprint`: How the food affects sensor readings
   - `user_guidance.do`: Array of recommended practices
   - `user_guidance.dont`: Array of practices to avoid

6. Click "Save"

### Method 2: Direct JSON File Creation

You can also add food items by creating JSON files directly in the `assets/foods` directory:

```bash
vim /path/to/wormchat/assets/foods/redcabbage.json
```

**Example File:**

```json
{
    "id": "redcabbage",
    "name": "Rotkohl",
    "color": "violet",
    "category": "vegetable",
    "moisture": "medium",
    "decomposition_speed": "medium",
    "nutrient_profile": "c to n ratio 20",
    "sensor_fingerprint": {
        "smell": "mild vegetable smell, increases over time",
        "temperature_change": "slight exothermic decomposition",
        "pH_effect": "acidic (pH 4-5)",
        "moisture_effect": "medium moisture content"
    },
    "user_guidance": {
        "do": [
            "Chop into small pieces for faster decomposition",
            "Mix with dry materials",
            "Add water if it becomes too dry"
        ],
        "dont": [
            "Add whole heads without chopping",
            "Mix with meat or dairy",
            "Compact too tightly"
        ]
    }
}
```

**Important:** After adding files directly, create the corresponding media entity in Drupal so the system tracks them.

### Automatic JSON Generation

When you save a food item via the Drupal admin UI, the module automatically:
1. Validates all required fields
2. Creates/updates a JSON file in `assets/foods/{food_id}.json`
3. Logs the operation for debugging

Check `/admin/reports/dblog` to verify successful creation.

---

## Adding Video Items

See the Quickstart_viedeos file.

## Troubleshooting

### JSON Files Not Created

1. Check file permissions on `assets/foods/` directory:
   ```bash
   chmod 755 /path/to/wormchat/assets/foods
   ```

2. Check Drupal logs at `/admin/reports/dblog` for error messages

3. Verify all mandatory fields are filled in when saving

### Symlink Issues

If the module is installed via symlink and path resolution fails:

```bash
# Verify the symlink is valid
ls -la /path/to/drupal/modules/custom/wormchat

# Clear Drupal cache
drush cache-rebuild

# Check logs
drush watchdog:tail
```

### Duplicate Food ID Error

The module prevents duplicate food IDs. If you get an error:
1. Use a unique ID (e.g., `ornamental_kale`)
2. Or edit the existing item instead of creating a new one

---

## Development Notes

- Module hooks: See `wormchat.module` for implementation details
- REST endpoints: Defined in `wormchat.routing.yml`
- Theme templates: Located in `templates/` directory
- Settings: Configure at `/admin/config/wormchat/settings`

---

## Support & Logs

View module operations and errors:

```bash
# Drush logs
drush watchdog:tail wormchat

# Via admin UI
# Navigate to: /admin/reports/dblog
# Filter by "Worm Chat" type
```