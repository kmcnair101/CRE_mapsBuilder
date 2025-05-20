import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { ImageEditModal } from '@/components/modals/ImageEditModal'
import type { ContainerStyle } from '@/lib/types'

interface BusinessOverlayConfig {
  position: google.maps.LatLng
  logo: string
  businessName: string
  width: number
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
      console.log('[BUSINESS_OVERLAY] Initial position:', {
        lat: this.position.lat(),
        lng: this.position.lng()
      });
      this.setMap(map);
    }

    onAdd() {
      // Create div code...
    }

    draw() {
      if (!this.div) return;

      const projection = this.getProjection();
      if (!projection) {
        console.log('[BUSINESS_OVERLAY] No projection available');
        return;
      }

      const point = projection.fromLatLngToDivPixel(this.position);
      if (!point) {
        console.log('[BUSINESS_OVERLAY] Could not convert position to pixels');
        return;
      }

      // Log both LatLng and pixel coordinates
      console.log('[BUSINESS_OVERLAY] Drawing at:', {
        latLng: {
          lat: this.position.lat(),
          lng: this.position.lng()
        },
        pixels: {
          x: point.x,
          y: point.y
        }
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
      console.log('[BUSINESS_OVERLAY] Position update:', {
        from: {
          lat: this.position.lat(),
          lng: this.position.lng()
        },
        to: {
          lat: position.lat(),
          lng: position.lng()
        }
      });
      
      this.position = position;
      this.draw();
    }
    
    // ... rest of the implementation
  }

  // Add map event listeners to track when drawing might occur
  map.addListener('bounds_changed', () => {
    console.log('[BUSINESS_OVERLAY] Map bounds changed, current position:', {
      lat: options.position.lat(),
      lng: options.position.lng()
    });
  });

  map.addListener('zoom_changed', () => {
    console.log('[BUSINESS_OVERLAY] Map zoom changed:', {
      zoom: map.getZoom(),
      position: {
        lat: options.position.lat(),
        lng: options.position.lng()
      }
    });
  });

  return new BusinessLogoOverlay();
}