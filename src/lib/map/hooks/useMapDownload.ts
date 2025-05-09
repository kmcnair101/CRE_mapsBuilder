import html2canvas from 'html2canvas'
import { loader } from '@/lib/google-maps'
import type { MapData } from '@/lib/types'
import { useSubscription } from '@/hooks/useSubscription'
import { useMapOverlays } from './useMapOverlays'


export function useMapDownload() {
  const { hasAccess } = useSubscription()
  const { addOverlayToMap } = useMapOverlays(
    () => {}, // no-op function for handleDeleteLayer
    undefined, // handleTextEdit
    undefined, // handleContainerEdit
    undefined  // handleShapeEdit
  )

  const handleDownload = async (
    mapRef: React.RefObject<HTMLDivElement>, 
    forThumbnail = false,
    width?: number,
    height?: number
  ) => {
    // Always allow thumbnails (they're used internally)
    if (!forThumbnail && !hasAccess()) {
      return null
    }
    if (!mapRef.current) return null

    try {
      // Store original dimensions
      const originalWidth = mapRef.current.style.width
      const originalHeight = mapRef.current.style.height

      // Set new dimensions if provided
      if (width && height) {
        mapRef.current.style.width = `${width}px`
        mapRef.current.style.height = `${height}px`
      }

      // Hide all Google Maps controls
      const mapElement = mapRef.current
      const controls = mapElement.querySelectorAll('.gm-style-cc, .gm-control-active, .gmnoprint, .gm-svpc')
      controls.forEach(control => {
        if (control instanceof HTMLElement) {
          control.style.visibility = 'hidden'
        }
      })

      // Also hide the Google logo
      const logo = mapElement.querySelector('.gm-style a[href*="maps.google.com"]')
      if (logo instanceof HTMLElement) {
        logo.style.visibility = 'hidden'
      }

      // Wait for any pending map updates
      await new Promise(resolve => setTimeout(resolve, 1000))

      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: forThumbnail ? 0.5 : 2,
        logging: false,
        width: width || mapElement.offsetWidth,
        height: height || mapElement.offsetHeight,
        onclone: (clonedDoc) => {
          // Hide controls in the cloned document as well
          const clonedControls = clonedDoc.querySelectorAll('.gm-style-cc, .gm-control-active, .gmnoprint, .gm-svpc')
          clonedControls.forEach(control => {
            if (control instanceof HTMLElement) {
              control.style.visibility = 'hidden'
            }
          })

          const clonedLogo = clonedDoc.querySelector('.gm-style a[href*="maps.google.com"]')
          if (clonedLogo instanceof HTMLElement) {
            clonedLogo.style.visibility = 'hidden'
          }

          const clonedMap = clonedDoc.querySelector('.gm-style') as HTMLElement
          if (clonedMap) {
            clonedMap.style.background = 'transparent'
          }

          // Ensure all images are loaded
          const images = clonedDoc.getElementsByTagName('img')
          return Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve()
            return new Promise(resolve => {
              img.onload = resolve
              img.onerror = resolve
              setTimeout(resolve, 3000)
            })
          }))
        }
      })

      // Restore original dimensions
      if (width && height) {
        mapRef.current.style.width = originalWidth
        mapRef.current.style.height = originalHeight
      }

      // Restore visibility of controls
      controls.forEach(control => {
        if (control instanceof HTMLElement) {
          control.style.visibility = ''
        }
      })
      if (logo instanceof HTMLElement) {
        logo.style.visibility = ''
      }

      if (forThumbnail) {
        return canvas.toDataURL('image/jpeg', 0.8)
      }

      const link = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      link.download = `map-${timestamp}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()

      return null
    } catch (error) {
      console.error('Error downloading map:', error)
      return null
    }
  }

  const downloadMapFromData = async (mapData: MapData, filename?: string) => {
    if (!hasAccess()) {
      return false
    }

    try {
      // Create a temporary container for the map
      const container = document.createElement('div')
      Object.assign(container.style, {
        position: 'fixed',
        left: '-9999px',
        top: '0',
        width: '800px',
        height: '600px',
        opacity: '1',
        backgroundColor: 'white',
        overflow: 'hidden'
      })
      document.body.appendChild(container)
      console.log('Container appended to DOM');

      // Create loading indicator
      const loadingIndicator = document.createElement('div')
      Object.assign(loadingIndicator.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        borderRadius: '8px',
        zIndex: '10000',
        fontSize: '16px'
      })
      loadingIndicator.textContent = 'Generating map image...'
      document.body.appendChild(loadingIndicator)

      try {
        console.log('mapData:', mapData)
        console.log('Loading Google Maps API...')
        await loader.load()
        console.log('Google Maps API loaded')

        // Initialize map
        const map = new google.maps.Map(container, {
          center: { lat: mapData.center_lat, lng: mapData.center_lng },
          zoom: mapData.zoom_level,
          disableDefaultUI: true,
          gestureHandling: 'none',
          keyboardShortcuts: false
        })
        console.log('Map initialized:', map);

        // After initializing the map, force a resize
        google.maps.event.trigger(map, 'resize');

        // Wait for map to be idle, but with a timeout fallback
        await Promise.race([
          new Promise<void>(resolve => {
            google.maps.event.addListenerOnce(map, 'idle', () => {
              console.log('Map idle (first)')
              resolve()
            })
          }),
          new Promise<void>((_, reject) => {
            const idleTimeout = setTimeout(() => {
              console.error('Map idle event timed out')
              reject(new Error('Map idle timeout'))
            }, 10000)
          })
        ])

        // Apply map style
        if (mapData.mapStyle) {
          if (mapData.mapStyle.type === 'satellite') {
            map.setMapTypeId('satellite')
          } else if (mapData.mapStyle.type === 'terrain') {
            map.setMapTypeId('terrain')
          } else {
            map.setMapTypeId('roadmap')
          }

          if (mapData.mapStyle.customStyles) {
            map.setOptions({ styles: mapData.mapStyle.customStyles })
          }
        }

        // Now add overlays after map is ready
        const overlaysWithProxiedUrls = mapData.overlays.map(overlay => {
          console.log('Processing overlay:', overlay.type, overlay.properties);
          
          if (overlay.type === 'image' && overlay.properties.url) {
            const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(overlay.properties.url)}`;
            console.log('Proxying image URL:', overlay.properties.url, 'to:', proxiedUrl);
            return {
              ...overlay,
              properties: {
                ...overlay.properties,
                url: proxiedUrl
              }
            };
          }
          if (overlay.type === 'business' && overlay.properties.logo) {
            const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(overlay.properties.logo)}`;
            console.log('Proxying business logo URL:', overlay.properties.logo, 'to:', proxiedUrl);
            return {
              ...overlay,
              properties: {
                ...overlay.properties,
                logo: proxiedUrl
              }
            };
          }
          return overlay;
        });
        console.log('All overlays with proxied URLs:', overlaysWithProxiedUrls);

        overlaysWithProxiedUrls.forEach(overlay => {
          console.log('Adding overlay to map:', overlay.type, overlay.properties);
          addOverlayToMap(overlay, map);
        });

        // if (mapData.subject_property) {
        //   await updateSubjectProperty()
        // }

        // Wait a bit to ensure all tiles and overlays are rendered
        console.log('Waiting for tiles and overlays to render...');
        await new Promise(resolve => setTimeout(resolve, 4000));
        console.log('Wait complete, capturing screenshot...');

        // Generate image
        console.log('Calling html2canvas...');
        const canvas = await html2canvas(container, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          scale: 2,
          logging: true, // Enable html2canvas logging
          onclone: (clonedDoc) => {
            console.log('Cloning document for html2canvas...');
            
            // Hide all Google Maps controls in the cloned document
            const clonedControls = clonedDoc.querySelectorAll('.gm-style-cc, .gm-control-active, .gmnoprint, .gm-svpc')
            clonedControls.forEach(control => {
              if (control instanceof HTMLElement) {
                control.style.visibility = 'hidden'
              }
            })

            const clonedLogo = clonedDoc.querySelector('.gm-style a[href*="maps.google.com"]')
            if (clonedLogo instanceof HTMLElement) {
              clonedLogo.style.visibility = 'hidden'
            }

            // Ensure all images are loaded
            const images = clonedDoc.getElementsByTagName('img')
            console.log('Found images in cloned document:', images.length);
            
            return Promise.all(Array.from(images).map(img => {
              console.log('Processing image:', img.src);
              if (img.complete) {
                console.log('Image already complete:', img.src);
                return Promise.resolve();
              }
              return new Promise(resolve => {
                img.onload = () => {
                  console.log('Image loaded successfully:', img.src);
                  resolve();
                }
                img.onerror = (error) => {
                  console.error('Error loading image:', img.src, error);
                  resolve();
                }
                setTimeout(() => {
                  console.log('Image load timeout:', img.src);
                  resolve();
                }, 3000)
              })
            }))
          }
        })
        console.log('html2canvas complete, canvas:', canvas);

        // Trigger download
        console.log('Triggering download...');
        const link = document.createElement('a')
        link.download = filename || `${mapData.title || 'map'}.png`
        link.href = canvas.toDataURL('image/png', 1.0)
        link.click()
        
        return true
      } finally {
        // Clean up
        if (document.body.contains(container)) {
          document.body.removeChild(container)
        }
        if (document.body.contains(loadingIndicator)) {
          document.body.removeChild(loadingIndicator)
        }
      }
    } catch (error) {
      console.error('Error downloading map from data:', error)
      alert('Failed to download map. Please try again.')
      return false
    }
  }

  return { handleDownload, downloadMapFromData }
}