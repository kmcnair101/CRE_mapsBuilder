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
  const { hasAccess } = useSubscription() // Add this missing hook
  
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
      // Wait for map to be idle with increased timeout
      const map = googleMapRef?.current
      if (map) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('Map idle timeout, proceeding anyway')
            resolve() // Don't reject, just proceed
          }, 10000) // Reduced timeout

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
      await new Promise(resolve => setTimeout(resolve, 2000)) // Reduced wait time

      console.log('Starting html2canvas capture...')

      // Generate image
      const canvas = await html2canvas(mapRef.current!, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        scale: 2,
        logging: false, // Disable logging to reduce console noise
        onclone: (clonedDoc) => {
          console.log('onclone function called')
          
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

          // Add line breaks ONLY in the cloned document for download
          const addLineBreaksToTextOverlays = () => {
            // Find all divs that might be text overlays
            const allDivs = clonedDoc.querySelectorAll('div')
            let overlayCount = 0
            
            allDivs.forEach((element: Element) => {
              if (element instanceof HTMLElement && element.textContent && element.textContent.trim()) {
                // Check if this looks like a text overlay or subject property
                const hasBackground = element.style.backgroundColor && 
                                     element.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                                     element.style.backgroundColor !== 'transparent'
                const hasBorder = element.style.border || element.style.borderWidth
                const hasAbsolutePosition = element.style.position === 'absolute'
                
                // If it looks like a text overlay
                if ((hasBackground || hasBorder) && hasAbsolutePosition) {
                  overlayCount++
                  // Add line break to the end if not already present
                  if (!element.innerHTML.endsWith('<br>') && !element.innerHTML.endsWith('<br/>')) {
                    element.innerHTML = element.innerHTML + '<br>'
                  }
                }
              }
            })
            
            console.log(`Added line breaks to ${overlayCount} text overlays`)
          }

          addLineBreaksToTextOverlays()

          // Return Promise.resolve() instead of handling images
          return Promise.resolve()
        }
      })

      console.log('html2canvas completed successfully')

      // Only trigger download if not generating thumbnail
      if (!forThumbnail) {
        const link = document.createElement('a')
        link.download = 'map.png'
        link.href = canvas.toDataURL('image/png', 1.0)
        link.click()
        console.log('Download triggered')
      }

      // Return the data URL
      return canvas.toDataURL('image/png', 1.0)
    } catch (error) {
      console.error('Error generating map image:', error)
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }, [])

  const downloadMapFromData = async (mapData: MapData, filename?: string) => {
    if (!hasAccess()) {
      alert('Please upgrade your subscription to download maps.')
      return false
    }

    console.log('Starting downloadMapFromData...')

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
        console.log('Google Maps loaded')

        // Initialize map
        const map = new google.maps.Map(container, {
          center: { lat: mapData.center_lat, lng: mapData.center_lng },
          zoom: mapData.zoom_level,
          disableDefaultUI: true,
          gestureHandling: 'none',
          keyboardShortcuts: false
        })

        // Wait for map to be idle with shorter timeout
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('Map idle timeout, proceeding anyway')
            resolve()
          }, 5000) // Shorter timeout

          google.maps.event.addListenerOnce(map, 'idle', () => {
            clearTimeout(timeout)
            resolve()
          })
        })

        console.log('Map initialized and idle')

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

        // Add overlays without modification for now
        mapData.overlays.forEach(overlay => {
          addOverlayToMap(overlay, map)
        })

        console.log(`Added ${mapData.overlays.length} overlays to map`)

        // Wait for overlays to render
        await new Promise(resolve => setTimeout(resolve, 2000))

        console.log('Starting html2canvas for downloadMapFromData...')

        // Generate image with simplified onclone
        const canvas = await html2canvas(container, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          scale: 2,
          logging: false,
          onclone: (clonedDoc) => {
            console.log('onclone function called for downloadMapFromData')
            
            // Hide Google Maps controls
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

            return Promise.resolve()
          }
        })

        console.log('html2canvas completed for downloadMapFromData')

        // Trigger download
        const link = document.createElement('a')
        link.download = filename || `${mapData.title || 'map'}.png`
        link.href = canvas.toDataURL('image/png', 1.0)
        link.click()
        
        console.log('Download triggered successfully')
        return true
        
      } finally {
        // Clean up
        if (document.body.contains(container)) {
          document.body.removeChild(container)
        }
        if (document.body.contains(loadingIndicator)) {
          document.body.removeChild(loadingIndicator)
        }
        console.log('Cleanup completed')
      }
    } catch (error) {
      console.error('Error in downloadMapFromData:', error)
      alert(`Failed to download map: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }

  return { handleDownload, downloadMapFromData }
}