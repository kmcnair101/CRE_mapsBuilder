import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { TextEditModal } from '@/components/modals/TextEditModal'
import { ImageEditModal } from '@/components/modals/ImageEditModal'
import type { MapOverlay, ContainerStyle } from '@/lib/types'

interface ImageOverlayConfig {
  position: google.maps.LatLng
  url: string
  width: number
  style: ContainerStyle
}

export function createCustomImageOverlay(
  config: ImageOverlayConfig,
  map: google.maps.Map,
  onDelete: () => void,
  createDeleteButton: (container: HTMLElement | null, onDelete: () => void) => (() => void) | null,
  createEditButton: (container: HTMLElement | null, onEdit: () => void) => (() => void) | null,
  onEdit?: (style: any) => void,
  createResizeHandle: (container: HTMLElement | null, config: ResizeConfig) => (() => void) | null
) {
  class CustomImageOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null
    container: HTMLDivElement | null = null
    private imageWrapper: HTMLDivElement | null = null
    private modalRoot: HTMLDivElement | null = null
    private modalReactRoot: ReturnType<typeof createRoot> | null = null
    private position: google.maps.LatLng
    private url: string
    private width: number
    private aspectRatio: number = 1
    private isDragging = false
    private cleanupFunctions: Array<() => void> = []
    private style: ContainerStyle

    constructor(config: ImageOverlayConfig) {
      super()
      this.position = config.position
      this.url = config.url
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

      // Create image wrapper for maintaining aspect ratio
      const imageWrapper = document.createElement('div')
      imageWrapper.style.position = 'relative'
      imageWrapper.style.width = '100%'
      imageWrapper.style.overflow = 'hidden'
      this.imageWrapper = imageWrapper

      const img = document.createElement('img')
      img.src = this.url
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

      // Add delete button
      const deleteCleanup = createDeleteButton(div, onDelete)
      if (deleteCleanup) {
        this.cleanupFunctions.push(deleteCleanup)
      }

      // Add edit button
      if (onEdit) {
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
              imageUrl: this.url,
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

  const imageOverlay = new CustomImageOverlay(config)
  imageOverlay.setMap(map)
  return imageOverlay
}

export function createCustomTextOverlay(
  overlay: MapOverlay,
  map: google.maps.Map,
  onDelete: () => void,
  createDeleteButton: (container: HTMLElement | null, onDelete: () => void) => (() => void) | null,
  createEditButton: (container: HTMLElement | null, onEdit: () => void) => (() => void) | null,
  onEdit?: (text: string, style: any) => void,
  createResizeHandle: (container: HTMLElement | null, config: ResizeConfig) => (() => void) | null
) {
  class CustomTextOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null
    private contentDiv: HTMLDivElement | null = null
    private modalRoot: HTMLDivElement | null = null
    private modalReactRoot: ReturnType<typeof createRoot> | null = null
    private position: google.maps.LatLng
    private content: string
    private style: any
    private isDragging = false
    private isResizing = false
    private startPos = { x: 0, y: 0 }
    private startWidth = 0
    private cleanupFunctions: Array<() => void> = []
    private baseWidth = 80
    private currentWidth = 80
    private baseFontSize = 14

    constructor(position: google.maps.LatLng, content: string, style: any) {
      super()
      this.position = position
      this.content = content
      this.style = style
      this.baseWidth = style.width || 80
      this.currentWidth = this.baseWidth
      this.baseFontSize = style.fontSize || 14
    }

    private getRgbaColor(hex: string, opacity: number) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

    private calculateScaledValues(width: number) {
      const scale = width / this.baseWidth
      return {
        fontSize: Math.round(this.baseFontSize * scale),
        padding: Math.round(this.style.padding * scale),
        borderWidth: Math.round(this.style.borderWidth * scale)
      }
    }

    updateContent(content: string, style: any) {
      this.content = content
      this.style = style
      this.baseWidth = style.width || this.baseWidth
      this.currentWidth = this.baseWidth
      this.baseFontSize = style.fontSize || this.baseFontSize

      if (this.contentDiv) {
        const scaled = this.calculateScaledValues(this.currentWidth)
        
        this.contentDiv.innerHTML = this.content
        this.contentDiv.style.color = this.style.color || '#000000'
        this.contentDiv.style.fontSize = `${scaled.fontSize}px`
        this.contentDiv.style.fontFamily = this.style.fontFamily || 'Arial'
        this.contentDiv.style.backgroundColor = this.getRgbaColor(this.style.backgroundColor || '#FFFFFF', this.style.backgroundOpacity || 1)
        this.contentDiv.style.border = `${scaled.borderWidth}px solid ${this.getRgbaColor(this.style.borderColor || '#000000', this.style.borderOpacity || 1)}`
        this.contentDiv.style.padding = `${scaled.padding}px`
        this.contentDiv.style.borderRadius = '4px'
        this.contentDiv.style.textAlign = 'center'
        this.contentDiv.style.minWidth = 'min-content'
        this.contentDiv.style.width = `${this.currentWidth}px`
        this.contentDiv.style.maxWidth = '400px'
        this.contentDiv.style.whiteSpace = 'pre'
        this.contentDiv.style.display = 'inline-block'
        this.contentDiv.style.boxSizing = 'border-box'
        this.contentDiv.style.lineHeight = '1.2'
        this.contentDiv.style.verticalAlign = 'middle'
      }

      this.draw()
    }

    onAdd() {
      const div = document.createElement('div')
      div.style.position = 'absolute'
      div.style.cursor = 'move'
      div.style.userSelect = 'none'
      div.style.display = 'flex'
      div.style.justifyContent = 'center'
      div.style.alignItems = 'center'
      div.style.width = 'auto'
      div.style.height = 'auto'

      const contentDiv = document.createElement('div')
      contentDiv.className = 'text-content'
      contentDiv.innerHTML = this.content

      const scaled = this.calculateScaledValues(this.currentWidth)

      contentDiv.style.color = this.style.color || '#000000'
      contentDiv.style.fontSize = `${scaled.fontSize}px`
      contentDiv.style.fontFamily = this.style.fontFamily || 'Arial'
      contentDiv.style.backgroundColor = this.getRgbaColor(this.style.backgroundColor || '#FFFFFF', this.style.backgroundOpacity || 1)
      contentDiv.style.border = `${scaled.borderWidth}px solid ${this.getRgbaColor(this.style.borderColor || '#000000', this.style.borderOpacity || 1)}`
      contentDiv.style.padding = `${scaled.padding}px`
      contentDiv.style.borderRadius = '4px'
      contentDiv.style.textAlign = 'center'
      contentDiv.style.minWidth = 'min-content'
      contentDiv.style.width = `${this.currentWidth}px`
      contentDiv.style.maxWidth = '400px'
      contentDiv.style.whiteSpace = 'pre'
      contentDiv.style.display = 'inline-block'
      contentDiv.style.position = 'relative'
      contentDiv.style.boxSizing = 'border-box'
      contentDiv.style.lineHeight = '1.2'
      contentDiv.style.verticalAlign = 'middle'

      div.appendChild(contentDiv)
      this.contentDiv = contentDiv

      // Add delete button
      const deleteCleanup = createDeleteButton(div, onDelete)
      if (deleteCleanup) {
        this.cleanupFunctions.push(deleteCleanup)
      }

      // Add edit button if onEdit is provided
      if (onEdit) {
        const editCleanup = createEditButton(div, () => {
          if (!this.modalRoot) {
            this.modalRoot = document.createElement('div')
            document.body.appendChild(this.modalRoot)
            this.modalReactRoot = createRoot(this.modalRoot)
          }

          this.modalReactRoot?.render(
            createElement(TextEditModal, {
              isOpen: true,
              onClose: () => this.modalReactRoot?.render(null),
              initialText: this.content,
              initialStyle: {
                ...this.style,
                fontSize: this.baseFontSize,
                width: this.baseWidth
              },
              onSave: (text, style) => {
                this.updateContent(text, style)
                onEdit(text, style)
                this.modalReactRoot?.render(null)
                
                // Re-add resize handle after editing
                if (this.contentDiv) {
                  // Remove any existing resize handle first
                  const existingHandle = this.contentDiv.querySelector('.resize-handle');
                  if (existingHandle) {
                    existingHandle.remove();
                  }
                  
                  // Add a new resize handle
                  const resizeCleanup = createResizeHandle(this.contentDiv, {
                    minWidth: 30,
                    maxWidth: 400,
                    onResize: (width: number) => {
                      this.currentWidth = width
                      const scaled = this.calculateScaledValues(width)
                      
                      this.contentDiv!.style.width = `${width}px`
                      this.contentDiv!.style.fontSize = `${scaled.fontSize}px`
                      this.contentDiv!.style.padding = `${scaled.padding}px`
                      this.contentDiv!.style.border = `${scaled.borderWidth}px solid ${this.getRgbaColor(this.style.borderColor || '#000000', this.style.borderOpacity || 1)}`
                      
                      this.draw()
                      
                      if (onEdit) {
                        onEdit(this.content, {
                          ...this.style,
                          fontSize: this.baseFontSize,
                          width: this.baseWidth
                        })
                      }
                    }
                  });
                  
                  if (resizeCleanup) {
                    this.cleanupFunctions.push(resizeCleanup);
                  }
                }
              }
            })
          )
        })
        if (editCleanup) {
          this.cleanupFunctions.push(editCleanup)
        }
      }

      // Add resize handle with proper configuration
      const resizeCleanup = createResizeHandle(contentDiv, {
        minWidth: 30,
        maxWidth: 400,
        onResize: (width: number) => {
          this.currentWidth = width
          const scaled = this.calculateScaledValues(width)
          
          contentDiv.style.width = `${width}px`
          contentDiv.style.fontSize = `${scaled.fontSize}px`
          contentDiv.style.padding = `${scaled.padding}px`
          contentDiv.style.border = `${scaled.borderWidth}px solid ${this.getRgbaColor(this.style.borderColor || '#000000', this.style.borderOpacity || 1)}`
          
          this.draw()
          
          if (onEdit) {
            onEdit(this.content, {
              ...this.style,
              fontSize: this.baseFontSize,
              width: this.baseWidth
            })
          }
        }
      })
      if (resizeCleanup) {
        this.cleanupFunctions.push(resizeCleanup)
      }

      // Handle dragging
      const handleDragStart = (e: MouseEvent) => {
        if (this.isResizing) return
        e.stopPropagation()
        this.isDragging = true
        this.startPos = { x: e.clientX, y: e.clientY }
        document.body.style.cursor = 'move'
      }

      const handleDragMove = (e: MouseEvent) => {
        if (!this.isDragging || this.isResizing) return
        e.preventDefault()
        const dx = e.clientX - this.startPos.x
        const dy = e.clientY - this.startPos.y
        const proj = this.getProjection()
        const point = proj.fromLatLngToDivPixel(this.position)
        const newPoint = new google.maps.Point(point.x + dx, point.y + dy)
        this.position = proj.fromDivPixelToLatLng(newPoint)
        this.draw()
        this.startPos = { x: e.clientX, y: e.clientY }
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
        this.contentDiv = null
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

  const style = {
    color: overlay.properties.color || '#000000',
    fontSize: overlay.properties.fontSize || 14,
    fontFamily: overlay.properties.fontFamily || 'Arial',
    backgroundColor: overlay.properties.backgroundColor || '#FFFFFF',
    borderColor: overlay.properties.borderColor || '#000000',
    borderWidth: overlay.properties.borderWidth || 1,
    padding: overlay.properties.padding || 8,
    backgroundOpacity: overlay.properties.backgroundOpacity || 1,
    borderOpacity: overlay.properties.borderOpacity || 1,
    width: overlay.properties.width || 80
  }

  const textOverlay = new CustomTextOverlay(
    new google.maps.LatLng(overlay.position.lat, overlay.position.lng),
    overlay.properties.content || '',
    style
  )

  textOverlay.setMap(map)
  return textOverlay
}