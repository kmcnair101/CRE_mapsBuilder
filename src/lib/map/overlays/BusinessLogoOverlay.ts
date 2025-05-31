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

      this.div.appendChild(img);

      // Optionally, add the business name below the logo
      // const nameDiv = document.createElement('div');
      // nameDiv.textContent = options.businessName;
      // nameDiv.style.textAlign = 'center';
      // nameDiv.style.fontSize = '14px';
      // nameDiv.style.marginTop = '4px';
      // this.div.appendChild(nameDiv);

      // Attach to the overlay pane
      const panes = this.getPanes();
      if (panes) {
        panes.overlayMouseTarget.appendChild(this.div);
      }
    }

    draw() {
      if (!this.div) return;

      const projection = this.getProjection();
      if (!projection) {
        return;
      }

      const point = projection.fromLatLngToDivPixel(this.position);
      if (!point) {
        return;
      }

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
  map.addListener('bounds_changed', () => {});

  map.addListener('zoom_changed', () => {});

  return new BusinessLogoOverlay();
}