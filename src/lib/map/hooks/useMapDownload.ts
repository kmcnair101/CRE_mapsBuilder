import html2canvas from 'html2canvas'
import { loader } from '@/lib/google-maps'
import type { MapData } from '@/lib/types'
import { createSubjectPropertyOverlay } from '../overlays/SubjectPropertyOverlay'

export function useMapDownload() {
  const handleDownload = async (mapRef: React.RefObject<HTMLDivElement>, forThumbnail = false) => {
    if (!mapRef.current) return null

    try {
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
        width: mapElement.offsetWidth,
        height: mapElement.offsetHeight,
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

          // ULTIMATE TEXT REPLACEMENT STRATEGY
          // Find all text overlay elements and replace them with canvas-drawn text
          const textElements = clonedDoc.querySelectorAll('.text-content, [data-text-overlay], [data-subject-property-text]')
          textElements.forEach(element => {
            if (element instanceof HTMLElement) {
              const originalElement = document.querySelector(`[data-overlay-id="${element.getAttribute('data-overlay-id')}"]`) || element
              const computedStyle = window.getComputedStyle(originalElement)
              const textContent = element.textContent || element.innerHTML.replace(/<[^>]*>/g, '') || ''
              
              if (!textContent.trim()) return
              
              // Get exact dimensions from the original element
              const rect = originalElement.getBoundingClientRect()
              const containerWidth = Math.round(rect.width) || 100
              const containerHeight = Math.round(rect.height) || 30
              
              // Extract styling
              const fontSize = parseInt(computedStyle.fontSize) || 14
              const fontFamily = computedStyle.fontFamily || 'Arial'
              const color = computedStyle.color || '#000000'
              const backgroundColor = computedStyle.backgroundColor
              const border = computedStyle.border
              const borderRadius = computedStyle.borderRadius
              const padding = computedStyle.padding
              
              // Create a canvas to draw the text perfectly centered
              const canvas = clonedDoc.createElement('canvas')
              canvas.width = containerWidth
              canvas.height = containerHeight
              canvas.style.width = `${containerWidth}px`
              canvas.style.height = `${containerHeight}px`
              
              const ctx = canvas.getContext('2d')
              if (ctx) {
                // Set up canvas for text drawing
                ctx.font = `${fontSize}px ${fontFamily}`
                ctx.fillStyle = color
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                
                // Fill background if needed
                if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
                  ctx.fillStyle = backgroundColor
                  ctx.fillRect(0, 0, containerWidth, containerHeight)
                  ctx.fillStyle = color
                }
                
                // Draw text at exact center
                ctx.fillText(textContent, containerWidth / 2, containerHeight / 2)
              }
              
              // Replace the element with the canvas
              element.innerHTML = ''
              element.style.cssText = ''
              element.style.width = `${containerWidth}px`
              element.style.height = `${containerHeight}px`
              element.style.backgroundColor = backgroundColor
              element.style.border = border
              element.style.borderRadius = borderRadius
              element.style.padding = '0'
              element.style.margin = '0'
              element.style.overflow = 'hidden'
              element.style.position = 'relative'
              
              // Add the canvas
              element.appendChild(canvas)
            }
          })

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
    try {
      // Create a temporary container for the map
      const container = document.createElement('div')
      Object.assign(container.style, {
        width: '1024px',
        height: '768px',
        position: 'fixed',
        left: '-9999px',
        top: '-9999px',
        zIndex: '-1',
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

        // Wait for map to load
        await new Promise(resolve => {
          google.maps.event.addListenerOnce(map, 'idle', resolve)
        })

        // Add subject property overlay (not just a marker)
        if (mapData.subject_property) {
          const subjectPropertyOverlay = await createSubjectPropertyOverlay(
            mapData,
            () => {} // No-op for updates in download
          )
          
          subjectPropertyOverlay.setMap(map)
        }

        // Add overlays
        if (mapData.overlays?.length) {
          for (const overlay of mapData.overlays) {
            try {
              if (overlay.type === 'business' && overlay.properties.logo) {
                new google.maps.Marker({
                  position: { lat: overlay.position.lat, lng: overlay.position.lng },
                  map,
                  icon: {
                    url: overlay.properties.logo,
                    scaledSize: new google.maps.Size(40, 40),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(20, 20)
                  },
                  title: overlay.properties.businessName
                })
              } else if (overlay.type === 'shape') {
                const shapeOptions = {
                  map,
                  fillColor: overlay.properties.fill || '#FF0000',
                  fillOpacity: overlay.properties.shapeOpacity || 0.5,
                  strokeColor: overlay.properties.stroke || '#000000',
                  strokeWeight: overlay.properties.strokeWidth || 2
                }

                if (overlay.properties.shapeType === 'rect') {
                  new google.maps.Rectangle({
                    ...shapeOptions,
                    bounds: new google.maps.LatLngBounds(
                      new google.maps.LatLng(
                        overlay.position.lat - 0.001,
                        overlay.position.lng - 0.001
                      ),
                      new google.maps.LatLng(
                        overlay.position.lat + 0.001,
                        overlay.position.lng + 0.001
                      )
                    )
                  })
                } else if (overlay.properties.shapeType === 'circle') {
                  new google.maps.Circle({
                    ...shapeOptions,
                    center: { lat: overlay.position.lat, lng: overlay.position.lng },
                    radius: overlay.properties.radius || 100
                  })
                } else if (overlay.properties.shapeType === 'polygon' && overlay.properties.points) {
                  new google.maps.Polygon({
                    ...shapeOptions,
                    paths: overlay.properties.points
                  })
                }
              }
            } catch (err) {
              console.warn('Error adding overlay to download map:', err)
            }
          }
        }

        // Wait for overlays to load
        await new Promise(resolve => {
          google.maps.event.addListenerOnce(map, 'idle', resolve)
        })

        // Additional wait to ensure all tiles and overlays are rendered
        await new Promise(resolve => setTimeout(resolve, 2000))

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

            // ULTIMATE TEXT REPLACEMENT STRATEGY
            // Find all text overlay elements and replace them with canvas-drawn text
            const textElements = clonedDoc.querySelectorAll('.text-content, [data-text-overlay], [data-subject-property-text]')
            textElements.forEach(element => {
              if (element instanceof HTMLElement) {
                const originalElement = document.querySelector(`[data-overlay-id="${element.getAttribute('data-overlay-id')}"]`) || element
                const computedStyle = window.getComputedStyle(originalElement)
                const textContent = element.textContent || element.innerHTML.replace(/<[^>]*>/g, '') || ''
                
                if (!textContent.trim()) return
                
                // Get exact dimensions from the original element
                const rect = originalElement.getBoundingClientRect()
                const containerWidth = Math.round(rect.width) || 100
                const containerHeight = Math.round(rect.height) || 30
                
                // Extract styling
                const fontSize = parseInt(computedStyle.fontSize) || 14
                const fontFamily = computedStyle.fontFamily || 'Arial'
                const color = computedStyle.color || '#000000'
                const backgroundColor = computedStyle.backgroundColor
                const border = computedStyle.border
                const borderRadius = computedStyle.borderRadius
                const padding = computedStyle.padding
                
                // Create a canvas to draw the text perfectly centered
                const canvas = clonedDoc.createElement('canvas')
                canvas.width = containerWidth
                canvas.height = containerHeight
                canvas.style.width = `${containerWidth}px`
                canvas.style.height = `${containerHeight}px`
                
                const ctx = canvas.getContext('2d')
                if (ctx) {
                  // Set up canvas for text drawing
                  ctx.font = `${fontSize}px ${fontFamily}`
                  ctx.fillStyle = color
                  ctx.textAlign = 'center'
                  ctx.textBaseline = 'middle'
                  
                  // Fill background if needed
                  if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
                    ctx.fillStyle = backgroundColor
                    ctx.fillRect(0, 0, containerWidth, containerHeight)
                    ctx.fillStyle = color
                  }
                  
                  // Draw text at exact center
                  ctx.fillText(textContent, containerWidth / 2, containerHeight / 2)
                }
                
                // Replace the element with the canvas
                element.innerHTML = ''
                element.style.cssText = ''
                element.style.width = `${containerWidth}px`
                element.style.height = `${containerHeight}px`
                element.style.backgroundColor = backgroundColor
                element.style.border = border
                element.style.borderRadius = borderRadius
                element.style.padding = '0'
                element.style.margin = '0'
                element.style.overflow = 'hidden'
                element.style.position = 'relative'
                
                // Add the canvas
                element.appendChild(canvas)
              }
            })

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
      console.error('Error downloading map from data:', error)
      alert('Failed to download map. Please try again.')
      return false
    }
  }

  return { handleDownload, downloadMapFromData }
}