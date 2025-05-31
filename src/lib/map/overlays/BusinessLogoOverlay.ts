import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { ImageEditModal } from '@/components/modals/ImageEditModal'
import type { ContainerStyle } from '@/lib/types'

interface BusinessOverlayConfig {
  position: google.maps.LatLng
  logo: string
  businessName: string
  width: number
  height: number
  style: ContainerStyle
}

interface ResizeConfig {
  minWidth: number
  maxWidth: number
  maintainAspectRatio: boolean
  aspectRatio: number
  onResize: (width: number) => void
}

const defaultContainerStyle = {
  backgroundColor: '#FFFFFF',
  borderColor: '#000000',
  borderWidth: 1,
  padding: 8,
  backgroundOpacity: 1,
  borderOpacity: 1
}

export function createBusinessLogoOverlay(
  options: BusinessOverlayConfig,
  map: google.maps.Map,
  onDelete: () => void,
  createDeleteButton: (container: HTMLElement | null, onDelete: () => void) => (() => void) | null,
  createEditButton: (container: HTMLElement | null, onEdit: () => void) => (() => void) | null,
  onEdit?: (style: any) => void,
  createResizeHandle: (container: HTMLElement | null, config: ResizeConfig) => (() => void) | null
) {
  class BusinessLogoOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null;
    private container: HTMLDivElement | null = null;
    private imageWrapper: HTMLDivElement | null = null;
    private modalRoot: HTMLDivElement | null = null;
    private modalReactRoot: ReturnType<typeof createRoot> | null = null;
    private position: google.maps.LatLng;
    private initialPosition: google.maps.LatLng;
    private isDragging = false;
    private cleanupFunctions: Array<() => void> = [];
    private aspectRatio: number = 1;
    private isMapReady = false;
    private isImageLoaded = false;
    private drawCount = 0;
    private lastWidth: number = 0;
    private lastHeight: number = 0;

    constructor() {
      super();
      this.position = options.position;
      this.initialPosition = options.position;
    }

    private getRgbaColor(hex: string, opacity: number) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    private applyStyles(container: HTMLDivElement) {
      const styles = {
        backgroundColor: this.getRgbaColor(options.style.backgroundColor, options.style.backgroundOpacity),
        border: `${options.style.borderWidth}px solid ${this.getRgbaColor(options.style.borderColor, options.style.borderOpacity)}`,
        padding: `${options.style.padding}px`,
        borderRadius: '4px',
        display: 'inline-block',
        position: 'relative',
        minWidth: '50px',
        maxWidth: '400px',
        width: `${options.width}px`,
        boxSizing: 'border-box'
      };

      Object.assign(container.style, styles);
    }

    updateStyle(style: ContainerStyle) {
      options.style = style;
      if (this.container) {
        this.applyStyles(this.container);
      }
    }

    onAdd() {
      console.log('[BusinessLogoOverlay] onAdd called with options:', {
        width: options.width,
        height: options.height,
        style: options.style
      });

      const map = this.getMap();

      if (!map || !(map instanceof google.maps.Map) || !map.getProjection()) {
        console.log('[BusinessLogoOverlay] Map not ready, waiting for idle event');
        map?.addListener('idle', () => {
          this.isMapReady = true;
          this.draw();
        });
        return;
      }

      this.isMapReady = true;
      const div = document.createElement('div');
      div.className = 'business-logo-overlay';
      Object.assign(div.style, {
        position: 'absolute',
        cursor: 'move',
        userSelect: 'none',
        zIndex: '1000'
      });

      const container = document.createElement('div');
      this.applyStyles(container);
      this.container = container;

      const imageWrapper = document.createElement('div');
      Object.assign(imageWrapper.style, {
        position: 'relative',
        width: '100%',
        overflow: 'hidden'
      });
      this.imageWrapper = imageWrapper;

      const img = document.createElement('img');
      img.src = options.logo;
      img.alt = options.businessName;
      Object.assign(img.style, {
        width: '100%',
        height: 'auto',
        display: 'block',
        objectFit: 'contain'
      });
      img.draggable = false;

      img.onload = () => {
        console.log('[BusinessLogoOverlay] Image loaded with dimensions:', {
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight
        });
        this.aspectRatio = img.naturalWidth / img.naturalHeight;
        this.isImageLoaded = true;
        if (this.imageWrapper) {
          this.imageWrapper.style.height = 'auto';
        }
        this.draw();
      };

      img.onerror = (error) => {
        console.error('[BusinessLogoOverlay] Failed to load image:', error);
      };

      imageWrapper.appendChild(img);
      container.appendChild(imageWrapper);

      // Log when controls are added
      console.log('[BusinessLogoOverlay] Adding controls...');

      const deleteCleanup = createDeleteButton(div, onDelete);
      if (deleteCleanup) {
        console.log('[BusinessLogoOverlay] Delete button added');
        this.cleanupFunctions.push(deleteCleanup);
      } else {
        console.warn('[BusinessLogoOverlay] Failed to add delete button');
      }

      if (onEdit) {
        const editCleanup = createEditButton(div, () => {
          console.log('[BusinessLogoOverlay] Edit button clicked');
          if (!this.modalRoot) {
            this.modalRoot = document.createElement('div');
            document.body.appendChild(this.modalRoot);
            this.modalReactRoot = createRoot(this.modalRoot);
          }

          this.modalReactRoot?.render(
            createElement(ImageEditModal, {
              isOpen: true,
              onClose: () => this.modalReactRoot?.render(null),
              initialStyle: options.style,
              imageUrl: options.logo,
              onSave: (style) => {
                console.log('[BusinessLogoOverlay] Style updated:', style);
                this.updateStyle(style);
                if (onEdit) {
                  onEdit({
                    ...style,
                    width: options.width,
                    height: options.height,
                    position: this.position
                  });
                }
                this.modalReactRoot?.render(null);
              }
            })
          );
        });
        if (editCleanup) {
          console.log('[BusinessLogoOverlay] Edit button added');
          this.cleanupFunctions.push(editCleanup);
        } else {
          console.warn('[BusinessLogoOverlay] Failed to add edit button');
        }
      }

      const resizeCleanup = createResizeHandle(container, {
        minWidth: 50,
        maxWidth: 400,
        maintainAspectRatio: true,
        aspectRatio: this.aspectRatio,
        onResize: (width: number) => {
          console.log('[BusinessLogoOverlay] Resize triggered:', {
            width,
            aspectRatio: this.aspectRatio
          });
          const aspectRatio = this.aspectRatio || 1;
          const height = Math.round(width / aspectRatio);
          options.width = width;
          options.height = height;
          
          container.style.width = `${width}px`;
          container.style.height = `${height}px`;
          
          if (this.imageWrapper) {
            this.imageWrapper.style.height = `${height}px`;
          }
          
          this.draw();
          if (onEdit) {
            onEdit({
              ...options.style,
              width,
              height,
              position: this.position
            });
          }
        }
      });
      if (resizeCleanup) {
        console.log('[BusinessLogoOverlay] Resize handle added');
        this.cleanupFunctions.push(resizeCleanup);
      } else {
        console.warn('[BusinessLogoOverlay] Failed to add resize handle');
      }

      const handleDragStart = (e: MouseEvent) => {
        e.stopPropagation();
        this.isDragging = true;
        document.body.style.cursor = 'move';
      };

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
      };

      const handleDragEnd = () => {
        if (this.isDragging) {
          this.isDragging = false;
          document.body.style.cursor = 'default';
        }
      };

      div.addEventListener('mousedown', handleDragStart);
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);

      this.cleanupFunctions.push(() => {
        div.removeEventListener('mousedown', handleDragStart);
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      });

      div.appendChild(container);
      this.div = div;

      const panes = this.getPanes();
      if (panes) {
        panes.overlayLayer.appendChild(div);
        console.log('[BusinessLogoOverlay] Div attached to overlayLayer');
      } else {
        console.error('[BusinessLogoOverlay] No panes available');
      }
    }

    draw() {
      if (!this.div || !this.isMapReady || !this.getProjection()) {
        console.log('[BusinessLogoOverlay] Draw skipped:', {
          hasDiv: !!this.div,
          isMapReady: this.isMapReady,
          hasProjection: !!this.getProjection()
        });
        return;
      }
      
      if (this.container) {
        this.applyStyles(this.container);
      }
      
      const overlayProjection = this.getProjection();
      const point = overlayProjection.fromLatLngToDivPixel(this.initialPosition);
      
      if (point) {
        const width = this.div.offsetWidth;
        const height = this.div.offsetHeight;
        
        console.log('[BusinessLogoOverlay] Drawing overlay:', {
          width,
          height,
          position: {
            x: point.x,
            y: point.y
          }
        });
        
        const left = Math.round(point.x - width / 2);
        const top = Math.round(point.y - height / 2);
        
        if (this.div.style.left !== `${left}px` || this.div.style.top !== `${top}px`) {
          this.div.style.left = `${left}px`;
          this.div.style.top = `${top}px`;
        }
      }
    }

    onRemove() {
      this.cleanupFunctions.forEach(cleanup => cleanup());
      this.cleanupFunctions = [];
      if (this.div) {
        this.div.parentNode?.removeChild(this.div);
        this.div = null;
        this.container = null;
        this.imageWrapper = null;
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

  const businessOverlay = new BusinessLogoOverlay();
  businessOverlay.setMap(map);
  return businessOverlay;
}