import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { ShapeEditModal } from '@/components/modals/ShapeEditModal'
import type { MapOverlay } from '@/lib/types'

// Keep track of currently selected shape
let selectedShape: google.maps.OverlayView | null = null

export function createShapeOverlay(
  overlay: MapOverlay,
  map: google.maps.Map,
  onDelete: () => void,
  createDeleteButton: (container: HTMLElement | null, onDelete: () => void) => (() => void) | null,
  createEditButton: (container: HTMLElement | null, onEdit: () => void) => (() => void) | null,
  onEdit?: (style: any) => void
) {
  class ShapeOverlay extends google.maps.OverlayView {
    private shape: google.maps.Rectangle | google.maps.Circle | google.maps.Polygon | null = null
    private controlsDiv: HTMLDivElement | null = null
    private modalRoot: HTMLDivElement | null = null
    private modalReactRoot: ReturnType<typeof createRoot> | null = null
    private position: google.maps.LatLng
    private properties: any
    private cleanupFunctions: Array<() => void> = []
    private isSelected = false

    constructor(position: google.maps.LatLng, properties: any) {
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
              fillColor: this.properties.fill,
              fillOpacity: this.properties.shapeOpacity,
              strokeColor: this.properties.stroke,
              strokeOpacity: 1,
              strokeWeight: this.properties.strokeWidth
            },
            onSave: (style) => {
              if (this.shape) {
                this.shape.setOptions({
                  fillColor: style.fillColor,
                  fillOpacity: style.fillOpacity,
                  strokeColor: style.strokeColor,
                  strokeWeight: style.strokeWeight
                })
                
                this.properties = {
                  ...this.properties,
                  fill: style.fillColor,
                  stroke: style.strokeColor,
                  strokeWidth: style.strokeWeight,
                  shapeOpacity: style.fillOpacity
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
          strokeWeight: (this.properties.strokeWidth || 2) + 1,
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
          strokeWeight: this.properties.strokeWidth || 2,
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
            map: this.getMap(),
            fillColor: this.properties.fill,
            fillOpacity: this.properties.shapeOpacity,
            strokeColor: this.properties.stroke,
            strokeWeight: this.properties.strokeWidth,
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
            map: this.getMap(),
            fillColor: this.properties.fill,
            fillOpacity: this.properties.shapeOpacity,
            strokeColor: this.properties.stroke,
            strokeWeight: this.properties.strokeWidth,
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
            map: this.getMap(),
            fillColor: this.properties.fill,
            fillOpacity: this.properties.shapeOpacity,
            strokeColor: this.properties.stroke,
            strokeWeight: this.properties.strokeWidth,
            draggable: true,
            editable: false,
            zIndex: 0
          })
          break
        }
      }

      if (this.shape) {
        // Add click handler to select/deselect
        google.maps.event.addListener(this.shape, 'click', (e) => {
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
      google.maps.event.addListener(this.getMap(), 'click', () => {
        this.deselectShape()
      })
    }

    draw() {
      if (!this.controlsDiv || !this.shape) return

      let position: google.maps.LatLng | null = null

      if ('getCenter' in this.shape) {
        position = this.shape.getCenter()
      } else if ('getBounds' in this.shape) {
        position = this.shape.getBounds()?.getCenter() || null
      } else if ('getPath' in this.shape) {
        const bounds = new google.maps.LatLngBounds()
        this.shape.getPath().forEach((point: google.maps.LatLng) => bounds.extend(point))
        position = bounds.getCenter()
      }

      if (position) {
        const projection = this.getProjection()
        const point = projection.fromLatLngToDivPixel(position)
        if (point) {
          this.controlsDiv.style.left = `${point.x - this.controlsDiv.offsetWidth / 2}px`
          this.controlsDiv.style.top = `${point.y - this.controlsDiv.offsetHeight - 10}px`
        }
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
  }

  const shapeOverlay = new ShapeOverlay(
    new google.maps.LatLng(overlay.position.lat, overlay.position.lng),
    overlay.properties
  )

  shapeOverlay.setMap(map)
  return shapeOverlay
}