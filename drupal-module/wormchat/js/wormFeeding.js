(function (Drupal, $, once) {
  console.log('===== wormFeeding.js LOADED =====');

  // ===== CENTRALIZED COLOR CONFIGURATION =====
  const FOOD_COLORS = {
    'red': { hex: '#e33745ff', label: 'Red' },
    'orange': { hex: '#f68a2aff', label: 'Orange' },
    'yellow': { hex: '#f3cc39ff', label: 'Yellow' },
    'green': { hex: '#95d33eff', label: 'Green' },
    'blue': { hex: '#0c1a57ff', label: 'Blue' },
    'violet': { hex: '#933a6bff', label: 'Violet' },
    'brown': { hex: '#47240bff', label: 'Brown' },
    'black': { hex: '#000000ff', label: 'Black' },
    'white': { hex: '#f2f5f7ff', label: 'White' }
  };

  // ===== EXPOSE COLOR CONFIG TO GLOBAL SCOPE FOR TWIG =====
  window.WormFeedingColors = FOOD_COLORS;  // ===== NEW: Make available to Twig via drupalSettings or direct access =====

  Drupal.behaviors.wormchatFeeding = {
    attach: function (context) {
      console.log('===== Drupal.behaviors.wormchatFeeding.attach CALLED =====', context);

      const wrappers = once('wormchat-feeding', '#feeding-wrapper', context);
      console.log('Wrappers found:', wrappers.length);

      wrappers.forEach((wrapper) => {
        console.log('Processing wrapper:', wrapper);
        initFeeding(wrapper);
      });
    }
  };

  /**
   * Initializes the worm feeding interface with unified Pointer Events.
   * SIMPLIFIED approach: Listen on document, unified pointer events for mouse/touch/pen.
   */
  function initFeeding(wrapper) {
    console.log('===== initFeeding STARTED =====', wrapper);

    // ===== DOM ELEMENT REFERENCES =====
    const board = wrapper.querySelector('#boardItems');
    const galleryScroll = wrapper.querySelector('.food-gallery-scroll');  // ===== FIX: Select OUTER container for border =====
    const gallery = wrapper.querySelector('.food-gallery-grid');  // ===== Keep this for querying food items =====
    const cups = wrapper.querySelectorAll('.cup');
    const chopBtn = wrapper.querySelector('#chopBtn');
    const feedingDone = wrapper.querySelector('#feedingDone');
    const choppingBoard = wrapper.querySelector('#choppingBoard');

    console.log('Elements found:', { board: !!board, galleryScroll: !!galleryScroll, gallery: !!gallery, cups: cups.length, chopBtn: !!chopBtn, feedingDone: !!feedingDone, choppingBoard: !!choppingBoard });

    // ===== VALIDATION: Check that all critical elements exist =====
    if (!board || !galleryScroll || !gallery || !chopBtn || !feedingDone || !choppingBoard || cups.length === 0) {  // ===== FIX: Check for galleryScroll =====
      console.error('Worm feeding: Required elements not found');
      return;
    }

    console.log('===== All elements validated, setting up handlers =====');

    // ===== STATE TRACKING =====
    const boardItems = new Map();
    let fedMaterials = [];
    let selectedCup = { id: null, size: null, element: null };
    let isBoardLocked = false;
    const MAX_BOARD_ITEMS = 5;
    let currentColorFilter = 'green';

    // ===== ACTIVE DRAG TRACKING =====
    const activeDrags = new Map();

    // ===== INITIALIZE HANDLERS =====
    setupUnifiedDragSystem();
    setupKnifeDrag();
    setupCupDrag();
    setupFeedingDone();
    setupColorFiltering();
    setupCupClickHandlers(); // ===== NEW: Initialize cup click handlers =====

    // ===== COLOR FILTERING: Setup color category buttons =====
    function setupColorFiltering() {
      const colorButtons = wrapper.querySelectorAll('.color-category-btn');

      console.log('=== COLOR FILTERING DEBUG ===');
      console.log('Gallery scroll element:', galleryScroll);  // ===== FIX: Log correct element =====
      console.log('Gallery scroll classes:', galleryScroll.className);
      console.log('Gallery scroll computed border:', window.getComputedStyle(galleryScroll).border);

      // ===== SHOW ITEMS FOR DEFAULT COLOR ON LOAD =====
      filterFoodsByColor(currentColorFilter);
      updateGalleryBorderColor(currentColorFilter);

      // ===== SETUP COLOR BUTTON CLICK HANDLERS =====
      colorButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const color = btn.dataset.color;
          console.log('Color category clicked: ' + color);

          // ===== UPDATE ARIA-PRESSED STATE =====
          colorButtons.forEach((b) => b.removeAttribute('aria-pressed'));
          btn.setAttribute('aria-pressed', 'true');

          // ===== FILTER GALLERY =====
          currentColorFilter = color;
          filterFoodsByColor(color);
          updateGalleryBorderColor(color);  // =====  Update border color when button clicked =====
        });

        // ===== TOUCH SUPPORT: Also handle pointerdown for better mobile experience =====
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          btn.click();
        });
      });
    }

    /**
     * Update gallery border color to match selected color category.
     * Uses centralized color configuration.
     *
     * @param {string} color - The color name (red, orange, yellow, etc)
     */
    function updateGalleryBorderColor(color) {
      // ===== FIX: Use centralized FOOD_COLORS config =====
      const colorConfig = FOOD_COLORS[color];
      const borderColor = colorConfig ? colorConfig.hex : '#bdc3c7';  // ===== DEFAULT: light gray =====
      
      console.log('=== UPDATE BORDER COLOR DEBUG ===');
      console.log('Color selected:', color);
      console.log('Color config:', colorConfig);
      console.log('Border color to apply:', borderColor);
      console.log('Gallery scroll element before update:', galleryScroll);  // ===== FIX: Log correct element =====
      
      galleryScroll.style.borderColor = borderColor;  // ===== FIX: Update OUTER container =====
      galleryScroll.style.borderWidth = '3px';
      galleryScroll.style.borderStyle = 'solid';
      galleryScroll.style.transition = 'border-color 0.3s ease';

      console.log('Gallery scroll element after update:', galleryScroll);
      console.log('Gallery scroll border style after update:', window.getComputedStyle(galleryScroll).border);
      console.log('Gallery border color updated to: ' + borderColor + ' (color: ' + color + ')');
    }

    /**
     * Filter food items by color.
     * Shows only items matching the selected color, others are hidden.
     *
     * @param {string} color - The color to filter by
     */
    function filterFoodsByColor(color) {
      const foodItems = gallery.querySelectorAll('.food-item');
      foodItems.forEach((item) => {
        const itemColor = item.dataset.color;
        if (itemColor === color) {
          item.classList.add('visible');
        } else {
          item.classList.remove('visible');
        }
      });

      console.log('Gallery filtered by color: ' + color);
    }

    // ===== UNIFIED DRAG SYSTEM: Listen on document for all drag types =====
    function setupUnifiedDragSystem() {
      // ===== POINTERDOWN: Detect what's being dragged =====
      document.addEventListener('pointerdown', (e) => {
        // ===== CHECK IF IT'S A GALLERY ITEM =====
        const foodItem = e.target.closest('.food-item');
        if (foodItem && gallery.contains(foodItem)) {
          handleGalleryItemPointerDown(e, foodItem);
          return;
        }

        // ===== CHECK IF IT'S A BOARD ITEM =====
        const boardItem = e.target.closest('.board-item');
        if (boardItem && board.contains(boardItem)) {
          handleBoardItemPointerDown(e, boardItem);
          return;
        }
      }, true);  // ===== USE CAPTURE PHASE to intercept before jQuery =====

      // ===== POINTERMOVE: Update all active drags =====
      document.addEventListener('pointermove', (e) => {
        for (const [pointerId, drag] of activeDrags) {
          if (!drag.element) continue;

          // ===== CALCULATE OFFSET FROM START POSITION =====
          // WHY: pointermove gives us current clientX/clientY
          //      We calculate how far mouse has moved SINCE drag started
          //      This offset is applied via transform
          const offsetX = e.clientX - drag.startX;  // ===== How far right (or left if negative) =====
          const offsetY = e.clientY - drag.startY;  // ===== How far down (or up if negative) =====

          // ===== APPLY SMOOTH TRANSFORM =====
          // WHY: Transform doesn't trigger layout recalculation (fast!)
          // Transform affects VISUAL position only, not actual DOM position
          // This allows smooth 60fps dragging without performance hit
          // The item stays at position:fixed (left, top) but VISUALLY moves via transform
          drag.element.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px)';

          // ===== CRITICAL: Prevent clicking through dragged items =====
          // During drag, pointer-events:none prevents the item from interfering with drop detection
          // document.elementFromPoint() needs to detect elements BELOW the dragged item
          drag.element.style.pointerEvents = 'none';

          // ===== CHOP DETECTION FOR KNIFE =====
          if (drag.type === 'knife') {
            // ===== Find what's below knife while dragging =====
            // pointer-events:none on knife allows elementFromPoint to see board items beneath it
            const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
            const boardItem = elementBelow?.closest('.board-item');
            if (boardItem && boardItem.dataset.isChopped === 'false') {
              chopItemWithKnife(boardItem);
            }
          }
        }
      });

      // ===== POINTERUP: Handle drop for all active drags =====
      document.addEventListener('pointerup', (e) => {
        const pointersToDelete = [];

        for (const [pointerId, drag] of activeDrags) {
          if (drag.type === 'gallery-to-board') {
            handleGalleryItemPointerUp(e, drag);
            pointersToDelete.push(pointerId);
          } else if (drag.type === 'unchopped-to-gallery') {
            handleUnchoppedItemPointerUp(e, drag);
            pointersToDelete.push(pointerId);
          } else if (drag.type === 'chopped-to-cup') {
            handleChoppedItemPointerUp(e, drag);
            pointersToDelete.push(pointerId);
          }
        }

        pointersToDelete.forEach(id => activeDrags.delete(id));
      });
    }

    // ===== HANDLER: Gallery item pointerdown =====
    function handleGalleryItemPointerDown(e, foodItem) {
      const foodKey = foodItem.dataset.foodKey;
      const foodSrc = foodItem.dataset.foodSrc;

      if (isBoardLocked || boardItems.size >= MAX_BOARD_ITEMS) {
        console.log('Cannot drag: board locked or full');
        return;
      }

      console.log('Gallery drag started: ' + foodKey);
      e.preventDefault();

      // ===== POSITIONING STRATEGY FOR GALLERY ITEMS =====
      // WHY: Gallery items move between containers (gallery -> wrapper)
      // APPROACH: Use position:fixed with left/top + transform
      // BENEFIT: Fixed positioning removes from layout flow, preventing gallery collapse
      //          Transform provides smooth animation without recalculating layout
      // RESULT: Item appears above all elements including cups with z-index:2000

      // ===== STEP 1: GET CURRENT POSITION BEFORE MOVING =====
      const rect = foodItem.getBoundingClientRect();  // ===== Get position on screen BEFORE DOM manipulation =====

      // ===== STEP 2: MOVE ITEM OUT OF GALLERY TO WRAPPER =====
      // WHY: Prevents gallery from collapsing/reflowing when item is dragged
      // This maintains the gallery height and layout while dragging
      const originalParent = foodItem.parentElement;  // ===== Store gallery reference for restoration =====
      wrapper.appendChild(foodItem);  // ===== Move to wrapper (higher in DOM) so it appears above everything =====

      // ===== STEP 3: SET STYLES FOR SMOOTH DRAGGING =====
      foodItem.style.position = 'fixed';  // ===== Fixed positioning: takes item out of document flow =====
      foodItem.style.left = rect.left + 'px';  // ===== Position at current screen X coordinate =====
      foodItem.style.top = rect.top + 'px';  // ===== Position at current screen Y coordinate =====
      foodItem.style.width = rect.width + 'px';  // ===== Preserve original size (prevent shrinking) =====
      foodItem.style.height = rect.height + 'px';  // ===== Preserve original height =====
      foodItem.style.zIndex = '2000';  // ===== Higher than board (z-index:5) so item appears on top =====
      foodItem.style.pointerEvents = 'auto';  // ===== Keep interactive during drag =====
      foodItem.style.margin = '0';  // ===== Clear margins that affect fixed positioning accuracy =====
      
      // ===== STEP 4: SET SMOOTH TRANSITIONS =====
      // WHY: Transform gets smooth animation (0.05s linear for 60fps tracking)
      // Other properties (box-shadow, border) have separate timing (0.2s ease)
      foodItem.style.transition = 'transform 0.05s linear, box-shadow 0.2s ease, border-color 0.2s ease';

      foodItem.classList.add('dragging');  // ===== CSS class adds visual feedback (opacity, shadow) =====

      activeDrags.set(e.pointerId, {
        pointerId: e.pointerId,
        element: foodItem,
        type: 'gallery-to-board',
        startX: e.clientX,  // ===== Client X when drag started =====
        startY: e.clientY,  // ===== Client Y when drag started =====
        originalParent: originalParent,  // ===== Store for restoration if drop is invalid =====
        foodKey: foodKey,
        foodSrc: foodSrc
      });
    }

    // ===== HANDLER: Gallery item pointerup =====
    function handleGalleryItemPointerUp(e, drag) {
      const { element, foodKey, foodSrc, originalParent } = drag;
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      const isOverBoard = elementBelow?.closest('#choppingBoard, .board-items');

      if (isOverBoard && !isBoardLocked && boardItems.size < MAX_BOARD_ITEMS && !boardItems.has(foodKey)) {
        // ===== VALID DROP: Add clone to board (keep original in gallery) =====
        addFoodItemToBoard(foodKey, foodSrc);  // ===== Creates new board item, doesn't remove gallery item =====
        console.log('✓ Item added to board: ${foodKey}');
        
        // ===== MOVE ORIGINAL GALLERY ITEM BACK AND HIDE IT =====
        originalParent.appendChild(element);  // ===== Move dragged element back to gallery =====
        element.style.display = 'none';  // ===== Hide it (will be unhidden on reset) =====
        element.style.transform = '';
        element.style.transition = '';
        element.style.position = '';
        element.style.left = '';
        element.style.top = '';
        element.style.width = '';
        element.style.height = '';
        element.style.zIndex = '';
        element.style.margin = '';
        element.style.pointerEvents = '';
        element.classList.remove('dragging');
      } else {
        // ===== INVALID DROP: Restore to original gallery with animation =====
        console.log('Invalid drop - restoring to gallery');
        element.style.transform = 'translate(0, 0)';
        setTimeout(() => {
          originalParent.appendChild(element);  // ===== FIX #1: Move back to gallery =====
          element.style.transform = '';
          element.style.transition = '';
          element.style.position = '';
          element.style.left = '';
          element.style.top = '';
          element.style.width = '';
          element.style.height = '';
          element.style.zIndex = '';
          element.style.margin = '';
          element.style.pointerEvents = '';  // ===== FIX: Restore pointer events =====
          element.classList.remove('dragging');
          console.log('✓ Item restored to gallery');
        }, 100);
      }
    }

    // ===== HANDLER: Board item pointerdown =====
    function handleBoardItemPointerDown(e, boardItem) {
      const foodKey = boardItem.dataset.foodKey;
      const isChopped = boardItem.dataset.isChopped === 'true';

      console.log('Board item drag started: ' + foodKey + ', isChopped: ' + isChopped);
      e.preventDefault();

      // ===== POSITIONING STRATEGY FOR BOARD ITEMS =====
      // WHY: Board items stay within board (no DOM movement needed)
      // APPROACH: Use position:relative + transform
      // BENEFIT: Items stay in flow, transform provides smooth animation
      // RESULT: Item appears above board but z-index layering is contained

      // ===== SET POSITION & Z-INDEX ONCE ON POINTERDOWN =====
      // WHY: Set once, not on every pointermove (performance!)
      // The transform in pointermove will handle the actual movement
      boardItem.style.position = 'relative';  // ===== Relative: item stays in document flow =====
      boardItem.style.zIndex = '1000';  // ===== Higher than board background (z-index:5) =====
      
      // ===== SET SMOOTH TRANSITION =====
      // Transform gets fast linear easing (0.05s) to follow mouse immediately
      // Box-shadow/border get slower ease (0.2s) for visual polish
      boardItem.style.transition = 'transform 0.05s linear, box-shadow 0.2s ease';

      activeDrags.set(e.pointerId, {
        pointerId: e.pointerId,
        element: boardItem,
        type: isChopped ? 'chopped-to-cup' : 'unchopped-to-gallery',  // ===== Different drop targets =====
        startX: e.clientX,
        startY: e.clientY,
        foodKey: foodKey
      });

      boardItem.classList.add('dragging');
    }

    // ===== HANDLER: Unchopped item pointerup =====
    function handleUnchoppedItemPointerUp(e, drag) {
      const { element, foodKey } = drag;
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      const isOverGallery = elementBelow?.closest('.food-gallery-grid, #galleryDropZone');

      if (isOverGallery) {
        // ===== VALID DROP: Return to gallery =====
        element.remove();
        boardItems.delete(foodKey);
        const galleryItem = gallery.querySelector('[data-food-key="' + foodKey + '"]');
        if (galleryItem) galleryItem.style.display = '';
        console.log('✓ Item returned to gallery: ${foodKey}');
        updateKnifeState();
        element.style.transform = '';
        element.style.pointerEvents = '';  // ===== FIX #2: Restore pointer events =====
        element.style.position = '';  // ===== FIX #3: Clear inline position =====
        element.style.zIndex = '';  // ===== FIX #3: Clear inline z-index =====
        element.classList.remove('dragging');
      } else {
        // ===== INVALID DROP: Snap back =====
        console.log('Invalid drop - snapping back to board');
        element.style.transform = 'translate(0, 0)';
        setTimeout(() => {
          element.style.transform = '';
          element.style.pointerEvents = '';  // ===== FIX #2: Restore pointer events =====
          element.style.position = '';  // ===== FIX #3: Clear inline position =====
          element.style.zIndex = '';  // ===== FIX #3: Clear inline z-index =====
          element.classList.remove('dragging');
        }, 100);
      }
    }

    // ===== HANDLER: Chopped item pointerup =====
    function handleChoppedItemPointerUp(e, drag) {
      const { element, foodKey } = drag;
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      const cup = elementBelow?.closest('.cup');

      if (cup) {
        // ===== VALID DROP: Item goes into cup =====
        const cupsCount = parseInt(cup.dataset.cups);
        const cupId = cup.dataset.cupId;

        if (selectedCup.id === null) {
          isBoardLocked = true;
        }

        selectedCup = { id: cupId, size: cupsCount, element: cup };
        cup.src = '/modules/custom/wormchat/images/' + cupsCount + 'cups_full.png';  // ===== FIX: String concatenation =====
        console.log('✓ Cup filled: ' + cupsCount + ' cups');  // ===== FIX: String concatenation =====

        if (!fedMaterials.includes(foodKey)) {
          fedMaterials.push(foodKey);
          console.log('✓ Recorded fed material: ' + foodKey + ', total: ' + fedMaterials.join(', '));  // ===== NEW: Detailed logging =====
        }

        element.remove();
        boardItems.delete(foodKey);
        console.log('✓ Item removed from board: ' + foodKey);  // ===== FIX: String concatenation =====

        if (boardItems.size === 0) {
          isBoardLocked = true;
          console.log('✓ Board is empty - feeding complete');
        }

        element.style.transform = '';
        element.style.pointerEvents = '';
        element.style.position = '';
        element.style.left = '';
        element.style.top = '';
        element.style.width = '';
        element.style.height = '';
        element.style.zIndex = '';
        element.style.margin = '';
        element.classList.remove('dragging');
      } else {
        // ===== INVALID DROP: Snap back =====
        console.log('Invalid drop - snapping back to board');
        element.style.transform = 'translate(0, 0)';
        setTimeout(() => {
          element.style.transform = '';
          element.style.pointerEvents = '';  // ===== FIX #2: Restore pointer events =====
          element.style.position = '';  // ===== FIX #3: Clear inline position =====
          element.style.zIndex = '';  // ===== FIX #3: Clear inline z-index =====
          element.classList.remove('dragging');
        }, 100);
      }
    }

    // ===== KNIFE DRAG: Unified with pointer events =====
    function setupKnifeDrag() {
      chopBtn.style.touchAction = 'none';  // ===== Prevent browser drag gestures =====
      chopBtn.style.userSelect = 'none';  // ===== Prevent text selection during drag =====

      document.addEventListener('pointerdown', (e) => {
        if (e.target !== chopBtn && !chopBtn.contains(e.target)) return;

        if (chopBtn.dataset.knifeEnabled !== 'true') {
          console.log('Knife disabled');
          return;
        }

        console.log('Knife drag started');
        e.preventDefault();

        // ===== POSITIONING STRATEGY FOR KNIFE =====
        // WHY: Knife moves freely across the entire screen to reach board items
        // APPROACH: Use position:relative + transform
        // BENEFIT: Relative keeps knife in DOM flow for initial positioning
        //          Transform allows smooth movement across entire viewport
        //          No DOM reparenting needed (unlike gallery items)
        // RESULT: Knife follows mouse smoothly with z-index:1001 (highest)
        //         Can reach any board item for chopping detection

        // ===== SET POSITION & Z-INDEX ONCE ON POINTERDOWN =====
        // WHY: Set once at drag start, transform in pointermove handles movement
        //      This is efficient - no recalculation on every pointer event
        chopBtn.style.position = 'relative';  // ===== Relative: knife stays in DOM flow, but transform moves it visually =====
        chopBtn.style.zIndex = '1001';  // ===== HIGHEST z-index: knife always appears above all other elements =====
        
        // ===== SET SMOOTH TRANSITION =====
        // Transform gets fast linear easing (0.05s) to follow mouse immediately
        // Other properties (box-shadow) get slower ease (0.2s) for visual polish
        chopBtn.style.transition = 'transform 0.05s linear, box-shadow 0.2s ease';

        activeDrags.set(e.pointerId, {
          pointerId: e.pointerId,
          element: chopBtn,
          type: 'knife',
          startX: e.clientX,  // ===== Mouse X when drag started =====
          startY: e.clientY   // ===== Mouse Y when drag started =====
        });

        chopBtn.classList.add('dragging');
      }, true);  // ===== CAPTURE PHASE: Intercept before other handlers =====

      document.addEventListener('pointerup', (e) => {
        const drag = activeDrags.get(e.pointerId);
        if (!drag || drag.type !== 'knife') return;

        // ===== RESET KNIFE TO ORIGINAL POSITION =====
        // WHY: After drop, knife snaps back visually via transform reset
        //      The DOM position doesn't change (stays in column via relative positioning)
        //      Only the visual offset (transform) is cleared
        chopBtn.style.transform = 'translate(0, 0)';  // ===== Stop offset - knife returns to column visually =====
        chopBtn.style.transition = '';  // ===== Remove transition so snap is instant =====
        chopBtn.style.pointerEvents = '';  // ===== Restore pointer events =====
        chopBtn.style.position = '';  // ===== Remove inline position =====
        chopBtn.style.zIndex = '';  // ===== Remove inline z-index =====
        chopBtn.classList.remove('dragging');
        console.log('Knife drag ended');
        activeDrags.delete(e.pointerId);
      });

      updateKnifeState();
    }

    // ===== HELPER: Add food item to board =====
    function addFoodItemToBoard(foodKey, foodSrc) {
      // ===== CREATE NEW BOARD ITEM (don't move gallery item) =====
      const boardItem = document.createElement('div');
      boardItem.className = 'board-item';
      boardItem.dataset.foodKey = foodKey;
      boardItem.dataset.isChopped = 'false';

      const img = document.createElement('img');
      img.src = foodSrc;
      img.alt = foodKey;

      boardItem.appendChild(img);
      board.appendChild(boardItem);

      boardItems.set(foodKey, { element: boardItem, isChopped: false });

      // ===== HIDE ORIGINAL GALLERY ITEM (don't remove it) =====
      const galleryItem = gallery.querySelector('[data-food-key="' + foodKey + '"]');  // ===== FIX: String concatenation =====
      if (galleryItem) galleryItem.style.display = 'none';

      console.log('✓ Food item added to board: ' + foodKey + ' (responsive sizing from CSS)');  // ===== NEW: Log that sizing is from CSS =====
      updateKnifeState();
    }

    // ===== HELPER: Chop item =====
    function chopItemWithKnife(boardItem) {
      if (boardItem.dataset.isChopped === 'true') return;

      const foodKey = boardItem.dataset.foodKey;
      boardItem.dataset.isChopped = 'true';
      boardItem.style.borderColor = 'var(--wormchat-success, #4caf50)';
      boardItem.style.borderWidth = '3px';

      const img = boardItem.querySelector('img');
      if (img) {
        img.src = '/modules/custom/wormchat/images/chopped_foods.png';
        console.log('✓ Item chopped: ' + foodKey);  // ===== FIX: String concatenation =====
      }

      updateKnifeState();
    }

    // ===== HELPER: Update knife enabled state =====
    function updateKnifeState() {
      const unchopped = Array.from(boardItems.values()).filter(item => item.isChopped === false).length;
      const hasUnchopped = unchopped > 0;

      chopBtn.dataset.knifeEnabled = hasUnchopped ? 'true' : 'false';
      chopBtn.style.opacity = hasUnchopped ? '1' : '0.5';
      chopBtn.style.cursor = hasUnchopped ? 'grab' : 'not-allowed';
      chopBtn.style.pointerEvents = hasUnchopped ? 'auto' : 'none';

      console.log('Knife state updated: enabled=' + hasUnchopped + ', unchopped count=' + unchopped);  // ===== FIX: String concatenation =====
    }

    // ===== SETUP: Cup Drag to feedingDone button =====
    function setupCupDrag() {
      cups.forEach((cup) => {
        cup.style.touchAction = 'none';
        cup.style.userSelect = 'none';

        document.addEventListener('pointerdown', (e) => {
          if (e.target !== cup && !cup.contains(e.target)) return;

          // ===== CHECK IF CUP IS FULL (can only drag full cups) =====
          const cupsCount = cup.dataset.cups;
          const currentSrc = cup.src;
          const isEmpty = currentSrc.includes('empty');

          if (isEmpty) {
            console.log('Cannot drag empty cup');
            return;
          }

          console.log('Cup drag started: ' + cupsCount + ' cups (full)');
          e.preventDefault();

          // ===== GET CURRENT POSITION =====
          const rect = cup.getBoundingClientRect();

          // ===== SET POSITION & Z-INDEX FOR DRAGGING =====
          cup.style.position = 'fixed';
          cup.style.left = rect.left + 'px';
          cup.style.top = rect.top + 'px';
          cup.style.width = rect.width + 'px';
          cup.style.height = rect.height + 'px';
          cup.style.zIndex = '2001';
          cup.style.pointerEvents = 'auto';
          cup.style.margin = '0';
          cup.style.transition = 'transform 0.05s linear, box-shadow 0.2s ease';
          cup.style.cursor = 'grabbing';

          cup.classList.add('dragging');

          activeDrags.set(e.pointerId, {
            pointerId: e.pointerId,
            element: cup,
            type: 'cup-to-feedingDone',
            startX: e.clientX,
            startY: e.clientY,
            cupsCount: cupsCount,
            originalRect: rect
          });
        }, true);
      });

      // ===== HANDLE CUP DROP ON FEEDINGDONE =====
      document.addEventListener('pointerup', (e) => {
        const drag = activeDrags.get(e.pointerId);
        if (!drag || drag.type !== 'cup-to-feedingDone') return;

        const { element, cupsCount, originalRect } = drag;
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        const isOverFeedingDone = elementBelow === feedingDone || feedingDone.contains(elementBelow);

        if (isOverFeedingDone) {
          // ===== VALID DROP: Update feedingDone image to full =====
          feedingDone.src = '/modules/custom/wormchat/images/give_cups_full.png';
          console.log('✓ Cup filled feeding done button');

          // ===== RESET CUP TO ORIGINAL POSITION & EMPTY =====
          element.style.position = '';
          element.style.left = '';
          element.style.top = '';
          element.style.width = '';
          element.style.height = '';
          element.style.zIndex = '';
          element.style.pointerEvents = '';
          element.style.margin = '';
          element.style.transition = '';
          element.style.cursor = '';
          element.style.transform = '';
          element.classList.remove('dragging');

          // ===== RESET CUP TO EMPTY =====
          element.src = '/modules/custom/wormchat/images/' + cupsCount + 'cups_empty.png';

          // ===== UPDATE STATE: Cup was used =====
          if (selectedCup.id === null) {
            isBoardLocked = true;
          }
          selectedCup = { id: element.dataset.cupId, size: cupsCount, element: element };

          // ===== CHECK IF BOARD IS EMPTY =====
          // NOTE: fedMaterials is populated when items are dragged to cups (see handleChoppedItemPointerUp)
          if (boardItems.size === 0) {
            isBoardLocked = true;
            console.log('✓ Board is empty - ready to finish feeding');
            console.log('✓ Fed materials recorded: ' + fedMaterials.join(', '));  // ===== Log what was actually fed =====
          }

          activeDrags.delete(e.pointerId);
        } else {
          // ===== INVALID DROP: Snap back =====
          console.log('Invalid drop - snapping cup back');
          element.style.transform = 'translate(0, 0)';
          setTimeout(() => {
            element.style.position = '';
            element.style.left = '';
            element.style.top = '';
            element.style.width = '';
            element.style.height = '';
            element.style.zIndex = '';
            element.style.pointerEvents = '';
            element.style.margin = '';
            element.style.transition = '';
            element.style.cursor = '';
            element.style.transform = '';
            element.classList.remove('dragging');
          }, 100);
          activeDrags.delete(e.pointerId);
        }
      });
    }

    // ===== SETUP: Feeding Done =====
    function setupFeedingDone() {
      feedingDone.addEventListener('click', () => {
        console.log('===== FEEDING DONE CLICKED =====');
        console.log('fedMaterials before telemetry: ' + JSON.stringify(fedMaterials));  // ===== NEW: Show actual array =====
        console.log('selectedCup: ' + JSON.stringify(selectedCup));  // ===== NEW: Show cup selection =====

        // ===== SEND TELEMETRY =====
        if (fedMaterials.length > 0 && selectedCup.size) {
          const telemetryData = {
            material: fedMaterials.join(','),
            amount_cups: selectedCup.size
          };
          console.log('✓ Sending telemetry: ' + JSON.stringify(telemetryData));  // ===== NEW: Confirm sending =====
          sendTelemetry(telemetryData);
        } else {
          console.warn('✗ Telemetry not sent - missing data. fedMaterials: ' + fedMaterials.length + ', cups: ' + selectedCup.size);  // ===== NEW: Debug missing data =====
        }

        // ===== VISUAL FEEDBACK: Show full cups for 1 second =====
        feedingDone.src = '/modules/custom/wormchat/images/give_cups_full.png';
        console.log('✓ Feeding successful - showing confirmation');

        // ===== AFTER 1 SECOND: Reset everything =====
        setTimeout(() => {
          // ===== RESET BOARD =====
          board.innerHTML = '';
          boardItems.clear();

          // ===== RESET CUPS =====
          cups.forEach((cup) => {
            const cupsCount = cup.dataset.cups;
            cup.src = '/modules/custom/wormchat/images/' + cupsCount + 'cups_empty.png';  // ===== FIX: String concatenation =====
          });

          // ===== RESET FEEDINGDONE BUTTON =====
          feedingDone.src = '/modules/custom/wormchat/images/give_cups_empty.png';

          // ===== RESET GALLERY =====
          gallery.querySelectorAll('.food-item').forEach((item) => {
            item.style.display = '';
          });

          // ===== RESET STATE =====
          fedMaterials = [];
          selectedCup = { id: null, size: null, element: null };
          isBoardLocked = false;
          currentColorFilter = 'green';  // ===== NEW: Reset color filter =====

          console.log('✓ Board reset - ready for next feeding');
          updateKnifeState();
          filterFoodsByColor('green');  // ===== Reset to green color filter =====
          updateGalleryBorderColor('green');  // ===== NEW: Reset border color =====
        }, 1000);  // ===== Wait 1 second before resetting =====
      });
    }

    // ===== TELEMETRY: Send to ThingsBoard =====
    function sendTelemetry(data) {
      const csrfToken = drupalSettings.csrfToken || '';
      const payload = {
        material: data.material,
        amount_cups: data.amount_cups,
        timestamp: new Date().toISOString()
      };

      fetch('/api/wormchat/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(payload)
      })
        .then(response => {
          if (!response.ok) throw new Error('HTTP error! status: ' + response.status);  // ===== String concatenation =====
          return response.json();
        })
        .then(data => {
          console.log('✓ Telemetry sent:', data);
        })
        .catch(error => {
          console.error('✗ Telemetry send failed:', error);
        });
    }

    // ===== QUICK FEED: Setup text input autocomplete =====
    setupQuickFeed();

    // ===== QUICK FEED SETUP =====
    function setupQuickFeed() {
      const quickInput = wrapper.querySelector('#quick-feed-input');
      const quickBtn = wrapper.querySelector('#quick-feed-btn');
      const suggestions = wrapper.querySelector('#quick-feed-suggestions');
      let allFoods = [];
      let selectedSuggestionIndex = -1;

      // ===== LOAD ALL AVAILABLE FOODS FROM GALLERY =====
      function loadAvailableFoods() {
        const foodItems = gallery.querySelectorAll('.food-item');
        allFoods = Array.from(foodItems).map(item => ({
          key: item.dataset.foodKey,
          src: item.dataset.foodSrc,
          name: item.dataset.foodKey.charAt(0).toUpperCase() + item.dataset.foodKey.slice(1)
        }));
        console.log('Available foods loaded:', allFoods.map(f => f.name).join(', '));
      }

      loadAvailableFoods();

      // ===== RELOAD FOODS ON INPUT FOCUS =====
      quickInput.addEventListener('focus', () => {
        loadAvailableFoods(); //reloading available foods, in case new foods were added by admin
      });

      // ===== INPUT EVENT: Show suggestions as user types =====
      quickInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        selectedSuggestionIndex = -1;

        if (searchTerm.length === 0) {
          suggestions.classList.remove('show');
          return;
        }

        // ===== FILTER FOODS BY SEARCH TERM =====
        const filtered = allFoods.filter(food => 
          food.name.toLowerCase().startsWith(searchTerm) ||
          food.key.toLowerCase().startsWith(searchTerm)
        );

        if (filtered.length === 0) {
          suggestions.classList.remove('show');
          return;
        }

        // ===== BUILD SUGGESTIONS HTML =====
        suggestions.innerHTML = filtered.map((food, index) => `
          <div class="quick-feed-suggestion-item" data-food-key="${food.key}" data-index="${index}">
            <strong>${food.name}</strong>
          </div>
        `).join('');

        suggestions.classList.add('show');

        // ===== SETUP SUGGESTION CLICK HANDLERS =====
        suggestions.querySelectorAll('.quick-feed-suggestion-item').forEach(item => {
          item.addEventListener('click', () => {
            selectSuggestion(item);
          });
        });
      });

      // ===== KEYBOARD NAVIGATION: Arrow keys + Enter =====
      quickInput.addEventListener('keydown', (e) => {
        const items = suggestions.querySelectorAll('.quick-feed-suggestion-item');
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, items.length - 1);
          updateSuggestionHighlight(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
          updateSuggestionHighlight(items);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedSuggestionIndex >= 0 && items[selectedSuggestionIndex]) {
            selectSuggestion(items[selectedSuggestionIndex]);
          } else if (quickInput.value.trim().length > 0) {
            // ===== Allow free text entry if no match =====
            addFoodByText(quickInput.value.trim());
          }
        } else if (e.key === 'Escape') {
          suggestions.classList.remove('show');
        }
      });

      // ===== UPDATE HIGHLIGHT ON SUGGESTION ITEMS =====
      function updateSuggestionHighlight(items) {
        items.forEach((item, index) => {
          if (index === selectedSuggestionIndex) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' });
          } else {
            item.classList.remove('active');
          }
        });
      }

      // ===== SELECT SUGGESTION =====
      function selectSuggestion(item) {
        const foodKey = item.dataset.foodKey;
        const food = allFoods.find(f => f.key === foodKey);
        
        if (food) {
          addFoodByKey(food.key, food.src);
          quickInput.value = '';
          suggestions.classList.remove('show');  // ← Already clearing here
          selectedSuggestionIndex = -1;           // ← Reset index
          suggestions.innerHTML = '';             // ← Clear the HTML list
          console.log('✓ Quick feed: ' + food.name + ' added');
        }
      }

      // ===== ADD FOOD BY KEYBOARD (free text) =====
      function addFoodByText(text) {
        const food = allFoods.find(f => 
          f.name.toLowerCase() === text.toLowerCase() ||
          f.key.toLowerCase() === text.toLowerCase()
        );

        if (food) {
          addFoodByKey(food.key, food.src);
          quickInput.value = '';
          suggestions.classList.remove('show');  // ← Clear suggestions
          selectedSuggestionIndex = -1;           // ← Reset index
          suggestions.innerHTML = '';             // ← Clear the HTML list
          console.log('✓ Quick feed by text: ' + food.name);
        } else {
          console.warn('✗ Food not found: ' + text);
          quickInput.value = '';
          suggestions.classList.remove('show');  // ← Also clear on invalid input
          suggestions.innerHTML = '';
        }
      }

      // ===== ADD FOOD BY KEY (reuse existing function) =====
      function addFoodByKey(foodKey, foodSrc) {
        if (isBoardLocked || boardItems.size >= MAX_BOARD_ITEMS) {
          console.warn('Cannot add: board locked or full');
          return;
        }

        if (boardItems.has(foodKey)) {
          console.warn('Food already on board: ' + foodKey);
          return;
        }

        addFoodItemToBoard(foodKey, foodSrc);
      }

      // ===== QUICK FEED BUTTON: Add via button click =====
      quickBtn.addEventListener('click', () => {
        const input = quickInput.value.trim();
        if (input.length > 0) {
          addFoodByText(input);
        }
      });

      // ===== CLOSE SUGGESTIONS WHEN CLICKING OUTSIDE =====
      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
          suggestions.classList.remove('show');
        }
      });
    }

    // ===== SETUP: Cup Click Handler (direct feeding without chopping) =====
    function setupCupClickHandlers() {
      cups.forEach((cup) => {
        cup.addEventListener('click', (e) => {
          // Check if there are items on the board
          if (boardItems.size === 0) {
            console.log('No food on board - cannot feed');
            return;
          }

          // Check if board is locked
          if (isBoardLocked) {
            console.log('Board is locked');
            return;
          }

          const cupsCount = cup.dataset.cups;
          const currentSrc = cup.src;
          const isEmpty = currentSrc.includes('empty');

          if (!isEmpty) {
            console.log('Cup already full');
            return;
          }

          console.log('✓ Cup clicked directly: ' + cupsCount + ' cups');

          // ===== TRIGGER SAME LOGIC AS CUP DRAG-AND-DROP =====
          // Move all board items to cup (same as if user dragged chopped items)
          Array.from(boardItems.entries()).forEach(([foodKey, boardItemData]) => {
            const boardItem = boardItemData.element;
            
            // Record the fed material (same as handleChoppedItemPointerUp does)
            if (!fedMaterials.includes(foodKey)) {
              fedMaterials.push(foodKey);
            }

            // Remove from board
            boardItem.remove();
            boardItems.delete(foodKey);
          });

          // Update cup to full (same as cup drag logic)
          cup.src = '/modules/custom/wormchat/images/' + cupsCount + 'cups_full.png';
          
          // Update selected cup
          if (selectedCup.id === null) {
            isBoardLocked = true;
          }
          selectedCup = { id: cup.dataset.cupId, size: cupsCount, element: cup };

          console.log('✓ Fed materials recorded: ' + fedMaterials.join(', '));
          console.log('✓ Board emptied - ready for next feeding');
        });
      });
    }

    // ===== INITIALIZE CUP CLICK HANDLERS =====
    setupCupClickHandlers();
  }

})(Drupal, jQuery, once);
