(function (Drupal) {
  'use strict';

  Drupal.wormSetup = Drupal.wormSetup || {};

  /**
   * Handles device provisioning after firmware flash.
   * Called by the ESP device after it receives a token from ThingsBoard.
   */
  window.WormSetup = window.WormSetup || {};

  window.WormSetup.provisionToken = async function (token) {
    const setupApiUrl = drupalSettings.wormchat.setupApiUrl || '/api/wormchat/device-provision';
    const statusDiv = document.getElementById('setup-status');
    const statusMessage = document.getElementById('status-message');

    if (!statusDiv || !statusMessage) {
      console.error('Setup status elements not found');
      return false;
    }

    // Show loading state
    statusDiv.style.display = 'block';
    statusDiv.className = 'setup-status loading';
    statusMessage.textContent = Drupal.t('Configuring your device...');

    try {
      const response = await fetch(setupApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token: token,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        statusDiv.className = 'setup-status success';
        statusMessage.innerHTML = '<strong>' + Drupal.t('✓ Success!') + '</strong><br>' +
          Drupal.t('Your device is now configured and connected.');

        // Log success
        console.log('Device provisioned successfully:', result);

        // Optionally redirect after a delay
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);

        return true;
      } else {
        statusDiv.className = 'setup-status error';
        statusMessage.innerHTML = '<strong>' + Drupal.t('Error:') + '</strong><br>' +
          (result.error || Drupal.t('Failed to configure device'));

        console.error('Provisioning failed:', result);
        return false;
      }
    } catch (error) {
      statusDiv.className = 'setup-status error';
      statusMessage.innerHTML = '<strong>' + Drupal.t('Network Error:') + '</strong><br>' +
        error.message;

      console.error('Provisioning request failed:', error);
      return false;
    }
  };

  /**
   * Listen for postMessage from the embedded web serial interface.
   * This allows the ESP Web Tools component to communicate provisioning results.
   */
  window.addEventListener('message', function (event) {
    // Validate origin for security
    if (event.origin !== window.location.origin) {
      return;
    }

    const data = event.data;

    // Handle provisioning token from ESP
    if (data.type === 'WORM_DEVICE_TOKEN') {
      console.log('Received device token from ESP:', data.token);
      window.WormSetup.provisionToken(data.token);
    }

    // Handle flash completion
    if (data.type === 'WORM_FLASH_COMPLETE') {
      console.log('Firmware flash completed');
      const statusDiv = document.getElementById('setup-status');
      const statusMessage = document.getElementById('status-message');

      if (statusDiv && statusMessage) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'setup-status loading';
        statusMessage.textContent = Drupal.t('Waiting for device to provision...');
      }
    }
  });

  /**
   * Monitor ESP Web Tools install button for completion.
   * When the component reports success, show status.
   */
  Drupal.behaviors.wormSetupPage = {
    attach: function (context, settings) {
      // Wait for ESP Web Tools component to load
      const espButton = context.querySelector('esp-web-install-button');

      if (espButton) {
        // Listen for successful flash completion
        espButton.addEventListener('webserial-success', function (event) {
          console.log('Firmware flashed successfully');
          const statusDiv = document.getElementById('setup-status');
          if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.className = 'setup-status loading';
            statusDiv.querySelector('#status-message').textContent =
              Drupal.t('Device is configuring... Please wait.');
          }
        });

        // Listen for errors
        espButton.addEventListener('webserial-error', function (event) {
          console.error('Flash error:', event.detail);
          const statusDiv = document.getElementById('setup-status');
          if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.className = 'setup-status error';
            statusDiv.querySelector('#status-message').textContent =
              Drupal.t('Error during firmware flash. Please try again.');
          }
        });
      }
    },
  };

}(Drupal));
