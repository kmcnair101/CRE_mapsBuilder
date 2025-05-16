import html2canvas from 'html2canvas'
import { loader } from '@/lib/google-maps'
import type { MapData } from '@/lib/types'
import { useSubscription } from '@/hooks/useSubscription'
import { useMapOverlays } from './useMapOverlays'

// Helper function to load images with retries
const loadImage = async (img: HTMLImageElement, retries = 3): Promise<void> => {
  console.log('[Download] Loading image:', { src: img.src, complete: img.complete, retries })
  
  if (img.complete) {
    console.log('[Download] Image already complete:', img.src)
    return Promise.resolve()
  }

  // If the image is from an external source and not already proxied, proxy it
  if (img.src.startsWith('http') && !img.src.includes('/api/proxy-image')) {
    const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(img.src)}`
    console.log('[Download] Proxying image:', { original: img.src, proxied: proxiedUrl })
    img.src = proxiedUrl
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log('[Download] Image load timeout:', { src: img.src, retries })
      if (retries > 0) {
        loadImage(img, retries - 1).then(resolve).catch(reject)
      } else {
        console.log('[Download] Max retries reached for image:', img.src)
        resolve() // Resolve anyway to continue with the process
      }
    }, 5000)

    img.onload = () => {
      console.log('[Download] Image loaded successfully:', img.src)
      clearTimeout(timeout)
      resolve()
    }

    img.onerror = () => {
      console.log('[Download] Image load error:', img.src)
      clearTimeout(timeout)
      if (retries > 0) {
        loadImage(img, retries - 1).then(resolve).catch(reject)
      } else {
        console.log('[Download] Max retries reached after error for image:', img.src)
        resolve() // Resolve anyway to continue with the process
      }
    }
  })
}

// Helper function to check if canvas is tainted
const checkTaintedCanvas = (canvas: HTMLCanvasElement) => {
  try {
    canvas.getContext('2d')?.getImageData(0, 0, 1, 1)
  } catch (err) {
    // Canvas is tainted
  }
}

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
    height?: number,
    googleMapRef?: React.RefObject<google.maps.Map>
  ) => {
    console.log('[useMapDownload] handleDownload called', {
      hasMapRef: !!mapRef,
      hasMapRefCurrent: !!mapRef?.current,
      forThumbnail,
      width,
      height,
      hasGoogleMapRef: !!googleMapRef,
      hasGoogleMapRefCurrent: !!googleMapRef?.current
    })

    if (!hasAccess()) {
      console.log('[useMapDownload] No access - subscription check failed')
      return null
    }

    if (!mapRef.current) {
      console.log('[useMapDownload] No map reference')
      return null
    }

    try {
      // Store original dimensions
      const originalWidth = mapRef.current.style.width
      const originalHeight = mapRef.current.style.height
      console.log('[Download] Original dimensions:', { width: originalWidth, height: originalHeight })

      // Set dimensions for capture if provided
      if (width && height) {
        console.log('[Download] Setting new dimensions:', { width, height })
        mapRef.current.style.width = `${width}px`
        mapRef.current.style.height = `${height}px`
      }

      // Hide controls temporarily
      const controls = mapRef.current.querySelectorAll('.gm-style-cc, .gm-control-active, .gmnoprint, .gm-svpc')
      controls.forEach(control => {
        if (control instanceof HTMLElement) {
          control.style.visibility = 'hidden'
        }
      })

      const logo = mapRef.current.querySelector('.gm-style a[href*="maps.google.com"]')
      if (logo instanceof HTMLElement) {
        logo.style.visibility = 'hidden'
      }

      // Wait for map to be idle
      const map = googleMapRef?.current
      if (map) {
        console.log('[Download] Waiting for map to be idle')
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.log('[Download] Map idle timeout')
            reject(new Error('Map idle timeout'))
          }, 10000)

          google.maps.event.addListenerOnce(map, 'idle', () => {
            console.log('[Download] Map is now idle')
            clearTimeout(timeout)
            resolve()
          })
        })
      }

      console.log('[Download] Starting html2canvas process')
      const canvas = await html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: forThumbnail ? 0.5 : 2,
        logging: true, // Enable html2canvas logging
        width: width || mapRef.current.offsetWidth,
        height: height || mapRef.current.offsetHeight,
        onclone: async (clonedDoc) => {
          console.log('[Download] Starting clone process')
          try {
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

            // Ensure all images are loaded with retries
            const images = clonedDoc.getElementsByTagName('img')
            console.log('[Download] Found images to load:', images.length)
            
            // Load all images in parallel with retries
            await Promise.all(Array.from(images).map(async (img) => {
              console.log('[Download] Processing image:', img.src)
              // Set crossOrigin for all images
              img.crossOrigin = 'anonymous'
              
              // Proxy any external URLs, including Google Maps tiles
              if (img.src.includes('vt?pb=') || (img.src.startsWith('http') && !img.src.includes('/api/proxy-image'))) {
                const originalSrc = img.src
                img.src = `/api/proxy-image?url=${encodeURIComponent(originalSrc)}`
              }
              
              return loadImage(img)
            }))

            console.log('[Download] All images processed, waiting additional time')
            await new Promise(resolve => setTimeout(resolve, 2000))
            console.log('[Download] Clone process complete')
          } catch (error) {
            console.error('[Download] Error in clone process:', error)
            throw error
          }
        }
      })

      console.log('[Download] Canvas created, checking for taint')
      checkTaintedCanvas(canvas)

      // Restore original dimensions
      if (width && height) {
        console.log('[Download] Restoring original dimensions')
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
        console.log('[Download] Generating thumbnail')
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          console.log('[Download] Thumbnail generated successfully')
          return dataUrl
        } catch (err) {
          console.error('[Download] Error generating thumbnail:', err)
          return null
        }
      }

      console.log('[Download] Generating final image')
      try {
        const dataUrl = canvas.toDataURL('image/png', 1.0)
        console.log('[Download] Image generated successfully, triggering download')
        
        const link = document.createElement('a')
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        link.download = `map-${timestamp}.png`
        link.href = dataUrl
        link.click()

        console.log('[Download] Download triggered successfully')
        return null
      } catch (err) {
        console.error('[Download] Error generating download:', err)
        throw new Error('Failed to generate download image')
      }
    } catch (error) {
      console.error('[Download] Error in handleDownload:', error)
      throw error
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
        await loader.load()

        // Initialize map
        const map = new google.maps.Map(container, {
          center: { lat: mapData.center_lat, lng: mapData.center_lng },
          zoom: mapData.zoom_level,
          disableDefaultUI: true,
          gestureHandling: 'none',
          keyboardShortcuts: false
        })

        // After initializing the map, force a resize
        google.maps.event.trigger(map, 'resize')

        // Wait for map to be idle, but with a timeout fallback
        await Promise.race([
          new Promise<void>(resolve => {
            google.maps.event.addListenerOnce(map, 'idle', () => {
              resolve()
            })
          }),
          new Promise<void>((_, reject) => {
            const idleTimeout = setTimeout(() => {
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
          if (overlay.type === 'image' && overlay.properties.url) {
            const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(overlay.properties.url)}`
            return {
              ...overlay,
              properties: {
                ...overlay.properties,
                url: proxiedUrl
              }
            }
          }
          if (overlay.type === 'business' && overlay.properties.logo) {
            const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(overlay.properties.logo)}`
            return {
              ...overlay,
              properties: {
                ...overlay.properties,
                logo: proxiedUrl
              }
            }
          }
          return overlay
        })

        overlaysWithProxiedUrls.forEach(overlay => {
          addOverlayToMap(overlay, map)
        })

        // Wait a bit to ensure all tiles and overlays are rendered
        await new Promise(resolve => setTimeout(resolve, 4000))

        // Generate image
        const canvas = await html2canvas(container, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          scale: 2,
          logging: false,
          onclone: (clonedDoc) => {
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
            
            return Promise.all(Array.from(images).map(img => {
              if (img.complete) {
                return Promise.resolve<void>(undefined)
              }
              return new Promise<void>(resolve => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
                setTimeout(() => resolve(), 3000)
              })
            }))
          }
        })

        // Trigger download
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
      alert('Failed to download map. Please try again.')
      return false
    }
  }

  return { handleDownload, downloadMapFromData }
}