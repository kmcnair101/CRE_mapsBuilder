import html2canvas from 'html2canvas'
import { loader } from '@/lib/google-maps'
import type { MapData } from '@/lib/types'

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

        // Add subject property marker
        if (mapData.subject_property) {
          new google.maps.Marker({
            position: { 
              lat: mapData.subject_property.lat, 
              lng: mapData.subject_property.lng 
            },
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3B82F6',
              fillOpacity: 0.7,
              strokeColor: '#2563EB',
              strokeWeight: 2
            },
            title: mapData.subject_property.name || 'Subject Property'
          })
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