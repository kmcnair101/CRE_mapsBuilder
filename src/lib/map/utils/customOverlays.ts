import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { TextEditModal } from '@/components/modals/TextEditModal'
import { ImageEditModal } from '@/components/modals/ImageEditModal'
import type { MapOverlay, ContainerStyle } from '@/lib/types'

interface ImageOverlayConfig {
  position: google.maps.LatLng
  url: string
  width: number
  style: ContainerStyle
}

export function createCustomImageOverlay(
  config: ImageOverlayConfig,
  map: google.maps.Map,
  onDelete: () => void,
  createDeleteButton: (container: HTMLElement | null, onDelete: () => void) => (() => void) | null,
  createEditButton: (container: HTMLElement | null, onEdit: () => void) => (() => void) | null,
  onEdit?: (style: any) => void,
  createResizeHandle: (container: HTMLElement | null, config: ResizeConfig) => (() => void) | null
) {
  class CustomImageOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null
    container: HTMLDivElement | null = null
    private imageWrapper: HTMLDivElement | null = null
    private modalRoot: HTMLDivElement | null = null
    private modalReactRoot: ReturnType<typeof createRoot> | null = null
    private position: google.maps.LatLng
    private initialPosition: google.maps.LatLng
    private url: string
    private width: number
    private aspectRatio: number = 1
    private isDragging = false
    private cleanupFunctions: Array<() => void> = []
    private style: ContainerStyle
    private isMapReady = false
    private isImageLoaded = false
    private drawCount = 0
    private lastWidth: number = 0
    private lastHeight: number = 0

    constructor(config: ImageOverlayConfig) {
      super()
      this.position = config.position
      this.initialPosition = config.position
      this.url = config.url
      this.width = config.width
      this.style = config.style
    }

    private getRgbaColor(hex: string, opacity: number) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

    private applyStyles(container: HTMLDivElement) {
      const styles = {
        backgroundColor: this.getRgbaColor(this.style.backgroundColor, this.style.backgroundOpacity),
        border: `${this.style.borderWidth}px solid ${this.getRgbaColor(this.style.borderColor, this.style.borderOpacity)}`,
        padding: `${this.style.padding}px`,
        borderRadius: '4px',
        display: 'inline-block',
        position: 'relative',
        minWidth: '50px',
        maxWidth: '400px',
        width: `${this.width}px`,
        boxSizing: 'border-box'
      }

      Object.assign(container.style, styles)
    }

    updateStyle(style: ContainerStyle) {
      this.style = style
      if (this.container) {
        this.applyStyles(this.container)
      }
    }

    onAdd() {
      const map = this.getMap();

      if (!map || !(map instanceof google.maps.Map) || !map.getProjection()) {
        map?.addListener('idle', () => {
          this.isMapReady = true;
          this.draw();
        });
        return;
      }

      this.isMapReady = true;
      const div = document.createElement('div')
      div.className = 'custom-map-overlay'
      Object.assign(div.style, {
        position: 'absolute',
        cursor: 'move',
        userSelect: 'none'
      })

      const container = document.createElement('div')
      this.applyStyles(container)
      this.container = container

      const imageWrapper = document.createElement('div')
      Object.assign(imageWrapper.style, {
        position: 'relative',
        width: '100%',
        overflow: 'hidden'
      })
      this.imageWrapper = imageWrapper

      const img = document.createElement('img')
      img.src = this.url
      Object.assign(img.style, {
        width: '100%',
        height: 'auto',
        display: 'block'
      })
      img.draggable = false

      img.onload = () => {
        this.aspectRatio = img.naturalWidth / img.naturalHeight
        this.isImageLoaded = true
        if (this.imageWrapper) {
          this.imageWrapper.style.height = 'auto'
        }
        this.draw()
      }

      imageWrapper.appendChild(img)
      container.appendChild(imageWrapper)

      const deleteCleanup = createDeleteButton(div, onDelete)
      if (deleteCleanup) {
        this.cleanupFunctions.push(deleteCleanup)
      }

      if (onEdit) {
        const editCleanup = createEditButton(div, () => {
          if (!this.modalRoot) {
            this.modalRoot = document.createElement('div')
            document.body.appendChild(this.modalRoot)
            this.modalReactRoot = createRoot(this.modalRoot)
          }

          this.modalReactRoot?.render(
            createElement(ImageEditModal, {
              isOpen: true,
              onClose: () => this.modalReactRoot?.render(null),
              initialStyle: this.style,
              imageUrl: this.url,
              onSave: (style) => {
                this.updateStyle(style)
                if (onEdit) {
                  onEdit({
                    ...style,
                    width: this.width
                  })
                }
                this.modalReactRoot?.render(null)
              }
            })
          )
        })
        if (editCleanup) {
          this.cleanupFunctions.push(editCleanup)
        }
      }

      const resizeCleanup = createResizeHandle(container, {
        minWidth: 50,
        maxWidth: 400,
        maintainAspectRatio: true,
        onResize: (width: number) => {
          this.width = width
          container.style.width = `${width}px`
          this.draw()
          
          if (onEdit) {
            onEdit({
              ...this.style,
              width: width
            })
          }
        }
      })
      if (resizeCleanup) {
        this.cleanupFunctions.push(resizeCleanup)
      }

      const handleDragStart = (e: MouseEvent) => {
        e.stopPropagation()
        this.isDragging = true
        document.body.style.cursor = 'move'
      }

      const handleDragMove = (e: MouseEvent) => {
        if (!this.isDragging) return;
        
        const overlayProjection = this.getProjection();
        const oldPoint = overlayProjection.fromLatLngToDivPixel(this.initialPosition);
        
        if (oldPoint) {
          const newPoint = new google.maps.Point(
            oldPoint.x + e.movementX,
            oldPoint.y + e.movementY
          );
          const newPosition = overlayProjection.fromDivPixelToLatLng(newPoint);
          
          if (newPosition) {
            this.position = newPosition;
            this.initialPosition = newPosition;
            this.draw();
          }
        }
      }

      const handleDragEnd = () => {
        if (this.isDragging) {
          this.isDragging = false
          document.body.style.cursor = 'default'
        }
      }

      div.addEventListener('mousedown', handleDragStart)
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)

      this.cleanupFunctions.push(() => {
        div.removeEventListener('mousedown', handleDragStart)
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
      })

      div.appendChild(container)
      this.div = div

      const panes = this.getPanes()
      panes?.overlayMouseTarget.appendChild(div)
    }

    draw() {
      if (!this.div || !this.isMapReady || !this.getProjection()) {
        return
      }
      
      // First ensure all styles are applied
      if (this.container) {
        this.applyStyles(this.container)
      }
      
      // Then calculate position
      const overlayProjection = this.getProjection()
      const point = overlayProjection.fromLatLngToDivPixel(this.initialPosition)
      
      if (point) {
        // Get dimensions AFTER styles are applied
        const width = this.div.offsetWidth
        const height = this.div.offsetHeight
        
        // Calculate position
        const left = Math.round(point.x - width / 2)
        const top = Math.round(point.y - height / 2)
        
        // Apply position
        if (this.div.style.left !== `${left}px` || this.div.style.top !== `${top}px`) {
          this.div.style.left = `${left}px`
          this.div.style.top = `${top}px`
        }
      }
    }

    onRemove() {
      this.cleanupFunctions.forEach(cleanup => cleanup())
      this.cleanupFunctions = []
      if (this.div) {
        this.div.parentNode?.removeChild(this.div)
        this.div = null
        this.container = null
        this.imageWrapper = null
      }
      if (this.modalRoot) {
        this.modalReactRoot?.unmount()
        this.modalRoot.parentNode?.removeChild(this.modalRoot)
        this.modalRoot = null
        this.modalReactRoot = null
      }
    }

    getPosition() {
      return this.position
    }
  }

  const imageOverlay = new CustomImageOverlay(config)
  imageOverlay.setMap(map)
  return imageOverlay
}

