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
  config: BusinessOverlayConfig,
  map: google.maps.Map,
  onDelete: () => void,
  createDeleteButton: (container: HTMLElement | null, onDelete: () => void) => (() => void) | null,
  createEditButton: (container: HTMLElement | null, onEdit: () => void) => (() => void) | null,
  onEdit?: (style: any) => void,
  createResizeHandle: (container: HTMLElement | null, config: ResizeConfig) => (() => void) | null
) {
  class BusinessLogoOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null
    container: HTMLDivElement | null = null
    private imageWrapper: HTMLDivElement | null = null
    private modalRoot: HTMLDivElement | null = null
    private modalReactRoot: ReturnType<typeof createRoot> | null = null
    private position: google.maps.LatLng
    private logo: string
    private businessName: string
    private width: number
    private aspectRatio: number = 1
    private isDragging = false
    private cleanupFunctions: Array<() => void> = []
    private style: ContainerStyle

    constructor(config: BusinessOverlayConfig) {
      super()
      this.position = config.position
      this.logo = config.logo
      this.businessName = config.businessName
      this.width = config.width
      this.style = config.style
    }

    private getRgbaColor(hex: string, opacity: number) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

    updateStyle(style: ContainerStyle) {
      this.style = style
      if (this.container) {
        this.container.style.backgroundColor = this.getRgbaColor(style.backgroundColor, style.backgroundOpacity)
        this.container.style.border = `${style.borderWidth}px solid ${this.getRgbaColor(style.borderColor, style.borderOpacity)}`
        this.container.style.padding = `${style.padding}px`
      }
    }

    onAdd() {
      const div = document.createElement('div')
      div.style.position = 'absolute'
      div.style.cursor = 'move'
      div.style.userSelect = 'none'

      // Create container with styles
      const container = document.createElement('div')
      container.style.backgroundColor = this.getRgbaColor(this.style.backgroundColor, this.style.backgroundOpacity)
      container.style.border = `${this.style.borderWidth}px solid ${this.getRgbaColor(this.style.borderColor, this.style.borderOpacity)}`
      container.style.padding = `${this.style.padding}px`
      container.style.borderRadius = '4px'
      container.style.display = 'inline-block'
      container.style.position = 'relative'
      container.style.minWidth = '50px'
      container.style.maxWidth = '400px'
      container.style.width = `${this.width}px`
      container.style.boxSizing = 'border-box'

      if (this.logo) {
        // Create image wrapper for maintaining aspect ratio
        const imageWrapper = document.createElement('div')
        imageWrapper.style.position = 'relative'
        imageWrapper.style.width = '100%'
        imageWrapper.style.overflow = 'hidden'
        this.imageWrapper = imageWrapper

        const img = document.createElement('img')
        img.src = this.logo
        img.style.width = '100%'
        img.style.height = 'auto'
        img.style.display = 'block'
        img.draggable = false

        // Update aspect ratio when image loads
        img.onload = () => {
          this.aspectRatio = img.naturalWidth / img.naturalHeight
          if (this.imageWrapper) {
            this.imageWrapper.style.height = 'auto'
          }
        }

        imageWrapper.appendChild(img)
        container.appendChild(imageWrapper)
      } else {
        const nameDiv = document.createElement('div')
        nameDiv.textContent = this.businessName
        nameDiv.style.textAlign = 'center'
        nameDiv.style.fontSize = '14px'
        nameDiv.style.color = '#4B5563'
        nameDiv.style.padding = '8px'
        nameDiv.style.minWidth = '60px'
        container.appendChild(nameDiv)
      }

      // Add delete button
      const deleteCleanup = createDeleteButton(div, onDelete)
      if (deleteCleanup) {
        this.cleanupFunctions.push(deleteCleanup)
      }

      // Add edit button if logo exists
      if (this.logo) {
        const editCleanup = createEditButton(div, () => {
          if (!this.modalRoot) {
            this.modalRoot = document.createElement('div')
            document.body.appendChild(this.modalRoot)
            this.modalReactRoot = createRoot(this.modalRoot)
          }

          this.modalReactRoot?.render(
            createElement(ImageEditModal, {
              isOpen: true,
              onClose: () => this.modalReactRoot?.render(null),
              initialStyle: this.style,
              imageUrl: this.logo,
              onSave: (style) => {
                this.updateStyle(style)
                if (onEdit) {
                  onEdit({
                    ...style,
                    width: this.width
                  })
                }
                this.modalReactRoot?.render(null)
              }
            })
          )
        })
        if (editCleanup) {
          this.cleanupFunctions.push(editCleanup)
        }

        // Add resize handle
        const resizeCleanup = createResizeHandle(container, {
          minWidth: 50,
          maxWidth: 400,
          maintainAspectRatio: false,
          onResize: (width: number) => {
            this.width = width
            container.style.width = `${width}px`
            this.draw()
            
            if (onEdit) {
              onEdit({
                ...this.style,
                width: width
              })
            }
          }
        })
        if (resizeCleanup) {
          this.cleanupFunctions.push(resizeCleanup)
        }
      }

      // Handle dragging
      const handleDragStart = (e: MouseEvent) => {
        e.stopPropagation()
        this.isDragging = true
        document.body.style.cursor = 'move'
      }

      const handleDragMove = (e: MouseEvent) => {
        if (!this.isDragging) return
        e.preventDefault()
        const proj = this.getProjection()
        const point = proj.fromLatLngToDivPixel(this.position)
        if (point) {
          point.x += e.movementX
          point.y += e.movementY
          this.position = proj.fromDivPixelToLatLng(point)
          this.draw()
        }
      }

      const handleDragEnd = () => {
        if (this.isDragging) {
          this.isDragging = false
          document.body.style.cursor = 'default'
        }
      }

      div.addEventListener('mousedown', handleDragStart)
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)

      this.cleanupFunctions.push(() => {
        div.removeEventListener('mousedown', handleDragStart)
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
      })

      div.appendChild(container)
      this.container = container
      this.div = div

      const panes = this.getPanes()
      panes?.overlayMouseTarget.appendChild(div)
    }

    draw() {
      if (!this.div) return
      const overlayProjection = this.getProjection()
      const point = overlayProjection.fromLatLngToDivPixel(this.position)
      if (point) {
        const width = this.div.offsetWidth
        const height = this.div.offsetHeight
        this.div.style.left = `${point.x - width / 2}px`
        this.div.style.top = `${point.y - height / 2}px`
      }
    }

    onRemove() {
      this.cleanupFunctions.forEach(cleanup => cleanup())
      this.cleanupFunctions = []
      if (this.div) {
        this.div.parentNode?.removeChild(this.div)
        this.div = null
        this.container = null
        this.imageWrapper = null
      }
      if (this.modalRoot) {
        this.modalReactRoot?.unmount()
        this.modalRoot.parentNode?.removeChild(this.modalRoot)
        this.modalRoot = null
        this.modalReactRoot = null
      }
    }

    getPosition() {
      return this.position
    }
  }

  const businessOverlay = new BusinessLogoOverlay(config)
  businessOverlay.setMap(map)
  return businessOverlay
}