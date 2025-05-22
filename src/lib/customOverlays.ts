export const createCustomImageOverlay = (overlay: MapOverlay, map: google.maps.Map) => {
  console.log('[CustomOverlay] Creating overlay:', {
    overlayId: overlay.id,
    properties: overlay.properties,
    timestamp: new Date().toISOString()
  });

  const instance = new google.maps.OverlayView();
  let element: HTMLDivElement | null = null;
  let position: google.maps.LatLng | null = null;
  let isDragging = false;
  let dragStartPosition: google.maps.LatLng | null = null;
  let dragStartMousePosition: { x: number; y: number } | null = null;

  instance.onAdd = function() {
    console.log('[CustomOverlay] onAdd called:', {
      overlayId: overlay.id,
      properties: overlay.properties,
      timestamp: new Date().toISOString()
    });

    if (!overlay.properties) {
      console.error('[CustomOverlay] onAdd: Missing properties for overlay:', overlay);
    } else {
      if (typeof overlay.properties.width === 'undefined') {
        console.error('[CustomOverlay] onAdd: Missing width for overlay:', overlay);
      }
      if (typeof overlay.properties.height === 'undefined') {
        console.error('[CustomOverlay] onAdd: Missing height for overlay:', overlay);
      }
    }

    element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.cursor = 'move';
    element.style.width = `${overlay.properties?.width ?? 200}px`;
    element.style.height = `${overlay.properties?.height ?? 200}px`;

    console.log('[CustomOverlay] onAdd element created:', {
      overlayId: overlay.id,
      width: element.style.width,
      height: element.style.height,
      timestamp: new Date().toISOString()
    });

    // ... rest of onAdd implementation
  };

  instance.onRemove = function() {
    console.log('[CustomOverlay] onRemove called:', {
      overlayId: overlay.id,
      timestamp: new Date().toISOString()
    });

    if (element) {
      element.remove();
      element = null;
      console.log('[CustomOverlay] onRemove: element removed:', {
        overlayId: overlay.id,
        timestamp: new Date().toISOString()
      });
    }
  };

  instance.draw = function() {
    if (!overlay.properties) {
      console.error('[CustomOverlay] draw: Missing properties for overlay:', overlay);
    } else {
      if (typeof overlay.properties.width === 'undefined') {
        console.error('[CustomOverlay] draw: Missing width for overlay:', overlay);
      }
      if (typeof overlay.properties.height === 'undefined') {
        console.error('[CustomOverlay] draw: Missing height for overlay:', overlay);
      }
    }
    // Defensive fallback
    const width = overlay.properties?.width ?? 200;
    const height = overlay.properties?.height ?? 200;

    console.log('[CustomOverlay] draw called:', {
      overlayId: overlay.id,
      hasElement: Boolean(element),
      hasPosition: Boolean(position),
      width,
      height,
      timestamp: new Date().toISOString()
    });

    if (!element || !position) {
      console.warn('[CustomOverlay] draw: Missing element or position', { overlayId: overlay.id, element, position });
      return;
    }

    const projection = this.getProjection();
    if (!projection) {
      console.warn('[CustomOverlay] draw: Missing projection', { overlayId: overlay.id });
      return;
    }

    const point = projection.fromLatLngToDivPixel(position);
    if (!point) {
      console.warn('[CustomOverlay] draw: Missing point from projection', { overlayId: overlay.id });
      return;
    }

    element.style.left = `${point.x - width / 2}px`;
    element.style.top = `${point.y - height / 2}px`;

    console.log('[CustomOverlay] draw: element positioned:', {
      overlayId: overlay.id,
      left: element.style.left,
      top: element.style.top,
      width,
      height,
      timestamp: new Date().toISOString()
    });
  };

  // Add logging to drag handlers
  const handleDragStart = (e: MouseEvent) => {
    console.log('[CustomOverlay] Drag start:', {
      overlayId: overlay.id,
      position: position?.toJSON(),
      timestamp: new Date().toISOString()
    });

    isDragging = true;
    dragStartPosition = position;
    dragStartMousePosition = { x: e.clientX, y: e.clientY };
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging || !dragStartPosition || !dragStartMousePosition) return;

    console.log('[CustomOverlay] Dragging:', {
      overlayId: overlay.id,
      startPosition: dragStartPosition.toJSON(),
      currentMouse: { x: e.clientX, y: e.clientY },
      timestamp: new Date().toISOString()
    });

    // ... rest of drag implementation
  };

  const handleDragEnd = () => {
    console.log('[CustomOverlay] Drag end:', {
      overlayId: overlay.id,
      finalPosition: position?.toJSON(),
      timestamp: new Date().toISOString()
    });

    isDragging = false;
    dragStartPosition = null;
    dragStartMousePosition = null;
  };

  // ... rest of implementation
};