export function createCustomTextOverlay(
  overlay: MapOverlay,
  map: google.maps.Map,
  onDelete: () => void,
  createDeleteButton: (container: HTMLElement | null, onDelete: () => void) => (() => void) | null,
  createEditButton: (container: HTMLElement | null, onEdit: () => void) => (() => void) | null,
  onEdit?: (text: string, style: any) => void,
  createResizeHandle: (container: HTMLElement | null, config: ResizeConfig) => (() => void) | null
) {
  class CustomTextOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null
    private contentDiv: HTMLDivElement | null = null
    private modalRoot: HTMLDivElement | null = null
    private modalReactRoot: ReturnType<typeof createRoot> | null = null
    private position: google.maps.LatLng
    private initialPosition: google.maps.LatLng
    private content: string
    private style: any
    private isDragging = false
    private isResizing = false
    private startPos = { x: 0, y: 0 }
    private startWidth = 0
    private cleanupFunctions: Array<() => void> = []
    private baseWidth: number
    private currentWidth: number
    private baseFontSize: number
    private isMapReady = false
    private drawCount = 0
    private lastWidth: number = 0
    private lastHeight: number = 0
    private resizeHandleCleanup: (() => void) | null = null

    constructor(position: google.maps.LatLng, content: string, style: any) {
      super()
      this.position = position
      this.initialPosition = position
      this.content = content
      this.style = style
      this.baseWidth = style.width || 80
      this.currentWidth = this.baseWidth
      this.baseFontSize = style.fontSize || 14
    }

    private getRgbaColor(hex: string, opacity: number) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

    private calculateScaledValues(width: number) {
      const scale = width / this.baseWidth
      return {
        fontSize: Math.round(this.baseFontSize * scale),
        padding: Math.round(this.style.padding * scale),
        borderWidth: Math.round(this.style.borderWidth * scale)
      }
    }

    private applyStyles(contentDiv: HTMLDivElement, width: number) {
      const scaled = this.calculateScaledValues(width)
      
      const styles = {
        // Text styles
        color: this.style.color || '#000000',
        fontSize: `${scaled.fontSize}px`,
        fontFamily: this.style.fontFamily || 'Arial',
        fontWeight: this.style.fontWeight || 'normal',
        textAlign: this.style.textAlign || 'center',
        
        // Container styles
        backgroundColor: this.getRgbaColor(this.style.backgroundColor || '#FFFFFF', this.style.backgroundOpacity || 1),
        border: `${scaled.borderWidth}px solid ${this.getRgbaColor(this.style.borderColor || '#000000', this.style.borderOpacity || 1)}`,
        padding: `${scaled.padding}px`,
        borderRadius: '4px',
        
        // Layout styles
        minWidth: 'min-content',
        width: `${width}px`,
        maxWidth: '400px',
        whiteSpace: 'pre',
        display: 'inline-block',
        position: 'relative',
        boxSizing: 'border-box',
        lineHeight: '1.2',
        verticalAlign: 'middle',
        cursor: 'move'
      }

      // Apply all styles at once
      Object.assign(contentDiv.style, styles)
      
      // Set content after styles
      contentDiv.innerHTML = this.content
    }

    private setupResizeHandle() {
      // Clean up existing resize handle if it exists
      if (this.resizeHandleCleanup) {
        this.resizeHandleCleanup();
        this.resizeHandleCleanup = null;
      }

      if (this.contentDiv) {
        const resizeCleanup = createResizeHandle(this.contentDiv, {
          minWidth: 30,
          maxWidth: 400,
          onResize: (width: number) => {
            this.isResizing = true;
            this.currentWidth = width;
            this.applyStyles(this.contentDiv!, width);
            this.draw();
            
            if (onEdit) {
              onEdit(this.content, {
                ...this.style,
                fontSize: this.baseFontSize,
                width: width
              });
            }
          }
        });

        if (resizeCleanup) {
          this.resizeHandleCleanup = resizeCleanup;
          this.cleanupFunctions.push(resizeCleanup);
        }
      }
    }

    updateContent(content: string, style: any) {
      this.content = content;
      this.style = {
        ...this.style,
        ...style,
        width: style.width || this.baseWidth,
        fontSize: style.fontSize || this.baseFontSize
      };
      this.baseWidth = this.style.width;
      this.currentWidth = this.baseWidth;
      this.baseFontSize = this.style.fontSize;

      if (this.contentDiv) {
        this.applyStyles(this.contentDiv, this.currentWidth);
        // Recreate resize handle after updating content
        this.setupResizeHandle();
      }

      this.draw();
    }

    onAdd() {
      const map = this.getMap();

      if (!map || !(map instanceof google.maps.Map) || !map.getProjection()) {
        map?.addListener('idle', () => {
          this.isMapReady = true;
          this.draw();
        });
        return;
      }

      this.isMapReady = true;
      const div = document.createElement('div');
      div.className = 'custom-map-overlay';
      Object.assign(div.style, {
        position: 'absolute',
        cursor: 'move',
        userSelect: 'none'
      });

      const contentDiv = document.createElement('div');
      contentDiv.className = 'text-content';
      this.applyStyles(contentDiv, this.currentWidth);
      this.contentDiv = contentDiv;

      div.appendChild(contentDiv);

      // Setup resize handle
      this.setupResizeHandle();

      const deleteCleanup = createDeleteButton(div, onDelete);
      if (deleteCleanup) {
        this.cleanupFunctions.push(deleteCleanup);
      }

      if (onEdit) {
        const editCleanup = createEditButton(div, () => {
          if (!this.modalRoot) {
            this.modalRoot = document.createElement('div');
            document.body.appendChild(this.modalRoot);
            this.modalReactRoot = createRoot(this.modalRoot);
          }

          this.modalReactRoot?.render(
            createElement(TextEditModal, {
              isOpen: true,
              onClose: () => this.modalReactRoot?.render(null),
              initialText: this.content,
              initialStyle: {
                ...this.style,
                fontSize: this.baseFontSize,
                width: this.baseWidth
              },
              onSave: (text, style) => {
                this.updateContent(text, style);
                onEdit(text, style);
                this.modalReactRoot?.render(null);
              }
            })
          );
        });
        if (editCleanup) {
          this.cleanupFunctions.push(editCleanup);
        }
      }

      const handleDragStart = (e: MouseEvent) => {
        // Don't start drag if clicking on resize handle
        const target = e.target as HTMLElement;
        if (target.closest('.resize-handle')) {
          return;
        }
        
        if (this.isResizing) return;
        e.stopPropagation();
        this.isDragging = true;
        this.startPos = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'move';
      }

      const handleDragMove = (e: MouseEvent) => {
        if (!this.isDragging || this.isResizing) return;
        e.preventDefault();
        const dx = e.clientX - this.startPos.x;
        const dy = e.clientY - this.startPos.y;
        const proj = this.getProjection();
        const point = proj.fromLatLngToDivPixel(this.initialPosition);
        const newPoint = new google.maps.Point(point.x + dx, point.y + dy);
        const newPosition = proj.fromDivPixelToLatLng(newPoint);
        this.position = newPosition;
        this.initialPosition = newPosition;
        this.draw();
        this.startPos = { x: e.clientX, y: e.clientY };
      }

      const handleDragEnd = () => {
        if (this.isDragging) {
          this.isDragging = false;
          document.body.style.cursor = 'default';
        }
        if (this.isResizing) {
          this.isResizing = false;
          document.body.style.cursor = 'default';
        }
      }

      div.addEventListener('mousedown', handleDragStart);
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);

      this.cleanupFunctions.push(() => {
        div.removeEventListener('mousedown', handleDragStart);
        div.removeEventListener('mousemove', handleDragMove);
        div.removeEventListener('mouseup', handleDragEnd);
      });

      this.div = div;
      const panes = this.getPanes();
      panes?.overlayMouseTarget.appendChild(div);
    }

    draw() {
      if (!this.div || !this.isMapReady || !this.getProjection()) {
        return;
      }
      
      // First ensure all styles are applied
      if (this.contentDiv) {
        this.applyStyles(this.contentDiv, this.currentWidth);
      }
      
      // Then calculate position
      const overlayProjection = this.getProjection();
      const point = overlayProjection.fromLatLngToDivPixel(this.initialPosition);
      
      if (point) {
        // Get dimensions AFTER styles are applied
        const width = this.div.offsetWidth;
        const height = this.div.offsetHeight;
        
        // Calculate position
        const left = Math.round(point.x - width / 2);
        const top = Math.round(point.y - height / 2);
        
        // Apply position
        if (this.div.style.left !== `${left}px` || this.div.style.top !== `${top}px`) {
          this.div.style.left = `${left}px`;
          this.div.style.top = `${top}px`;
        }
      }
    }

    onRemove() {
      // Clean up resize handle
      if (this.resizeHandleCleanup) {
        this.resizeHandleCleanup();
        this.resizeHandleCleanup = null;
      }

      this.cleanupFunctions.forEach(cleanup => cleanup());
      this.cleanupFunctions = [];
      if (this.div) {
        this.div.parentNode?.removeChild(this.div);
        this.div = null;
        this.contentDiv = null;
      }
      if (this.modalRoot) {
        this.modalReactRoot?.unmount();
        this.modalRoot.parentNode?.removeChild(this.modalRoot);
        this.modalRoot = null;
        this.modalReactRoot = null;
      }
    }

    getPosition() {
      return this.position;
    }
  }

  // Container styles
  const containerStyle = {
    backgroundColor: overlay.properties.containerStyle?.backgroundColor || '#FFFFFF',
    borderColor: overlay.properties.containerStyle?.borderColor || '#000000',
    borderWidth: overlay.properties.containerStyle?.borderWidth || 1,
    padding: overlay.properties.containerStyle?.padding || 8,
    backgroundOpacity: overlay.properties.containerStyle?.backgroundOpacity || 1,
    borderOpacity: overlay.properties.containerStyle?.borderOpacity || 1
  }

  // Text styles
  const textStyle = {
    color: overlay.properties.textStyle?.color || '#000000',
    fontSize: overlay.properties.textStyle?.fontSize || 14,
    fontFamily: overlay.properties.textStyle?.fontFamily || 'Arial',
    fontWeight: overlay.properties.textStyle?.fontWeight || 'normal',
    textAlign: overlay.properties.textStyle?.textAlign || 'center'
  }

  const style = {
    ...containerStyle,
    ...textStyle,
    width: overlay.properties.width || 80
  }

  const textOverlay = new CustomTextOverlay(
    new google.maps.LatLng(overlay.position.lat, overlay.position.lng),
    overlay.properties.content || '',
    style
  )

  textOverlay.setMap(map)
  return textOverlay
}

