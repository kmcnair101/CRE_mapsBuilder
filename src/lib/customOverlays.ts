export const createCustomImageOverlay = (
  overlay: MapOverlay,
  map: google.maps.Map,
  createDeleteButton?: (container: HTMLElement | null, onDelete: () => void) => (() => void) | null,
  createEditButton?: (container: HTMLElement | null, onEdit: () => void) => (() => void) | null,
  onDelete?: () => void,
  onEdit?: () => void
) => {
  const instance = new google.maps.OverlayView();
  let element: HTMLDivElement | null = null;
  let position: google.maps.LatLng | null = null;
  let isDragging = false;
  let dragStartPosition: google.maps.LatLng | null = null;
  let dragStartMousePosition: { x: number; y: number } | null = null;
  let cleanupFns: Array<() => void> = [];

  instance.onAdd = function() {
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

    // Only add controls if the button creators return a real element
    if (createDeleteButton && typeof onDelete === 'function') {
      const deleteCleanup = createDeleteButton(element, onDelete);
      if (deleteCleanup) {
        cleanupFns.push(deleteCleanup);
      }
    }
    if (createEditButton && typeof onEdit === 'function') {
      const editCleanup = createEditButton(element, onEdit);
      if (editCleanup) {
        cleanupFns.push(editCleanup);
      }
    }
  };

  instance.onRemove = function() {
    if (element) {
      element.remove();
      element = null;
    }
    cleanupFns.forEach(fn => fn());
    cleanupFns = [];
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

    if (!element || !position) {
      return;
    }

    const projection = this.getProjection();
    if (!projection) {
      return;
    }

    const point = projection.fromLatLngToDivPixel(position);
    if (!point) {
      return;
    }

    element.style.left = `${point.x - width / 2}px`;
    element.style.top = `${point.y - height / 2}px`;
  };

  // Add logging to drag handlers
  const handleDragStart = (e: MouseEvent) => {
    isDragging = true;
    dragStartPosition = position;
    dragStartMousePosition = { x: e.clientX, y: e.clientY };
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging || !dragStartPosition || !dragStartMousePosition) return;

    // ... rest of drag implementation
  };

  const handleDragEnd = () => {
    isDragging = false;
    dragStartPosition = null;
    dragStartMousePosition = null;
  };

  // ... rest of implementation
};