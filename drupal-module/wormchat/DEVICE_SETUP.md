# Device Setup & Token Provisioning Architecture

## Overview

The WormChat module implements a secure device provisioning flow for ESP32-C3 sensors. Users can set up their IoT device to monitor worm composting conditions without manually entering sensitive ThingsBoard access tokens.

## Architecture

Device tokens are stored in Drupal's **Key-Value Store**.

### Helper Functions

Three helper functions manage token access:

#### `wormchat_get_device_token($uid)`
Retrieves a user's device token.

```php
// Example usage
$token = wormchat_get_device_token($user->id());
if (!$token) {
  // User hasn't set up device yet
}
```

**Returns:** Token string or NULL if not found

#### `wormchat_set_device_token($uid, $token)`
Stores a device token for a user.

```php
// Example usage
if (wormchat_set_device_token($user->id(), $thingsboard_token)) {
  // Token saved successfully
}
```

**Returns:** TRUE on success, FALSE on failure

#### `wormchat_delete_device_token($uid)`
Removes a user's device token (useful for device deprovisioning).

```php
// Example usage
wormchat_delete_device_token($user->id());
```

**Returns:** TRUE on success, FALSE on failure

## Setup Flow

### 1. User Registration

User creates account via `/user/register`:
- Email/username/password only
- User receives confirmation email

### 2. Device Setup Page

After login, user visits `/setup`:
- Displays current provisioning status
- If token exists: "✓ Device is configured"
- If no token: Shows flashing instructions

### 3. Firmware Flashing

User clicks "Flash Firmware" button:
- ESP Web Tools component loads
- User selects COM port for ESP32-C3
- Firmware flashes over USB serial connection
- Device restarts with new provisioning firmware

### 4. Device Provisioning

Freshly flashed ESP32-C3:
1. Attempts to connect to WiFi (stored credentials)
2. Sends provisioning request to **ThingsBoard**
3. ThingsBoard issues access token
4. Device sends token to Drupal API endpoint
5. Drupal stores token in key-value store

### 5. Device Ready

Device now has stored token and can:
- Send telemetry to ThingsBoard
- Receive commands from dashboard
- User can monitor from `/worm-chat` page

## API Endpoints

### Device Provisioning Endpoint

**POST** `/api/wormchat/device-provision`

Request body:
```json
{
  "token": "ThingsBoard access token received from device provisioning"
}
```

Response (success):
```json
{
  "success": true,
  "message": "Device provisioned successfully!",
  "user_id": 123
}
```

Response (error):
```json
{
  "error": "Invalid request format"
}
```

**Authentication:** Requires logged-in user

### Get Device Key Endpoint

**GET** `/api/v1/user/device-key`

Returns authenticated user's device token (used by JavaScript).

Response:
```json
{
  "deviceKey": "ThingsBoard access token"
}
```

**Authentication:** Requires logged-in user

### Get Worm State Endpoint

**GET** `/api/v1/worm/state`

Fetches current worm condition from ThingsBoard using stored device token.

Response:
```json
{
  "worm_condition": "cold"
}
```

Valid values: `cold`, `hot`, `dry`, `wet`, `hungry`, `happy`, `cnhigh`, `cnlow` and all sensible combinations of 2: 'cold_wet', but not 'dry_wet'

## Integration Points

### TelemetryController

All three endpoints use `wormchat_get_device_token()`:
- `sendTelemetry()` - Sends feeding/condition data
- `getDeviceKey()` - Returns token for JavaScript
- `getWormState()` - Fetches state from ThingsBoard

### WormSetupController

Two endpoints handle provisioning:
- `setupPage()` - Displays setup UI and checks token existence
- `provisionDevice()` - Receives token from device and calls `wormchat_set_device_token()`

### JavaScript Libraries

**wormchat.js:**
- Calls `/api/worm/device-key` to retrieve token
- Uses token to fetch state from ThingsBoard

**wormSetup.js:**
- Handles ESP Web Tools component interactions
- Sends token to `/api/wormchat/device-provision` on flash complete

**wormFeeding.js:**
- Calls `/api/wormchat/telemetry` to send feeding data
- Uses device token to send to ThingsBoard

## Device Token Lifecycle


1. User Registration
   └─> User created without token

2. Device Setup Page
   └─> User visits /setup

3. Firmware Flash
   ├─> ESP Web Tools component appears
   └─> User flashes fresh firmware

4. Device Provisioning (on ESP32-C3)
   ├─> Device connects to ThingsBoard
   ├─> ThingsBoard issues access token
   └─> Device sends token to /api/wormchat/device-provision

5. Token Storage (in Drupal)
   └─> wormchat_set_device_token($uid, $token)
       └─> Stored in keyvalue store

6. Token Retrieval (when needed)
   ├─> wormchat_get_device_token($uid)
   ├─> Used for telemetry: sendTelemetry()
   └─> Used for state: getWormState()

7. Token Lifecycle Management
   ├─> Token rotation: Flash new device
   ├─> Token revocation: wormchat_delete_device_token()
   └─> Token check: Verify existence before operations
```


## Troubleshooting

### "No device token configured" error
- Device hasn't been provisioned yet
- User needs to visit `/setup` and flash firmware
- Check `/api/wormchat/device-provision` was called successfully

### Token not persisting
- Check Drupal key-value store is functioning
- Verify no errors in watchdog logs
- Clear caches: `drush cache:rebuild`

### Device provisioning fails
- Verify device can reach ThingsBoard endpoint
- Check ThingsBoard provisioning is enabled
- Verify firmware has correct provisioning credentials

## Future Enhancements

- [ ] Token expiration/refresh mechanism
- [ ] Token rotation policies
- [ ] Multiple device support per user
- [ ] Device token audit logging
- [ ] Admin interface for token management
- [ ] Encrypted key-value backend support
