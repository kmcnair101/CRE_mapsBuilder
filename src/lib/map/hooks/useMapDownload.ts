import html2canvas from 'html2canvas'
import { loader } from '@/lib/google-maps'
import type { MapData } from '@/lib/types'
import { useSubscription } from '@/hooks/useSubscription'
import { useMapOverlays } from './useMapOverlays'
import { useCallback } from 'react'

// Helper function to load images with retries
const loadImage = async (img: HTMLImageElement, retries = 3): Promise<void> => {
  if (img.complete) {
    return Promise.resolve()
  }

  // If the image is from an external source and not already proxied, proxy it
  if (img.src.startsWith('http') && !img.src.includes('/api/proxy-image')) {
    const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(img.src)}`
    img.src = proxiedUrl
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (retries > 0) {
        loadImage(img, retries - 1).then(resolve).catch(reject)
      } else {
        resolve() // Resolve anyway to continue with the process
      }
    }, 5000)

    img.onload = () => {
      clearTimeout(timeout)
      resolve()
    }

    img.onerror = () => {
      clearTimeout(timeout)
      if (retries > 0) {
        loadImage(img, retries - 1).then(resolve).catch(reject)
      } else {
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

  const handleDownload = useCallback(async (
    mapRef: React.RefObject<HTMLDivElement>,
    forThumbnail = false,
    width?: number,
    height?: number,
    googleMapRef?: React.RefObject<google.maps.Map>
  ) => {
    try {
      const access = hasAccess()

      if (!access) {
        alert('You need an active subscription to download maps.')
        return false
      }

      // Wait for map to be idle with increased timeout
      const map = googleMapRef?.current
      if (map) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Map idle timeout'))
          }, 20000) // Increase timeout to 20 seconds

          const checkMapReady = () => {
            const center = map.getCenter()
            const zoom = map.getZoom()
            const div = map.getDiv()
            
            if (center && zoom !== undefined && div.offsetWidth > 0 && div.offsetHeight > 0) {
              clearTimeout(timeout)
              resolve()
            } else {
              google.maps.event.trigger(map, 'resize')
              setTimeout(checkMapReady, 500)
            }
          }

          google.maps.event.addListenerOnce(map, 'idle', checkMapReady)
          google.maps.event.addListenerOnce(map, 'tilesloaded', checkMapReady)
          checkMapReady()
        })
      }

      // Wait a bit to ensure all tiles and overlays are rendered
      await new Promise(resolve => setTimeout(resolve, 4000))

      // Generate image
      const canvas = await html2canvas(mapRef.current!, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        scale: 2,
        logging: true,
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
      link.download = `${forThumbnail ? 'thumbnail' : 'map'}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
      
      return true
    } finally {
    }
  }, [])

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
        let canvas: HTMLCanvasElement | null = null
        try {
          canvas = await html2canvas(container, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: 'white',
            scale: 2,
            logging: true,
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
        } catch (err) {
          throw err
        }

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