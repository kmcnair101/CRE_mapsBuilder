import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { GroupEditModal } from '@/components/modals/GroupEditModal'
import type { MapOverlay } from '@/lib/types'

const defaultContainerStyle = {
  backgroundColor: '#FFFFFF',
  borderColor: '#000000',
  borderWidth: 1,
  padding: 8,
  backgroundOpacity: 1,
  borderOpacity: 1,
  titleStyle: {
    color: '#000000',
    fontSize: 14,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    textAlign: 'center' as const
  },
  columns: 3
}

export function createGroupOverlay(
  overlay: MapOverlay,
  map: google.maps.Map,
  onDelete: () => void,
  createDeleteButton: (container: HTMLElement | null, onDelete: () => void) => (() => void) | null,
  createEditButton: (container: HTMLElement | null, onEdit: () => void) => (() => void) | null,
  onEdit?: (style: any) => void,
  createResizeHandle: (container: HTMLElement | null, config: ResizeConfig) => (() => void) | null
) {
  class GroupOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null
    private container: HTMLDivElement | null = null
    private modalRoot: HTMLDivElement | null = null
    private modalReactRoot: ReturnType<typeof createRoot> | null = null
    private position: google.maps.LatLng
    private content: {
      title?: string
      items: Array<{
        id: string
        type: 'image' | 'logo'
        url: string
        width: number
        height: number
      }>
      style: typeof defaultContainerStyle
    }
    private width: number
    private isDragging = false
    private cleanupFunctions: Array<() => void> = []

    constructor(
      position: google.maps.LatLng,
      content: {
        title?: string
        items: Array<{
          id: string
          type: 'image' | 'logo'
          url: string
          width: number
          height: number
        }>
        style: typeof defaultContainerStyle
      },
      width: number = 300
    ) {
      super()
      this.position = position
      this.content = content
      this.width = width
    }

    private getRgbaColor(hex: string, opacity: number) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

    updateContent(content: typeof this.content) {
      this.content = content
      if (this.container) {
        // Update container styles
        this.container.style.backgroundColor = this.getRgbaColor(
          content.style.backgroundColor,
          content.style.backgroundOpacity
        )
        this.container.style.border = `${content.style.borderWidth}px solid ${this.getRgbaColor(
          content.style.borderColor,
          content.style.borderOpacity
        )}`
        this.container.style.padding = `${content.style.padding}px`

        // Clear container
        while (this.container.firstChild) {
          this.container.removeChild(this.container.firstChild)
        }

        // Add title if provided
        if (content.title) {
          const titleDiv = document.createElement('div')
          titleDiv.textContent = content.title
          Object.assign(titleDiv.style, {
            color: content.style.titleStyle.color,
            fontSize: `${content.style.titleStyle.fontSize}px`,
            fontFamily: content.style.titleStyle.fontFamily,
            fontWeight: content.style.titleStyle.fontWeight,
            textAlign: content.style.titleStyle.textAlign,
            marginBottom: '8px'
          })
          this.container.appendChild(titleDiv)
        }

        // Create grid container
        const grid = document.createElement('div')
        Object.assign(grid.style, {
          display: 'grid',
          gridTemplateColumns: `repeat(${content.style.columns}, 1fr)`,
          gap: '8px',
          width: '100%'
        })

        // Add items to grid
        content.items.forEach(item => {
          const itemContainer = document.createElement('div')
          Object.assign(itemContainer.style, {
            position: 'relative',
            width: '100%',
            paddingBottom: '100%',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          })

          const imgContainer = document.createElement('div')
          Object.assign(imgContainer.style, {
            position: 'absolute',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          })

          const img = document.createElement('img')
          img.src = item.url
          Object.assign(img.style, {
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          })
          img.draggable = false

          imgContainer.appendChild(img)
          itemContainer.appendChild(imgContainer)
          grid.appendChild(itemContainer)
        })

        this.container.appendChild(grid)
        this.draw()
      }
    }

    onAdd() {
      const div = document.createElement('div')
      div.style.position = 'absolute'
      div.style.cursor = 'move'
      div.style.userSelect = 'none'

      // Create container
      const container = document.createElement('div')
      Object.assign(container.style, {
        backgroundColor: this.getRgbaColor(
          this.content.style.backgroundColor,
          this.content.style.backgroundOpacity
        ),
        border: `${this.content.style.borderWidth}px solid ${this.getRgbaColor(
          this.content.style.borderColor,
          this.content.style.borderOpacity
        )}`,
        padding: `${this.content.style.padding}px`,
        borderRadius: '4px',
        display: 'inline-block',
        position: 'relative',
        minWidth: '200px',
        maxWidth: '600px',
        width: `${this.width}px`,
        boxSizing: 'border-box'
      })

      // Add title if provided
      if (this.content.title) {
        const titleDiv = document.createElement('div')
        titleDiv.textContent = this.content.title
        Object.assign(titleDiv.style, {
          color: this.content.style.titleStyle.color,
          fontSize: `${this.content.style.titleStyle.fontSize}px`,
          fontFamily: this.content.style.titleStyle.fontFamily,
          fontWeight: this.content.style.titleStyle.fontWeight,
          textAlign: this.content.style.titleStyle.textAlign,
          marginBottom: '8px'
        })
        container.appendChild(titleDiv)
      }

      // Create grid container
      const grid = document.createElement('div')
      Object.assign(grid.style, {
        display: 'grid',
        gridTemplateColumns: `repeat(${this.content.style.columns}, 1fr)`,
        gap: '8px',
        width: '100%'
      })

      // Add items to grid
      this.content.items.forEach(item => {
        const itemContainer = document.createElement('div')
        Object.assign(itemContainer.style, {
          position: 'relative',
          width: '100%',
          paddingBottom: '100%',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden'
        })

        const imgContainer = document.createElement('div')
        Object.assign(imgContainer.style, {
          position: 'absolute',
          inset: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px'
        })

        const img = document.createElement('img')
        img.src = item.url
        Object.assign(img.style, {
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        })
        img.draggable = false

        imgContainer.appendChild(img)
        itemContainer.appendChild(imgContainer)
        grid.appendChild(itemContainer)
      })

      container.appendChild(grid)

      // Add delete button
      const deleteCleanup = createDeleteButton(div, onDelete)
      if (deleteCleanup) {
        this.cleanupFunctions.push(deleteCleanup)
      }

      // Add edit button
      const editCleanup = createEditButton(div, () => {
        if (!this.modalRoot) {
          this.modalRoot = document.createElement('div')
          document.body.appendChild(this.modalRoot)
          this.modalReactRoot = createRoot(this.modalRoot)
        }

        this.modalReactRoot?.render(
          createElement(GroupEditModal, {
            isOpen: true,
            onClose: () => this.modalReactRoot?.render(null),
            initialTitle: this.content.title,
            initialItems: this.content.items,
            initialStyle: this.content.style,
            onSave: (data) => {
              this.updateContent(data)
              if (onEdit) onEdit(data)
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
        minWidth: 200,
        maxWidth: 600,
        onResize: (width: number) => {
          this.width = width
          container.style.width = `${width}px`
          this.draw()
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

  const groupOverlay = new GroupOverlay(
    new google.maps.LatLng(overlay.position.lat, overlay.position.lng),
    {
      title: overlay.properties.title,
      items: overlay.properties.items || [],
      style: {
        ...defaultContainerStyle,
        ...overlay.properties.containerStyle,
        titleStyle: {
          ...defaultContainerStyle.titleStyle,
          ...overlay.properties.titleStyle
        },
        columns: overlay.properties.columns || 3
      }
    },
    overlay.properties.width || 300
  )

  groupOverlay.setMap(map)
  return groupOverlay
}