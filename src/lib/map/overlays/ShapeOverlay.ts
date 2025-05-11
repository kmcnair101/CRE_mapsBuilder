import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { ShapeEditModal } from '@/components/modals/ShapeEditModal'
import type { MapOverlay } from '@/lib/types'

// Keep track of currently selected shape
let selectedShape: google.maps.OverlayView | null = null

interface ShapeProperties {
  shapeType: 'rect' | 'circle' | 'polygon'
  style: {
    fillColor: string
    strokeColor: string
    strokeWeight: number
    fillOpacity: number
    strokeOpacity: number
  }
  shapeWidth?: number
  shapeHeight?: number
  radius?: number
  points?: Array<{ lat: number; lng: number }>
}

export function validatePosition(position: { lat: number; lng: number }): boolean {
  return (
    typeof position.lat === 'number' &&
    typeof position.lng === 'number' &&
    position.lat >= -90 &&
    position.lat <= 90 &&
    position.lng >= -180 &&
    position.lng <= 180
  )
}

export function createShapeOverlay(
  overlay: MapOverlay,
  map: google.maps.Map,
  onDelete: () => void,
  createDeleteButton: (container: HTMLElement | null, onDelete: () => void) => (() => void) | null,
  createEditButton: (container: HTMLElement | null, onEdit: () => void) => (() => void) | null,
  onEdit?: (properties: ShapeProperties) => void
) {
  class ShapeOverlay extends google.maps.OverlayView {
    private shape: google.maps.Rectangle | google.maps.Circle | google.maps.Polygon | null = null
    private controlsDiv: HTMLDivElement | null = null
    private modalRoot: HTMLDivElement | null = null
    private modalReactRoot: ReturnType<typeof createRoot> | null = null
    private position: google.maps.LatLng
    private properties: ShapeProperties
    private cleanupFunctions: Array<() => void> = []
    private isSelected = false
    private startPos = { x: 0, y: 0 }
    private isDragging = false

    constructor(position: google.maps.LatLng, properties: ShapeProperties) {
      super()
      this.position = position
      this.properties = properties
    }

    private createControls() {
      const controls = document.createElement('div')
      controls.className = 'shape-controls'
      Object.assign(controls.style, {
        position: 'absolute',
        display: 'none',
        flexDirection: 'row',
        gap: '8px',
        padding: '4px',
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: '1000',
        pointerEvents: 'auto'
      })

      // Create edit button
      const editButton = document.createElement('button')
      editButton.className = 'edit-button'
      Object.assign(editButton.style, {
        backgroundColor: '#3B82F6',
        color: 'white',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: 'none'
      })

      let editIconRoot: ReturnType<typeof createRoot> | null = null
      try {
        editIconRoot = createRoot(editButton)
        editIconRoot.render(createElement('span', { className: 'pencil-icon' }, '✎'))
      } catch (error) {
        console.warn('Failed to create edit button icon')
      }

      editButton.addEventListener('click', (e) => {
        e.stopPropagation()
        if (!this.modalRoot) {
          this.modalRoot = document.createElement('div')
          document.body.appendChild(this.modalRoot)
          this.modalReactRoot = createRoot(this.modalRoot)
        }

        this.modalReactRoot?.render(
          createElement(ShapeEditModal, {
            isOpen: true,
            onClose: () => {
              this.modalReactRoot?.render(null)
              this.deselectShape()
            },
            initialStyle: {
              fillColor: this.properties.style.fillColor,
              fillOpacity: this.properties.style.fillOpacity,
              strokeColor: this.properties.style.strokeColor,
              strokeOpacity: this.properties.style.strokeOpacity,
              strokeWeight: this.properties.style.strokeWeight
            },
            onSave: (style) => {
              if (this.shape) {
                this.shape.setOptions({
                  fillColor: style.fillColor,
                  fillOpacity: style.fillOpacity,
                  strokeColor: style.strokeColor,
                  strokeWeight: style.strokeWeight,
                  strokeOpacity: style.strokeOpacity
                })
                
                this.properties = {
                  ...this.properties,
                  style: {
                    fillColor: style.fillColor,
                    strokeColor: style.strokeColor,
                    strokeWeight: style.strokeWeight,
                    fillOpacity: style.fillOpacity,
                    strokeOpacity: style.strokeOpacity
                  }
                }

                if (onEdit) onEdit(this.properties)
              }
              this.modalReactRoot?.render(null)
              this.deselectShape()
            }
          })
        )
      })

      // Create delete button
      const deleteButton = document.createElement('button')
      deleteButton.className = 'delete-button'
      Object.assign(deleteButton.style, {
        backgroundColor: '#EF4444',
        color: 'white',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: 'none',
        fontSize: '18px',
        fontWeight: 'bold'
      })
      deleteButton.innerHTML = '×'

      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation()
        if (this.shape) {
          this.shape.setMap(null)
        }
        onDelete()
      })

      controls.appendChild(editButton)
      controls.appendChild(deleteButton)

      return controls
    }

    private selectShape() {
      if (!this.isSelected && this.shape) {
        // Deselect previously selected shape
        if (selectedShape && selectedShape !== this) {
          (selectedShape as any).deselectShape()
        }
        
        selectedShape = this
        this.isSelected = true
        
        // Make shape editable
        if ('setEditable' in this.shape) {
          this.shape.setEditable(true)
        }

        // Show controls
        if (this.controlsDiv) {
          this.controlsDiv.style.display = 'flex'
        }

        // Highlight shape
        this.shape.setOptions({
          strokeWeight: (this.properties.style.strokeWeight || 2) + 1,
          zIndex: 1
        })

        // Update controls position
        this.draw()
      }
    }

    private deselectShape() {
      if (this.isSelected && this.shape) {
        this.isSelected = false
        selectedShape = null

        // Make shape non-editable
        if ('setEditable' in this.shape) {
          this.shape.setEditable(false)
        }

        // Hide controls
        if (this.controlsDiv) {
          this.controlsDiv.style.display = 'none'
        }

        // Restore shape appearance
        this.shape.setOptions({
          strokeWeight: this.properties.style.strokeWeight || 2,
          zIndex: 0
        })
      }
    }

    onAdd() {
      // Create controls
      this.controlsDiv = this.createControls()
      const panes = this.getPanes()
      panes?.floatPane.appendChild(this.controlsDiv)

      // Create shape
      switch (this.properties.shapeType) {
        case 'rect': {
          const width = this.properties.shapeWidth || 100
          const height = this.properties.shapeHeight || 100
          const center = this.position

          const bounds = new google.maps.LatLngBounds(
            google.maps.geometry.spherical.computeOffset(
              google.maps.geometry.spherical.computeOffset(center, -height/2, 0),
              -width/2, 90
            ),
            google.maps.geometry.spherical.computeOffset(
              google.maps.geometry.spherical.computeOffset(center, height/2, 0),
              width/2, 90
            )
          )

          this.shape = new google.maps.Rectangle({
            bounds,
            map: this.getMap() as google.maps.Map,
            fillColor: this.properties.style.fillColor,
            fillOpacity: this.properties.style.fillOpacity,
            strokeColor: this.properties.style.strokeColor,
            strokeWeight: this.properties.style.strokeWeight,
            strokeOpacity: this.properties.style.strokeOpacity,
            draggable: true,
            editable: false,
            zIndex: 0
          })
          break
        }
        case 'circle': {
          this.shape = new google.maps.Circle({
            center: this.position,
            radius: this.properties.radius || 50,
            map: this.getMap() as google.maps.Map,
            fillColor: this.properties.style.fillColor,
            fillOpacity: this.properties.style.fillOpacity,
            strokeColor: this.properties.style.strokeColor,
            strokeWeight: this.properties.style.strokeWeight,
            strokeOpacity: this.properties.style.strokeOpacity,
            draggable: true,
            editable: false,
            zIndex: 0
          })
          break
        }
        case 'polygon': {
          this.shape = new google.maps.Polygon({
            paths: this.properties.points || [
              this.position,
              google.maps.geometry.spherical.computeOffset(this.position, 100, 120),
              google.maps.geometry.spherical.computeOffset(this.position, 100, 240)
            ],
            map: this.getMap() as google.maps.Map,
            fillColor: this.properties.style.fillColor,
            fillOpacity: this.properties.style.fillOpacity,
            strokeColor: this.properties.style.strokeColor,
            strokeWeight: this.properties.style.strokeWeight,
            strokeOpacity: this.properties.style.strokeOpacity,
            draggable: true,
            editable: false,
            zIndex: 0
          })
          break
        }
      }

      if (this.shape) {
        // Add click handler to select/deselect
        google.maps.event.addListener(this.shape, 'click', (e: google.maps.MapMouseEvent) => {
          if (e) {
            e.stop()
            e.domEvent?.stopPropagation()
          }
          this.selectShape()
        })

        // Add change handlers
        if ('bounds_changed' in this.shape) {
          google.maps.event.addListener(this.shape, 'bounds_changed', () => {
            if (this.shape && 'getBounds' in this.shape) {
              const bounds = this.shape.getBounds()
              if (bounds) {
                const center = bounds.getCenter()
                this.position = center
                this.draw()
              }
            }
          })
        }
        if ('center_changed' in this.shape) {
          google.maps.event.addListener(this.shape, 'center_changed', () => {
            if (this.shape && 'getCenter' in this.shape) {
              const center = this.shape.getCenter()
              if (center) {
                this.position = center
                this.draw()
              }
            }
          })
        }
      }

      // Handle map clicks to deselect
      const map = this.getMap()
      if (map) {
        google.maps.event.addListener(map, 'click', () => {
          this.deselectShape()
        })
      }

      const img = document.createElement('img')
      img.src = this.url
      img.style.width = '100%'
      img.style.height = 'auto'
      img.style.display = 'block'
      img.draggable = false

      // Update position after image loads
      img.onload = () => {
        this.aspectRatio = img.naturalWidth / img.naturalHeight
        if (this.imageWrapper) {
          this.imageWrapper.style.height = 'auto'
        }
        // Force a redraw after image loads
        this.draw()
      }

      // Add resize observer to handle content changes
      const resizeObserver = new ResizeObserver(() => {
        this.draw()
      })
      
      if (this.contentDiv) {
        resizeObserver.observe(this.contentDiv)
      }

      this.cleanupFunctions.push(() => {
        resizeObserver.disconnect()
      })
    }

    draw() {
      if (!this.div || !this.contentDiv) return
      const overlayProjection = this.getProjection()
      const point = overlayProjection.fromLatLngToDivPixel(this.position)
      if (point) {
        // Use the content div's dimensions instead of the container div
        const width = this.contentDiv.offsetWidth
        const height = this.contentDiv.offsetHeight
        this.div.style.left = `${point.x - width / 2}px`
        this.div.style.top = `${point.y - height / 2}px`
      }
    }

    onRemove() {
      this.cleanupFunctions.forEach(cleanup => cleanup())
      this.cleanupFunctions = []
      
      if (this.shape) {
        this.shape.setMap(null)
        this.shape = null
      }
      
      if (this.controlsDiv) {
        this.controlsDiv.parentNode?.removeChild(this.controlsDiv)
        this.controlsDiv = null
      }
      
      if (this.modalRoot) {
        this.modalReactRoot?.unmount()
        this.modalRoot.parentNode?.removeChild(this.modalRoot)
        this.modalRoot = null
        this.modalReactRoot = null
      }

      // Clear selected shape reference if this shape was selected
      if (selectedShape === this) {
        selectedShape = null
      }
    }

    getPosition() {
      return this.position
    }

    private handleDragStart = (e: MouseEvent) => {
      e.stopPropagation()
      this.isDragging = true
      this.startPos = { x: e.clientX, y: e.clientY }
      console.log('[ShapeOverlay] Drag start:', {
        startPos: this.startPos,
        currentPosition: this.position.toJSON(),
        shapeType: this.properties.shapeType
      })
      document.body.style.cursor = 'move'
    }

    private handleDragMove = (e: MouseEvent) => {
      if (!this.isDragging || !this.shape) return
      e.preventDefault()
      const dx = e.clientX - this.startPos.x
      const dy = e.clientY - this.startPos.y
      const proj = this.getProjection()
      const point = proj.fromLatLngToDivPixel(this.position)
      
      console.log('[ShapeOverlay] Drag move:', {
        dx,
        dy,
        currentPoint: point?.toJSON(),
        currentPosition: this.position.toJSON()
      })
      
      if (point) {
        const newPoint = new google.maps.Point(point.x + dx, point.y + dy)
        const newPosition = proj.fromDivPixelToLatLng(newPoint)
        if (newPosition) {
          console.log('[ShapeOverlay] New position calculated:', {
            newPosition: newPosition.toJSON(),
            shapeType: this.properties.shapeType
          })
          
          this.position = newPosition
          
          // Update the underlying shape based on its type
          if ('setCenter' in this.shape) {
            console.log('[ShapeOverlay] Updating circle center')
            this.shape.setCenter(newPosition)
          } else if ('setBounds' in this.shape) {
            console.log('[ShapeOverlay] Updating rectangle bounds')
            const bounds = this.shape.getBounds()
            if (bounds) {
              const ne = bounds.getNorthEast()
              const sw = bounds.getSouthWest()
              const width = google.maps.geometry.spherical.computeDistanceBetween(ne, new google.maps.LatLng(ne.lat(), sw.lng()))
              const height = google.maps.geometry.spherical.computeDistanceBetween(ne, new google.maps.LatLng(sw.lat(), ne.lng()))
              
              console.log('[ShapeOverlay] Rectangle dimensions:', {
                width,
                height,
                currentBounds: bounds.toJSON()
              })
              
              const newBounds = new google.maps.LatLngBounds(
                google.maps.geometry.spherical.computeOffset(newPosition, -height/2, 180),
                google.maps.geometry.spherical.computeOffset(newPosition, height/2, 0)
              )
              this.shape.setBounds(newBounds)
              console.log('[ShapeOverlay] New bounds set:', newBounds.toJSON())
            }
          } else if ('setPath' in this.shape) {
            console.log('[ShapeOverlay] Updating polygon path')
            const path = this.shape.getPath()
            const points = path.getArray()
            const center = this.position
            const newPoints = points.map(point => {
              const offset = google.maps.geometry.spherical.computeDistanceBetween(center, point)
              const heading = google.maps.geometry.spherical.computeHeading(center, point)
              return google.maps.geometry.spherical.computeOffset(newPosition, offset, heading)
            })
            this.shape.setPath(newPoints)
            console.log('[ShapeOverlay] New polygon points:', newPoints.map(p => p.toJSON()))
          }
          
          this.draw()
          this.startPos = { x: e.clientX, y: e.clientY }
        }
      }
    }

    private handleDragEnd = () => {
      if (this.isDragging) {
        console.log('[ShapeOverlay] Drag end:', {
          finalPosition: this.position.toJSON(),
          shapeType: this.properties.shapeType
        })
        this.isDragging = false
        document.body.style.cursor = 'default'
      }
    }
  }

  const shapeOverlay = new ShapeOverlay(
    new google.maps.LatLng(overlay.position.lat, overlay.position.lng),
    overlay.properties as ShapeProperties
  )

  shapeOverlay.setMap(map)

  console.log('Saving position:', {
    original: overlay.position,
    serialized: {
      lat: typeof overlay.position.lat === 'function' ? overlay.position.lat() : overlay.position.lat,
      lng: typeof overlay.position.lng === 'function' ? overlay.position.lng() : overlay.position.lng,
    }
  })

  return shapeOverlay
}