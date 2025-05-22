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
      timestamp: new Date().toISOString()
    });

    element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.cursor = 'move';
    element.style.width = `${overlay.properties.width}px`;
    element.style.height = `${overlay.properties.height}px`;
    
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
    }
  };

  instance.draw = function() {
    console.log('[CustomOverlay] draw called:', {
      overlayId: overlay.id,
      hasElement: Boolean(element),
      hasPosition: Boolean(position),
      timestamp: new Date().toISOString()
    });

    if (!element || !position) return;

    const projection = this.getProjection();
    if (!projection) return;

    const point = projection.fromLatLngToDivPixel(position);
    if (!point) return;

    element.style.left = `${point.x - overlay.properties.width / 2}px`;
    element.style.top = `${point.y - overlay.properties.height / 2}px`;
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