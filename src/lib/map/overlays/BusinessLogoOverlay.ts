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
  ...rest: any[]
) {
  class BusinessLogoOverlay extends google.maps.OverlayView {
    private div: HTMLElement | null = null;
    private position: google.maps.LatLng;

    constructor() {
      super();
      this.position = options.position;
      this.setMap(map);
    }

    onAdd() {
      console.log('[BusinessLogoOverlay] onAdd called');
      // Create the main div
      this.div = document.createElement('div');
      this.div.className = 'business-logo-overlay';
      Object.assign(this.div.style, {
        position: 'absolute',
        cursor: 'move',
        userSelect: 'none',
        width: `${options.width}px`,
        height: `${options.height}px`,
        backgroundColor: options.style.backgroundColor,
        border: `${options.style.borderWidth}px solid ${options.style.borderColor}`,
        padding: `${options.style.padding}px`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px'
      });

      // Create the image element
      const img = document.createElement('img');
      img.src = options.logo;
      img.alt = options.businessName;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.display = 'block';

      // Add image load/error logging
      img.onload = () => console.log('[BusinessLogoOverlay] Image loaded successfully:', options.logo);
      img.onerror = () => console.error('[BusinessLogoOverlay] Image failed to load:', options.logo);

      this.div.appendChild(img);

      // Attach to the overlay pane
      const panes = this.getPanes();
      console.log('[BusinessLogoOverlay] Available panes:', panes ? Object.keys(panes) : 'none');
      if (panes) {
        panes.overlayMouseTarget.appendChild(this.div);
        console.log('[BusinessLogoOverlay] Div attached to overlayMouseTarget');
      } else {
        console.error('[BusinessLogoOverlay] No panes available');
      }
    }

    draw() {
      if (!this.div) {
        console.log('[BusinessLogoOverlay] draw called but div is null');
        return;
      }

      const projection = this.getProjection();
      if (!projection) {
        console.log('[BusinessLogoOverlay] No projection available');
        return;
      }

      const point = projection.fromLatLngToDivPixel(this.position);
      if (!point) {
        console.log('[BusinessLogoOverlay] Could not convert position to pixel coordinates');
        return;
      }

      console.log('[BusinessLogoOverlay] Drawing at position:', {
        lat: this.position.lat(),
        lng: this.position.lng(),
        pixelX: point.x,
        pixelY: point.y
      });

      this.div.style.left = `${point.x}px`;
      this.div.style.top = `${point.y}px`;
      this.div.style.position = 'absolute';
      this.div.style.transform = 'translate(-50%, -50%)';
    }

    getPosition() {
      return this.position;
    }

    setPosition(position: google.maps.LatLng) {
      this.position = position;
      this.draw();
    }
    
    // ... rest of the implementation
  }

  // Add map event listeners to track when drawing might occur
  map.addListener('bounds_changed', () => {
    console.log('[BusinessLogoOverlay] Map bounds changed');
  });

  map.addListener('zoom_changed', () => {
    console.log('[BusinessLogoOverlay] Map zoom changed');
  });

  return new BusinessLogoOverlay();
}