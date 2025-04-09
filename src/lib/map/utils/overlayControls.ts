import { Pencil } from 'lucide-react'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

export function createDeleteButton(container: HTMLElement | null, onDelete: () => void) {
  if (!container) return null

  const deleteButton = document.createElement('button')
  deleteButton.className = 'delete-button'
  Object.assign(deleteButton.style, {
    position: 'absolute',
    top: '-12px',
    right: '-12px',
    backgroundColor: '#EF4444',
    color: 'white',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    fontSize: '18px',
    fontWeight: 'bold',
    border: 'none',
    zIndex: '1000',
    transition: 'opacity 0.2s, background-color 0.2s',
    opacity: '0'
  })
  deleteButton.innerHTML = '×'

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

  const handleMouseEnter = () => {
    deleteButton.style.backgroundColor = '#DC2626'
  }

  const handleMouseLeave = () => {
    deleteButton.style.backgroundColor = '#EF4444'
  }

  const handleContainerMouseEnter = () => {
    deleteButton.style.display = 'flex'
    setTimeout(() => {
      deleteButton.style.opacity = '1'
    }, 0)
  }

  const handleContainerMouseLeave = (e: MouseEvent) => {
    const rect = deleteButton.getBoundingClientRect()
    const isOverButton = e.clientX >= rect.left && e.clientX <= rect.right &&
                        e.clientY >= rect.top && e.clientY <= rect.bottom
    
    if (!isOverButton) {
      deleteButton.style.opacity = '0'
      setTimeout(() => {
        if (deleteButton.style.opacity === '0') {
          deleteButton.style.display = 'none'
        }
      }, 200)
    }
  }

  deleteButton.addEventListener('click', handleClick)
  deleteButton.addEventListener('mouseenter', handleMouseEnter)
  deleteButton.addEventListener('mouseleave', handleMouseLeave)
  container.addEventListener('mouseenter', handleContainerMouseEnter)
  container.addEventListener('mouseleave', handleContainerMouseLeave)

  try {
    container.appendChild(deleteButton)
  } catch (error) {
    console.warn('Failed to append delete button')
    return null
  }

  return () => {
    deleteButton.removeEventListener('click', handleClick)
    deleteButton.removeEventListener('mouseenter', handleMouseEnter)
    deleteButton.removeEventListener('mouseleave', handleMouseLeave)
    container.removeEventListener('mouseenter', handleContainerMouseEnter)
    container.removeEventListener('mouseleave', handleContainerMouseLeave)
    try {
      if (deleteButton.parentNode === container) {
        container.removeChild(deleteButton)
      }
    } catch (error) {
      console.warn('Failed to remove delete button')
    }
  }
}

export function createEditButton(container: HTMLElement | null, onEdit: () => void) {
  if (!container) return null

  const editButton = document.createElement('button')
  editButton.className = 'edit-button'
  Object.assign(editButton.style, {
    position: 'absolute',
    top: '-12px',
    right: '20px',
    backgroundColor: '#3B82F6',
    color: 'white',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: '1000',
    border: 'none',
    transition: 'opacity 0.2s, background-color 0.2s',
    opacity: '0'
  })

  let iconRoot: ReturnType<typeof createRoot> | null = null
  try {
    iconRoot = createRoot(editButton)
    iconRoot.render(createElement(Pencil, { size: 14 }))
  } catch (error) {
    console.warn('Failed to create edit button icon')
    return null
  }

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    onEdit()
  }

  const handleMouseEnter = () => {
    editButton.style.backgroundColor = '#2563EB'
  }

  const handleMouseLeave = () => {
    editButton.style.backgroundColor = '#3B82F6'
  }

  const handleContainerMouseEnter = () => {
    editButton.style.display = 'flex'
    setTimeout(() => {
      editButton.style.opacity = '1'
    }, 0)
  }

  const handleContainerMouseLeave = (e: MouseEvent) => {
    const rect = editButton.getBoundingClientRect()
    const isOverButton = e.clientX >= rect.left && e.clientX <= rect.right &&
                        e.clientY >= rect.top && e.clientY <= rect.bottom
    
    if (!isOverButton) {
      editButton.style.opacity = '0'
      setTimeout(() => {
        if (editButton.style.opacity === '0') {
          editButton.style.display = 'none'
        }
      }, 200)
    }
  }

  editButton.addEventListener('click', handleClick)
  editButton.addEventListener('mouseenter', handleMouseEnter)
  editButton.addEventListener('mouseleave', handleMouseLeave)
  container.addEventListener('mouseenter', handleContainerMouseEnter)
  container.addEventListener('mouseleave', handleContainerMouseLeave)

  try {
    container.appendChild(editButton)
  } catch (error) {
    console.warn('Failed to append edit button')
    iconRoot?.unmount()
    return null
  }

  return () => {
    editButton.removeEventListener('click', handleClick)
    editButton.removeEventListener('mouseenter', handleMouseEnter)
    editButton.removeEventListener('mouseleave', handleMouseLeave)
    container.removeEventListener('mouseenter', handleContainerMouseEnter)
    container.removeEventListener('mouseleave', handleContainerMouseLeave)
    iconRoot?.unmount()
    try {
      if (editButton.parentNode === container) {
        container.removeChild(editButton)
      }
    } catch (error) {
      console.warn('Failed to remove edit button')
    }
  }
}

