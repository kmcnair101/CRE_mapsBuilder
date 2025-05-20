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
  options: BusinessLogoOptions,
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
      // Create div code...
    }

    draw() {
      if (!this.div) return;

      const projection = this.getProjection();
      if (!projection) return;

      const point = projection.fromLatLngToDivPixel(this.position);
      if (!point) return;

      // Use the same positioning system as text overlays
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
      this.draw(); // Trigger redraw when position changes
    }
    
    // ... rest of the implementation
  }

  return new BusinessLogoOverlay();
}