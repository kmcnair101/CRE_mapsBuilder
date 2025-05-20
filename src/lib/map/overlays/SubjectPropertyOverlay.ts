import { loader } from '@/lib/google-maps'
import type { MapData } from '@/lib/types'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { SubjectPropertyModal } from '@/components/modals/SubjectPropertyModal'
import { createEditButton } from '../utils/overlayControls'

export async function createSubjectPropertyOverlay(
  mapData: MapData,
  onUpdate: (updates: Partial<MapData['subject_property']>) => void
): Promise<google.maps.OverlayView> {
  await loader.load()

  class SubjectPropertyOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null
    private contentDiv: HTMLDivElement | null = null
    private modalRoot: HTMLDivElement | null = null
    private modalReactRoot: ReturnType<typeof createRoot> | null = null
    private position: google.maps.LatLng
    private content: {
      image: string | null
      name: string
      style: {
        color: string
        fontSize: number
        fontFamily: string
        backgroundColor: string
        borderColor: string
        borderWidth: number
        padding: number
        backgroundOpacity: number
        borderOpacity: number
        width: number
      }
    }
    private isDragging = false
    private isResizing = false
    private startPos = { x: 0, y: 0 }
    private startSize = { width: 0 }
    private cleanupFunctions: Array<() => void> = []
    private baseWidth = 80
    private currentWidth = 80
    private baseFontSize = 14

    constructor() {
      super()
      if (!mapData.subject_property) {
        throw new Error('Subject property is required')
      }

      this.position = new google.maps.LatLng(
        mapData.subject_property.lat,
        mapData.subject_property.lng
      )

      this.content = {
        image: mapData.subject_property.image,
        name: mapData.subject_property.name || 'Subject Property',
        style: {
          color: '#000000',
          fontSize: 14,
          fontFamily: 'Arial',
          backgroundColor: '#FFFFFF',
          borderColor: '#000000',
          borderWidth: 1,
          padding: 8,
          backgroundOpacity: 1,
          borderOpacity: 1,
          width: 80,
          ...mapData.subject_property.style
        }
      }

      this.baseWidth = this.content.style.width || 80
      this.currentWidth = this.baseWidth
      this.baseFontSize = this.content.style.fontSize || 14
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
        padding: Math.round(this.content.style.padding * scale),
        borderWidth: Math.round(this.content.style.borderWidth * scale)
      }
    }

    private updateContentStyles(width: number) {
      if (!this.contentDiv) return

      if (!this.content.image) {
        const scaled = this.calculateScaledValues(width)
        this.contentDiv.style.fontSize = `${scaled.fontSize}px`
        this.contentDiv.style.padding = `${scaled.padding}px`
        this.contentDiv.style.border = `${scaled.borderWidth}px solid ${this.getRgbaColor(
          this.content.style.borderColor,
          this.content.style.borderOpacity
        )}`
        this.contentDiv.style.width = `${width}px`
      } else {
        this.contentDiv.style.width = `${width}px`
      }
    }

    onAdd() {
      console.log('[SubjectPropertyOverlay] onAdd', { mapData: mapData, position: this.position });

      const div = document.createElement('div')
      div.style.position = 'absolute'
      div.style.cursor = 'move'
      div.style.userSelect = 'none'
      div.style.display = 'flex'
      div.style.justifyContent = 'center'
      div.style.alignItems = 'center'

      const contentDiv = document.createElement('div')
      contentDiv.style.position = 'relative'
      contentDiv.style.minWidth = 'min-content'
      contentDiv.style.maxWidth = '400px'
      contentDiv.style.backgroundColor = this.getRgbaColor(
        this.content.style.backgroundColor,
        this.content.style.backgroundOpacity
      )
      contentDiv.style.border = `${this.content.style.borderWidth}px solid ${this.getRgbaColor(
        this.content.style.borderColor,
        this.content.style.borderOpacity
      )}`
      contentDiv.style.padding = `${this.content.style.padding}px`
      contentDiv.style.borderRadius = '4px'
      contentDiv.style.boxSizing = 'border-box'

      if (this.content.image) {
        const img = document.createElement('img')
        img.src = this.content.image
        img.style.width = '100%'
        img.style.height = 'auto'
        img.style.objectFit = 'contain'
        img.style.display = 'block'
        img.draggable = false
        contentDiv.appendChild(img)
        contentDiv.style.width = `${this.currentWidth}px`

        // Force redraw after image loads
        img.onload = () => {
          this.draw();
        }
      } else {
        contentDiv.innerHTML = this.content.name
        contentDiv.style.color = this.content.style.color
        contentDiv.style.fontSize = `${this.content.style.fontSize}px`
        contentDiv.style.fontFamily = this.content.style.fontFamily
        contentDiv.style.textAlign = 'center'
        contentDiv.style.whiteSpace = 'pre'
        contentDiv.style.display = 'inline-block'
        contentDiv.style.width = `${this.currentWidth}px`
      }

      // Add edit button if no image
      if (!this.content.image) {
        const editCleanup = createEditButton(div, () => {
          if (!this.modalRoot) {
            this.modalRoot = document.createElement('div')
            document.body.appendChild(this.modalRoot)
            this.modalReactRoot = createRoot(this.modalRoot)
          }

          this.modalReactRoot?.render(
            createElement(SubjectPropertyModal, {
              isOpen: true,
              onClose: () => {
                this.modalReactRoot?.render(null)
                if (this.modalRoot && this.modalRoot.parentNode) {
                  this.modalRoot.parentNode.removeChild(this.modalRoot)
                }
                this.modalRoot = null
                this.modalReactRoot = null
              },
              initialName: this.content.name,
              initialImage: this.content.image,
              initialStyle: {
                color: this.content.style.color,
                fontSize: this.baseFontSize,
                fontFamily: this.content.style.fontFamily,
                backgroundColor: this.content.style.backgroundColor,
                borderColor: this.content.style.borderColor,
                borderWidth: this.content.style.borderWidth,
                padding: this.content.style.padding,
                backgroundOpacity: this.content.style.backgroundOpacity,
                borderOpacity: this.content.style.borderOpacity
              },
              onSave: (data) => {
                this.content.name = data.name
                this.content.image = data.image
                if (data.style) {
                  this.content.style = {
                    ...this.content.style,
                    ...data.style,
                    width: this.baseWidth
                  }
                  this.baseWidth = this.content.style.width
                  this.currentWidth = this.baseWidth
                  this.baseFontSize = data.style.fontSize
                }
                this.updateContentStyles(this.currentWidth)
                this.draw()
                onUpdate({
                  ...mapData.subject_property,
                  name: data.name,
                  image: data.image,
                  style: this.content.style
                })
                this.modalReactRoot?.render(null)
                if (this.modalRoot && this.modalRoot.parentNode) {
                  this.modalRoot.parentNode.removeChild(this.modalRoot)
                }
                this.modalRoot = null
                this.modalReactRoot = null
              }
            })
          )
        })
        if (editCleanup) {
          this.cleanupFunctions.push(editCleanup)
        }
      }

      // Add resize handle
      const handle = document.createElement('div')
      handle.style.position = 'absolute'
      handle.style.right = '-8px'
      handle.style.bottom = '-8px'
      handle.style.width = '16px'
      handle.style.height = '16px'
      handle.style.backgroundColor = 'white'
      handle.style.border = '1px solid #D1D5DB'
      handle.style.borderRadius = '4px'
      handle.style.cursor = 'se-resize'
      handle.style.display = 'none'
      handle.style.alignItems = 'center'
      handle.style.justifyContent = 'center'
      handle.style.zIndex = '1000'

      const handleIcon = document.createElement('div')
      handleIcon.style.width = '6px'
      handleIcon.style.height = '6px'
      handleIcon.style.borderRight = '2px solid #D1D5DB'
      handleIcon.style.borderBottom = '2px solid #D1D5DB'
      handle.appendChild(handleIcon)

      // Show/hide resize handle
      const handleMouseEnter = () => {
        if (!this.isResizing) {
          handle.style.display = 'flex'
        }
      }

      const handleMouseLeave = (e: MouseEvent) => {
        const rect = handle.getBoundingClientRect()
        const isOverHandle = e.clientX >= rect.left && e.clientX <= rect.right &&
                           e.clientY >= rect.top && e.clientY <= rect.bottom
        if (!isOverHandle && !this.isResizing) {
          handle.style.display = 'none'
        }
      }

      contentDiv.addEventListener('mouseenter', handleMouseEnter)
      contentDiv.addEventListener('mouseleave', handleMouseLeave)

      // Handle resizing
      const handleResizeStart = (e: MouseEvent) => {
        e.stopPropagation()
        this.isResizing = true
        this.startPos = { x: e.clientX, y: e.clientY }
        this.startSize = { width: contentDiv.offsetWidth }
        document.body.style.cursor = 'se-resize'
      }

      const handleResizeMove = (e: MouseEvent) => {
        if (!this.isResizing) return
        e.preventDefault()
        const dx = e.clientX - this.startPos.x
        const newWidth = Math.max(30, Math.min(400, this.startSize.width + dx)) // Reduced from 80 to 30
        this.currentWidth = newWidth
        this.updateContentStyles(newWidth)
        this.draw()
      }

      const handleResizeEnd = () => {
        if (this.isResizing) {
          this.isResizing = false
          document.body.style.cursor = 'default'

          // Update the style with the new width and scaled values
          const updatedStyle = {
            ...this.content.style,
            width: this.currentWidth
          }

          if (!this.content.image) {
            const scaled = this.calculateScaledValues(this.currentWidth)
            updatedStyle.fontSize = scaled.fontSize
            updatedStyle.padding = scaled.padding
            updatedStyle.borderWidth = scaled.borderWidth
          }

          this.content.style = updatedStyle
          onUpdate({
            ...mapData.subject_property,
            style: updatedStyle
          })
        }
      }

      handle.addEventListener('mousedown', handleResizeStart)
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)

      this.cleanupFunctions.push(() => {
        handle.removeEventListener('mousedown', handleResizeStart)
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
        contentDiv.removeEventListener('mouseenter', handleMouseEnter)
        contentDiv.removeEventListener('mouseleave', handleMouseLeave)
      })

      contentDiv.appendChild(handle)
      div.appendChild(contentDiv)
      this.contentDiv = contentDiv

      // Handle dragging
      const handleDragStart = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.edit-button') || target.closest('.delete-button')) {
          return;
        }
        if (this.isResizing) return;
        e.stopPropagation();
        this.isDragging = true;
        this.startPos = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'move';
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
          onUpdate({
            ...mapData.subject_property,
            lat: this.position.lat(),
            lng: this.position.lng()
          })
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
      if (!this.div) return;
      const overlayProjection = this.getProjection();
      const point = overlayProjection.fromLatLngToDivPixel(this.position);
      if (point) {
        const width = this.div.offsetWidth;
        const height = this.div.offsetHeight;
        this.div.style.left = `${point.x - width / 2}px`;
        this.div.style.top = `${point.y - height / 2}px`;
      }
    }

    onRemove() {
      console.log('[SubjectPropertyOverlay] onRemove', { mapData: mapData });

      this.cleanupFunctions.forEach(cleanup => cleanup())
      this.cleanupFunctions = []
      if (this.div) {
        this.div.parentNode?.removeChild(this.div)
        this.div = null
        this.contentDiv = null
      }
    }

    getPosition() {
      return this.position
    }
  }

  return new SubjectPropertyOverlay()
}