interface ResizeConfig {
  minWidth: number
  maxWidth: number
  maintainAspectRatio?: boolean
  aspectRatio?: number
  onResize: (width: number) => void
}

export function createResizeHandle(container: HTMLElement | null, config: ResizeConfig) {
  if (!container) return null

  const {
    minWidth,
    maxWidth,
    maintainAspectRatio = false,
    aspectRatio = 1,
    onResize
  } = config

  const handle = document.createElement('div')
  handle.className = 'resize-handle'
  Object.assign(handle.style, {
    position: 'absolute',
    right: '-8px',
    bottom: '-8px',
    width: '16px',
    height: '16px',
    backgroundColor: 'white',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    cursor: 'se-resize',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1000',
    transition: 'opacity 0.2s, background-color 0.2s',
    opacity: '0'
  })

  const icon = document.createElement('div')
  Object.assign(icon.style, {
    width: '6px',
    height: '6px',
    borderRight: '2px solid #D1D5DB',
    borderBottom: '2px solid #D1D5DB'
  })

  try {
    handle.appendChild(icon)
  } catch (error) {
    console.warn('Failed to append resize handle icon')
    return null
  }

  let isResizing = false
  let startX = 0
  let startWidth = 0
  let lastWidth = container.offsetWidth

  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    isResizing = true
    startX = e.clientX
    startWidth = container.offsetWidth
    document.body.style.cursor = 'se-resize'
    handle.style.backgroundColor = '#F3F4F6'
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    e.preventDefault()
    
    const dx = e.clientX - startX
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + dx))
    
    if (newWidth !== lastWidth) {
      lastWidth = newWidth

      container.style.width = `${newWidth}px`

      if (maintainAspectRatio && aspectRatio) {
        const newHeight = newWidth / aspectRatio
        container.style.height = `${newHeight}px`
      }

      onResize(newWidth)
    }
  }

  const handleMouseUp = () => {
    if (isResizing) {
      isResizing = false
      document.body.style.cursor = 'default'
      handle.style.backgroundColor = 'white'
      
      // Keep handle visible if mouse is still over container
      const containerRect = container.getBoundingClientRect()
      const mouseX = event?.clientX || 0
      const mouseY = event?.clientY || 0
      
      if (mouseX < containerRect.left || mouseX > containerRect.right ||
          mouseY < containerRect.top || mouseY > containerRect.bottom) {
        handle.style.opacity = '0'
        setTimeout(() => {
          if (handle.style.opacity === '0') {
            handle.style.display = 'none'
          }
        }, 200)
      }
    }
  }

  // Show/hide resize handle on container hover
  const handleContainerMouseEnter = () => {
    if (!isResizing) {
      handle.style.display = 'flex'
      setTimeout(() => {
        handle.style.opacity = '1'
      }, 0)
    }
  }

  const handleContainerMouseLeave = (e: MouseEvent) => {
    if (!isResizing) {
      const handleRect = handle.getBoundingClientRect()
      const isOverHandle = e.clientX >= handleRect.left && e.clientX <= handleRect.right &&
                          e.clientY >= handleRect.top && e.clientY <= handleRect.bottom
      
      if (!isOverHandle) {
        handle.style.opacity = '0'
        setTimeout(() => {
          if (handle.style.opacity === '0') {
            handle.style.display = 'none'
          }
        }, 200)
      }
    }
  }

  // Handle hover on the resize handle itself
  const handleMouseEnter = () => {
    if (!isResizing) {
      handle.style.backgroundColor = '#F3F4F6'
    }
  }

  const handleHandleMouseLeave = () => {
    if (!isResizing) {
      handle.style.backgroundColor = 'white'
    }
  }

  handle.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  container.addEventListener('mouseenter', handleContainerMouseEnter)
  container.addEventListener('mouseleave', handleContainerMouseLeave)
  handle.addEventListener('mouseenter', handleMouseEnter)
  handle.addEventListener('mouseleave', handleHandleMouseLeave)

  try {
    container.appendChild(handle)
  } catch (error) {
    console.warn('Failed to append resize handle')
    return null
  }

  return () => {
    handle.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    container.removeEventListener('mouseenter', handleContainerMouseEnter)
    container.removeEventListener('mouseleave', handleContainerMouseLeave)
    handle.removeEventListener('mouseenter', handleMouseEnter)
    handle.removeEventListener('mouseleave', handleHandleMouseLeave)
    try {
      if (handle.parentNode === container) {
        container.removeChild(handle)
      }
    } catch (error) {
      console.warn('Failed to remove resize handle')
    }
  }
}