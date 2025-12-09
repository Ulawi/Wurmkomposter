(function (Drupal, $, once) {

  // Create a global namespace for worm-related methods
  window.WormChat = window.WormChat || {};

  // Available worm states (matches ThingsBoard worm_condition values)
  const STATES = ["dry", "wet", "hot", "cold", "hungry", "cnLow", "cnHigh", "happy"];

  /**
   * Fetches the current user's device key from the Drupal backend.
   * The backend securely retrieves this from configuration.
   */
  window.WormChat.getDeviceKey = async function () {
    try {
      const response = await fetch('/api/worm/device-key', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include authentication cookies
      });

      if (!response.ok) {
        console.warn('Failed to fetch device key:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      console.log('Device key fetched successfully');
      return data.deviceKey || data.key;
    } catch (err) {
      console.error('Error fetching device key:', err);
      return null;
    }
  };

  /**
   * Fetches the current worm state from ThingsBoard via Drupal backend.
   */
  window.WormChat.getWormState = async function () {
    console.log("Fetching worm state from ThingsBoard...");
    
    try {
      // Call Drupal endpoint - matches API v1 pattern
      const response = await fetch('/api/v1/worm/state', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn("API request failed:", response.status, response.statusText);
        throw new Error(`API error: ${response.status}`);
      }

      const json = await response.json();
      console.log("API response:", json);

      // API returns { worm_condition: "hot" }
      if (json.worm_condition) {
        const state = json.worm_condition;
        console.log("✓ Worm state from ThingsBoard:", state);
        return state;
      }

      console.warn("No worm_condition data in response");
      throw new Error("No state data in response");

    } catch (err) {
      console.error("Worm state fetch failed:", err);
      return getRandomState();
    }
  };

  // Helper function for random fallback
  function getRandomState() {
    const randomState = STATES[Math.floor(Math.random() * STATES.length)];
    console.log("Fallback random state:", randomState);
    return randomState;
  }

  // --- Fallback mapping (local files in /sites/default/files/worm/) ---
  function fallbackMappingForState(stateKey) {
    // Validate state key exists in STATES
    if (!STATES.includes(stateKey)) {
      console.warn(`Unknown state key: ${stateKey}, using 'hot' as fallback`);
      stateKey = 'hot';
    }
    
    return {
      video: `/sites/default/files/worm/${stateKey}.mp4`,
      thought: `/sites/default/files/pictures/${stateKey}`  // Without extension - resolver will add .png or .jpg
    };
  }

  /**
   * Resolves the correct image path for thought bubble.
   * Checks for both .png and .jpg formats.
   * Falls back to .jpg if .png doesn't exist.
   * 
   * @param {string} basePath - Base path without extension (e.g., '/sites/default/files/pictures/hot')
   * @returns {Promise<string>} - Full path to the thought image
   */
  async function resolveThoughtImagePath(basePath) {
    const pngPath = `${basePath}.png`;
    const jpgPath = `${basePath}.jpg`;

    // Try PNG first
    try {
      const pngResponse = await fetch(pngPath, { method: 'HEAD' });
      if (pngResponse.ok) {
        console.log("✓ Found thought image (PNG):", pngPath);
        return pngPath;
      }
    } catch (err) {
      console.log("PNG not found:", pngPath);
    }

    // Try JPG as fallback
    try {
      const jpgResponse = await fetch(jpgPath, { method: 'HEAD' });
      if (jpgResponse.ok) {
        console.log("✓ Found thought image (JPG):", jpgPath);
        return jpgPath;
      }
    } catch (err) {
      console.log("JPG not found:", jpgPath);
    }

    // If neither exists, default to PNG (will show broken image, but won't error)
    console.warn("No thought image found for state, using default PNG path:", pngPath);
    return pngPath;
  }

  /**
   * Updates the worm's video and thought bubble based on the state key.
   * Only disables button during video playback, not on initial load.
   * 
   * Now supports multiple videos per state by picking a random file.
   * For example, state "hot" will randomly select from: hot.mp4, hot_1.mp4, hot_345.mp4, etc.
   */
  window.WormChat.updateWormState = async function (stateKey, wrapper, helloImg, isInitialLoad = false) {
    if (!wrapper) {
      console.warn("updateWormState called without wrapper element");
      return;
    }

    console.log(`updateWormState called with stateKey: '${stateKey}', isInitialLoad: ${isInitialLoad}`);

    const videoEl = wrapper.querySelector("#worm-video");
    const thoughtImg = wrapper.querySelector("#thought-image");

    // If helloImg not passed, try to find it in wrapper
    if (!helloImg) {
      helloImg = wrapper.querySelector("#helloBtnImage");
    }

    if (!videoEl || !thoughtImg || !helloImg) {
      console.warn("updateWormState: required DOM elements not found", {
        videoEl: !!videoEl,
        thoughtImg: !!thoughtImg,
        helloImg: !!helloImg
      });
      return;
    }

    // ===== NEW: Try to fetch a random video for this state from the server =====
    let videoUrl = null;
    
    try {
      console.log(`Fetching random video for state: '${stateKey}'`);
      const response = await fetch(`/api/worm/video/${encodeURIComponent(stateKey)}/random`);
      
      if (response.ok) {
        const videoData = await response.json();
        videoUrl = videoData.video;
        console.log(`✓ Found random video: ${videoData.filename || stateKey}`);
      } else {
        console.warn(`No videos found for state '${stateKey}' (${response.status}), will use fallback`);
      }
    } catch (err) {
      console.warn(`Failed to fetch random video for state '${stateKey}':`, err);
    }

    // ===== FALLBACK: Use fallback mapping if no video found =====
    if (!videoUrl) {
      const fallback = fallbackMappingForState(stateKey);
      videoUrl = fallback.video;
      console.log(`Using fallback video for state: ${stateKey}`);
    }
    
    // Resolve thought image (checks for PNG and JPG)
    const thoughtUrl = await resolveThoughtImagePath(`/sites/default/files/pictures/${stateKey}`);

    console.log("updateWormState resolved:", { stateKey, videoUrl, thoughtUrl, isInitialLoad });

    // Update video source
    const sourceEl = videoEl.querySelector("source");
    if (sourceEl) {
      sourceEl.src = videoUrl;
    } else {
      // no <source>, set src directly
      videoEl.src = videoUrl;
    }
    videoEl.load();
    videoEl.muted = false;

    // Only disable button and play video if NOT initial load
    if (!isInitialLoad) {
      console.log("✓ Playing video (not initial load):", videoUrl);
      helloImg.classList.add("disabled");
      videoEl.play().catch(err => console.log("Video play prevented or failed:", err));
    } else {
      console.log("Initial load - video ready but not playing");
    }

    // Restore button after finished
    videoEl.onended = () => {
      console.log("Video ended, restoring button");
      helloImg.classList.remove("disabled");
    };

    // Update thought image
    thoughtImg.src = thoughtUrl;
  };

  // --- Helper: fetch WormState entity via JSON:API (expects content type worm_state_video) ---
  async function fetchMediaForState(stateKey) {
    // Try JSON:API endpoint for worm_state_video
    try {
      const url = `/jsonapi/node/worm_state_video?filter[field_state_key][value]=${encodeURIComponent(stateKey)}&page[limit]=1&fields[node--worm_state_video]=field_StateVideoUpload,field_preview_image`;
      console.log("fetchMediaForState: trying JSON:API URL:", url);
      const resp = await fetch(url, { credentials: 'same-origin' });
      if (!resp.ok) {
        console.warn("JSON:API request failed:", resp.status, resp.statusText);
        throw new Error("jsonapi failed");
      }
      const json = await resp.json();
      // JSON:API format - data[0].relationships.field_video_file.data -> included file object
      if (json.data && json.data.length > 0) {
        const item = json.data[0];
        // If file URL in attributes (depends on formatter), try included or attributes
        // Try attr in relationships->field_video_file->links->related->href is not reliable; so search included for file by id
        if (json.included && json.included.length) {
          // Find first included file (type 'file--file' or 'media--file')
          for (const inc of json.included) {
            if (inc.type && (inc.type.startsWith('file--') || inc.type.startsWith('media--'))) {
              // file URL often in attributes.uri.url or attributes.uri.value; try common places
              const attrs = inc.attributes || {};
              if (attrs.uri && (attrs.uri.url || attrs.uri.value)) {
                const fileUrl = attrs.uri.url || attrs.uri.value;
                // JSON:API returns 'public://...' in some setups; convert if necessary
                if (fileUrl.startsWith('public://')) {
                  const path = fileUrl.replace('public://', '/sites/default/files/');
                  console.log("Found file url in included (public://) ->", path);
                  return { video: path };
                } else {
                  console.log("Found file url in included ->", fileUrl);
                  return { video: fileUrl };
                }
              }
              if (attrs.url) {
                console.log("Found file url in included.attrs.url ->", attrs.url);
                return { video: attrs.url };
              }
            }
          }
        }
        // As fallback, some JSON:API setups expose file url in attributes of the node field (rare)
        const nodeAttrs = item.attributes || {};
        if (nodeAttrs.field_video_file && nodeAttrs.field_video_file.length) {
          // field value may have uri
          const f = nodeAttrs.field_video_file[0];
          if (f && f.uri && (f.uri.url || f.uri.value)) {
            const fileUrl = f.uri.url || f.uri.value;
            if (fileUrl.startsWith('public://')) {
              return { video: fileUrl.replace('public://', '/sites/default/files/') };
            }
            return { video: fileUrl };
          }
        }
      }
      throw new Error("No usable file found in JSON:API response");
    } catch (err) {
      console.warn("fetchMediaForState JSON:API failed, fallback will be used:", err);
      return null;
    }
  }

  /**
   * Drupal behavior for the Worm Chat block.
   */
  Drupal.behaviors.wormChat = {
    attach: function (context) {
      once('wormChat', '#chat-wrapper', context).forEach(wrapper => {
        console.log("wormChat behavior attach for wrapper:", wrapper);

        // hello image click
        const helloImg = wrapper.querySelector("#helloBtnImage");
        const learnImg = wrapper.querySelector("#learnBtnImage");
        const feedImg = wrapper.querySelector("#feedBtnImg");
        
        if (helloImg) {
          helloImg.addEventListener("click", async (e) => {
            console.log("helloBtnImage clicked");
            const stateKey = await window.WormChat.getWormState();
            await window.WormChat.updateWormState(stateKey, wrapper, helloImg, false);
          });
        } else {
          console.warn("helloBtnImage not found in wrapper");
        }
        
        if (learnImg) {
          learnImg.addEventListener("click", async (e) => {
            console.log("#learnBtnImage clicked");
            //TODO add logic
          });
        } else {
          console.warn("#learnBtnImage not found in wrapper");
        }
        
        // feed image click
        if (feedImg) {
          feedImg.addEventListener("click", (e) => {
            console.log("#feedBtnImg clicked - navigating to /fuettern");
            window.location.href = '/fuettern';
          });
        } else {
          console.warn("#feedBtnImg not found in wrapper");
        }

        // initial load - load state and thought image WITHOUT playing video or disabling button
        (async () => {
          const stateKey = await window.WormChat.getWormState();
          await window.WormChat.updateWormState(stateKey, wrapper, helloImg, true);
        })();
      });
    }
  };


})(Drupal, jQuery, once);
