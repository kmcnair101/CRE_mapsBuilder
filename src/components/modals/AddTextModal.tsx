import { useState, useRef, useEffect } from 'react'
import { X, Bold, Italic, Underline } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MapPreviewBackground } from '@/components/preview/MapPreviewBackground'

interface AddTextModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (text: string, style: {
    color: string
    fontSize: number
    fontFamily: string
    backgroundColor: string
    borderColor: string
    borderWidth: number
    padding: number
    backgroundOpacity: number
    borderOpacity: number
  }) => void
}

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72]

export function AddTextModal({
  isOpen,
  onClose,
  onSave
}: AddTextModalProps) {
  const [text, setText] = useState('')
  const [color, setColor] = useState('#000000')
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
  const [borderColor, setBorderColor] = useState('#000000')
  const [borderWidth, setBorderWidth] = useState(1)
  const [padding, setPadding] = useState(8)
  const [backgroundOpacity, setBackgroundOpacity] = useState(1)
  const [borderOpacity, setBorderOpacity] = useState(1)
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
  })
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && editorRef.current) {
      editorRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handler = () => updateFormatState()
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [])

  useEffect(() => {
    updateFormatState()
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSave(text, {
        color,
        fontSize,
        fontFamily,
        backgroundColor,
        borderColor,
        borderWidth,
        padding,
        backgroundOpacity,
        borderOpacity
      })
      setText('')
      onClose()
    }
  }

  const handleFormat = (command: string) => {
    const timestamp = new Date().toISOString()
    const selection = window.getSelection()
    const beforeContent = editorRef.current?.innerHTML || ''
    
    console.log('🎯 Text Formatting Operation')
    console.log(`Command: ${command}`)
    console.log(`Timestamp: ${timestamp}`)
    
    const selectionState = {
      exists: !!selection,
      rangeCount: selection?.rangeCount || 0,
      type: selection?.type || 'None',
      isCollapsed: selection?.isCollapsed || true,
      hasRange: selection?.rangeCount > 0,
      selectedText: selection?.toString() || ''
    }
    
    console.log('🔍 Selection Details')
    console.log('Selection object:', selectionState)

    // If caret only (no selection), select all text
    if (
      editorRef.current &&
      selection &&
      (selection.rangeCount === 0 || (selection.rangeCount === 1 && selection.isCollapsed))
    ) {
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      selection.removeAllRanges()
      selection.addRange(range)
      console.log('⚠️ No Selection - Auto-selected all content for formatting')
    }

    const isFormatted = document.queryCommandState(command)
    console.log('Current content:', beforeContent)
    console.log('Is formatted:', isFormatted)

    try {
      document.execCommand(command, false)
      
      const afterContent = editorRef.current?.innerHTML || ''
      const formatTag = command === 'bold' ? 'b' : command === 'italic' ? 'i' : 'u'
      
      console.log('✅ Format toggle result:', {
        before: beforeContent,
        after: afterContent,
        tag: formatTag,
        wasFormatted: isFormatted
      })

      // Optionally, clear selection after formatting
      if (selection) selection.removeAllRanges()

      updateFormatState()

    } catch (error) {
      console.error('❌ Format operation failed:', {
        command,
        error: error instanceof Error ? error.message : 'Unknown error',
        currentContent: beforeContent
      })
    }
  }

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML
    setText(content)
    
    console.log('📝 Content Update')
    console.log(`Timestamp: ${new Date().toISOString()}`)
    console.log('Current content:', content)
    console.log('Content length:', content.length)
    
    // Enhanced formatting analysis
    const hasFormatting = content.includes('<')
    console.log('Has formatting:', hasFormatting)
    
    if (hasFormatting) {
      const tags = content.match(/<\/?[^>]+(>|$)/g) || []
      console.log('Active formatting:', {
        tags,
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline')
      })
    }

    updateFormatState()
  }

  const updateFormatState = () => {
    setFormatState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    })
  }

  // Convert hex color to rgba
  const getRgbaColor = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Text
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex">
          {/* Preview Section - Left Side */}
          <div className="w-2/5 p-6 border-r">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
            <MapPreviewBackground>
              <div
                className="inline-block"
                style={{
                  color,
                  fontSize: `${fontSize}px`,
                  fontFamily,
                  backgroundColor: getRgbaColor(backgroundColor, backgroundOpacity),
                  border: `${borderWidth}px solid ${getRgbaColor(borderColor, borderOpacity)}`,
                  padding: `${padding}px`,
                  borderRadius: '4px',
                  textAlign: 'center',
                  minWidth: 'min-content',
                  maxWidth: '100%',
                  whiteSpace: 'pre',
                  display: 'inline-block',
                  transform: 'scale(0.9)',
                  transformOrigin: 'center center'
                }}
                dangerouslySetInnerHTML={{ __html: text || 'Preview Text' }}
              />
            </MapPreviewBackground>
          </div>

          {/* Controls Section - Right Side */}
          <div className="w-3/5 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <div className="space-y-2">
                <div className="flex gap-2 border-b border-gray-200 pb-2">
                  <button
                    type="button"
                    onClick={() => handleFormat('bold')}
                    className={cn(
                      'p-1.5 rounded hover:bg-gray-100 transition-colors',
                      formatState.bold && 'bg-gray-100'
                    )}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat('italic')}
                    className={cn(
                      'p-1.5 rounded hover:bg-gray-100 transition-colors',
                      formatState.italic && 'bg-gray-100'
                    )}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat('underline')}
                    className={cn(
                      'p-1.5 rounded hover:bg-gray-100 transition-colors',
                      formatState.underline && 'bg-gray-100'
                    )}
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleInput}
                  className="min-h-[120px] max-h-[200px] w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-y-auto"
                  onPaste={(e) => {
                    e.preventDefault()
                    const text = e.clipboardData.getData('text/plain')
                    document.execCommand('insertText', false, text)
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Color
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-8"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Size
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {FONT_SIZES.map(size => (
                    <option key={size} value={size}>{size}px</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Background
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full h-8"
                  />
                  <div className="w-28">
                    <label className="block text-xs text-gray-600">
                      Opacity: {Math.round(backgroundOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={backgroundOpacity}
                      onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Border Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="w-full h-8"
                  />
                  <div className="w-28">
                    <label className="block text-xs text-gray-600">
                      Opacity: {Math.round(borderOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={borderOpacity}
                      onChange={(e) => setBorderOpacity(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Border Width
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={borderWidth}
                    onChange={(e) => setBorderWidth(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-12">
                    {borderWidth}px
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Padding
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={padding}
                    onChange={(e) => setPadding(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-12">
                    {padding}px
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-white border-t mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!text.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Text
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}