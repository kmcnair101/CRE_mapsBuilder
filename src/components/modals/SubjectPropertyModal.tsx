import { useState, useRef, useEffect } from 'react'
import { X, Upload, Bold, Italic, Underline } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MapPreviewBackground } from '@/components/preview/MapPreviewBackground'

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72]

interface SubjectPropertyModalProps {
  isOpen: boolean
  onClose: () => void
  initialName: string
  initialImage: string | null
  initialStyle?: {
    color: string
    fontSize: number
    fontFamily: string
    backgroundColor: string
    borderColor: string
    borderWidth: number
    padding: number
    backgroundOpacity: number
    borderOpacity: number
  }
  onSave: (data: { 
    name: string
    image: string | null
    style?: {
      color: string
      fontSize: number
      fontFamily: string
      backgroundColor: string
      borderColor: string
      borderWidth: number
      padding: number
      backgroundOpacity: number
      borderOpacity: number
    }
  }) => void
}

export function SubjectPropertyModal({
  isOpen,
  onClose,
  initialName,
  initialImage,
  initialStyle,
  onSave
}: SubjectPropertyModalProps) {
  const [name, setName] = useState(initialName)
  const [image, setImage] = useState<string | null>(initialImage)
  const [color, setColor] = useState(initialStyle?.color || '#000000')
  const [fontSize, setFontSize] = useState(initialStyle?.fontSize || 14)
  const [fontFamily, setFontFamily] = useState(initialStyle?.fontFamily || 'Arial')
  const [backgroundColor, setBackgroundColor] = useState(initialStyle?.backgroundColor || '#FFFFFF')
  const [borderColor, setBorderColor] = useState(initialStyle?.borderColor || '#000000')
  const [borderWidth, setBorderWidth] = useState(initialStyle?.borderWidth || 1)
  const [padding, setPadding] = useState(initialStyle?.padding || 8)
  const [backgroundOpacity, setBackgroundOpacity] = useState(initialStyle?.backgroundOpacity || 1)
  const [borderOpacity, setBorderOpacity] = useState(initialStyle?.borderOpacity || 1)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && editorRef.current) {
      editorRef.current.innerHTML = initialName
    }
  }, [isOpen, initialName])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ 
      name,
      image,
      style: {
        color,
        fontSize,
        fontFamily,
        backgroundColor,
        borderColor,
        borderWidth,
        padding,
        backgroundOpacity,
        borderOpacity
      }
    })
    onClose()
  }

  const handleFormat = (command: string) => {
    if (!editorRef.current) {
      console.log('❌ Editor ref is not available');
      return;
    }
    
    console.log('🎯 Format command received:', command);
    
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    
    console.log('📑 Selection state:', {
      hasSelection: !!selection,
      hasRange: !!range,
      isCollapsed: selection?.isCollapsed,
      selectedText: selection?.toString(),
      rangeContent: range?.toString()
    });
    
    if (!selection || !range || selection.isCollapsed) {
      console.log('❌ No valid selection found');
      return;
    }
    
    // Save the selected text and its range
    const selectedText = range.toString();
    const tag = command === 'bold' ? 'b' : command === 'italic' ? 'i' : 'u';
    
    console.log('🏷️ Creating formatted text:', {
      selectedText,
      tag,
      command
    });
    
    // Create the formatted HTML
    const formattedText = `<${tag}>${selectedText}</${tag}>`;
    console.log('📝 Generated HTML:', formattedText);
    
    // Log the state before modification
    console.log('📄 Editor content before:', editorRef.current.innerHTML);
    
    try {
      // Delete the selected text and insert the formatted version
      range.deleteContents();
      const fragment = range.createContextualFragment(formattedText);
      range.insertNode(fragment);
      
      // Update the text state
      const newContent = editorRef.current.innerHTML;
      setName(newContent);
      
      console.log('✅ Formatting applied successfully:', {
        newContent,
        editorContent: editorRef.current.innerHTML
      });
      
      // Force focus back to the editor
      editorRef.current.focus();
      
    } catch (error) {
      console.error('❌ Error applying formatting:', error);
    }
    
    // Log final state
    console.log('🔍 Final editor state:', {
      innerHTML: editorRef.current.innerHTML,
      textContent: editorRef.current.textContent,
      hasFormattingTags: {
        bold: editorRef.current.innerHTML.includes('<b>'),
        italic: editorRef.current.innerHTML.includes('<i>'),
        underline: editorRef.current.innerHTML.includes('<u>')
      }
    });
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    console.log('📥 Input event received');
    
    const content = e.currentTarget.innerHTML;
    console.log('📝 New content:', {
      innerHTML: content,
      textContent: e.currentTarget.textContent,
      hasFormattingTags: {
        bold: content.includes('<b>'),
        italic: content.includes('<i>'),
        underline: content.includes('<u>')
      }
    });
    
    setName(content);
    
    console.log('✅ State updated with new content');
  }

  const getRgbaColor = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Subject Property
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 overflow-hidden">
          {/* Preview Section - Left Side */}
          <div className="w-2/5 p-4 border-r overflow-y-auto">
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
                  whiteSpace: 'pre-wrap',
                  display: 'inline-block',
                  transform: 'scale(0.9)',
                  transformOrigin: 'center center'
                }}
              >
                {image ? (
                  <img
                    src={image}
                    alt="Property"
                    className="max-w-[150px] max-h-[100px] object-contain rounded-md"
                  />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: name }} />
                )}
              </div>
            </MapPreviewBackground>
          </div>

          {/* Controls Section - Right Side */}
          <div className="w-3/5 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Name
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2 border-b border-gray-200 pb-2">
                    <button
                      type="button"
                      onClick={() => handleFormat('bold')}
                      className={cn(
                        'p-1.5 rounded hover:bg-gray-100 transition-colors',
                        document.queryCommandState('bold') && 'bg-gray-100'
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
                        document.queryCommandState('italic') && 'bg-gray-100'
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
                        document.queryCommandState('underline') && 'bg-gray-100'
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
                    className="min-h-[60px] max-h-[100px] w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-y-auto [&>b]:font-bold [&>i]:italic [&>u]:underline"
                    onPaste={(e) => {
                      e.preventDefault()
                      const text = e.clipboardData.getData('text/plain')
                      document.execCommand('insertText', false, text)
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Image
                </label>
                <div
                  className={cn(
                    'mt-1 border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer',
                    'hover:border-blue-500',
                    image ? 'border-blue-500' : 'border-gray-300'
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {image ? (
                    <div className="relative">
                      <img
                        src={image}
                        alt="Property"
                        className="max-w-[150px] max-h-[100px] object-contain mx-auto rounded-md"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImage(null)
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to upload property image
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {!image && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Text Style
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
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
                        className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Container Style
                </h3>

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
              </div>
            </div>
          </div>
        </form>

        <div className="flex justify-end space-x-3 p-4 border-t bg-white rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}