export function createResizeHandle(container: HTMLElement | null, config: ResizeConfig) {
  if (!container) return null

  const {
    minWidth,
    maxWidth,
    maintainAspectRatio = false,
    aspectRatio = 1,
    onResize
  } = config

  const handle = document.createElement('div')
  handle.className = 'resize-handle'
  Object.assign(handle.style, {
    position: 'absolute',
    right: '-8px',
    bottom: '-8px',
    width: '16px',
    height: '16px',
    backgroundColor: 'white',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    cursor: 'se-resize',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1000',
    transition: 'background-color 0.2s',
    opacity: '1'
  })

  const icon = document.createElement('div')
  Object.assign(icon.style, {
    width: '6px',
    height: '6px',
    borderRight: '2px solid #D1D5DB',
    borderBottom: '2px solid #D1D5DB'
  })

  try {
    handle.appendChild(icon)
  } catch (error) {
    console.warn('Failed to append resize handle icon')
    return null
  }

  let isResizing = false
  let startX = 0
  let startWidth = 0
  let lastWidth = container.offsetWidth

  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    isResizing = true
    startX = e.clientX
    startWidth = container.offsetWidth
    document.body.style.cursor = 'se-resize'
    handle.style.backgroundColor = '#F3F4F6'
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    e.preventDefault()
    
    const dx = e.clientX - startX
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + dx))
    
    if (newWidth !== lastWidth) {
      lastWidth = newWidth
      container.style.width = `${newWidth}px`

      if (maintainAspectRatio && aspectRatio) {
        const newHeight = newWidth / aspectRatio
        container.style.height = `${newHeight}px`
      }

      onResize(newWidth)
    }
  }

  const handleMouseUp = () => {
    if (isResizing) {
      isResizing = false
      document.body.style.cursor = 'default'
      handle.style.backgroundColor = 'white'
    }
  }

  // Handle hover on the resize handle itself
  const handleMouseEnter = () => {
    if (!isResizing) {
      handle.style.backgroundColor = '#F3F4F6'
    }
  }

  const handleHandleMouseLeave = () => {
    if (!isResizing) {
      handle.style.backgroundColor = 'white'
    }
  }

  handle.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  handle.addEventListener('mouseenter', handleMouseEnter)
  handle.addEventListener('mouseleave', handleHandleMouseLeave)

  try {
    container.appendChild(handle)
  } catch (error) {
    console.warn('Failed to append resize handle')
    return null
  }

  return () => {
    handle.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    handle.removeEventListener('mouseenter', handleMouseEnter)
    handle.removeEventListener('mouseleave', handleHandleMouseLeave)
    try {
      if (handle.parentNode === container) {
        container.removeChild(handle)
      }
    } catch (error) {
      console.warn('Failed to remove resize handle')
    }
  }
}