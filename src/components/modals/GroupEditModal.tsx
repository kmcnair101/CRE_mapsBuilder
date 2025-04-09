import { useState, useRef, useEffect } from 'react'
import { X, Upload, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MapPreviewBackground } from '@/components/preview/MapPreviewBackground'
import { fetchLogos } from '@/lib/brandfetch'
import { searchBusinesses } from '@/lib/utils/places'

interface GroupEditModalProps {
  isOpen: boolean
  onClose: () => void
  initialTitle?: string
  initialItems: Array<{
    id: string
    type: 'image' | 'logo'
    url: string
    width: number
    height: number
  }>
  initialStyle: {
    backgroundColor: string
    borderColor: string
    borderWidth: number
    padding: number
    backgroundOpacity: number
    borderOpacity: number
    titleStyle: {
      color: string
      fontSize: number
      fontFamily: string
      fontWeight: string
      textAlign: 'left' | 'center' | 'right'
    }
    columns: number
  }
  onSave: (data: {
    title?: string
    items: Array<{
      id: string
      type: 'image' | 'logo'
      url: string
      width: number
      height: number
    }>
    style: {
      backgroundColor: string
      borderColor: string
      borderWidth: number
      padding: number
      backgroundOpacity: number
      borderOpacity: number
      titleStyle: {
        color: string
        fontSize: number
        fontFamily: string
        fontWeight: string
        textAlign: 'left' | 'center' | 'right'
      }
      columns: number
    }
  }) => void
}

export function GroupEditModal({
  isOpen,
  onClose,
  initialTitle = '',
  initialItems = [],
  initialStyle,
  onSave
}: GroupEditModalProps) {
  const [title, setTitle] = useState(initialTitle)
  const [items, setItems] = useState(initialItems)
  const [backgroundColor, setBackgroundColor] = useState(initialStyle.backgroundColor)
  const [borderColor, setBorderColor] = useState(initialStyle.borderColor)
  const [borderWidth, setBorderWidth] = useState(initialStyle.borderWidth)
  const [padding, setPadding] = useState(initialStyle.padding)
  const [backgroundOpacity, setBackgroundOpacity] = useState(initialStyle.backgroundOpacity)
  const [borderOpacity, setBorderOpacity] = useState(initialStyle.borderOpacity)
  const [titleColor, setTitleColor] = useState(initialStyle.titleStyle.color)
  const [titleFontSize, setTitleFontSize] = useState(initialStyle.titleStyle.fontSize)
  const [titleFontFamily, setTitleFontFamily] = useState(initialStyle.titleStyle.fontFamily)
  const [titleFontWeight, setTitleFontWeight] = useState(initialStyle.titleStyle.fontWeight)
  const [titleTextAlign, setTitleTextAlign] = useState(initialStyle.titleStyle.textAlign)
  const [columns, setColumns] = useState(initialStyle.columns)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Array<{
    url: string
    width: number
    height: number
  }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const handleLogoSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setLoading(true)
    setError(null)
    setSearchResults([])

    try {
      const businesses = await searchBusinesses(searchTerm)
      
      if (businesses.length === 0) {
        setError('No businesses found')
        return
      }

      const logos = await Promise.all(
        businesses.map(async business => {
          const results = await fetchLogos(business.name)
          return results[0] // Get first logo for each business
        })
      )

      const validLogos = logos.filter(logo => logo)
      if (validLogos.length === 0) {
        setError('No logos found')
        return
      }

      setSearchResults(validLogos)
    } catch (error) {
      console.error('Error searching for logos:', error)
      setError('Failed to search for logos')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          const img = new Image()
          img.onload = () => {
            setItems(prev => [...prev, {
              id: crypto.randomUUID(),
              type: 'image',
              url: e.target!.result as string,
              width: img.naturalWidth,
              height: img.naturalHeight
            }])
          }
          img.src = e.target.result as string
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-blue-500')
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500')
    }
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files)
    }
  }

  const handleLogoSelect = (logo: { url: string; width: number; height: number }) => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      type: 'logo',
      ...logo
    }])
    setSearchResults([])
    setSearchTerm('')
  }

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      setError('Please add at least one image or logo')
      return
    }

    onSave({
      title: title || undefined,
      items,
      style: {
        backgroundColor,
        borderColor,
        borderWidth,
        padding,
        backgroundOpacity,
        borderOpacity,
        titleStyle: {
          color: titleColor,
          fontSize: titleFontSize,
          fontFamily: titleFontFamily,
          fontWeight: titleFontWeight,
          textAlign: titleTextAlign
        },
        columns
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // Only trigger search if the search input has focus
      if (document.activeElement?.getAttribute('data-search-input') === 'true') {
        handleLogoSearch(e as any)
      }
    }
  }

  const getRgbaColor = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Group
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex" onKeyDown={handleKeyDown}>
          {/* Preview Section */}
          <div className="w-1/2 p-6 border-r">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
            <MapPreviewBackground>
              <div
                style={{
                  backgroundColor: getRgbaColor(backgroundColor, backgroundOpacity),
                  border: `${borderWidth}px solid ${getRgbaColor(borderColor, borderOpacity)}`,
                  padding: `${padding}px`,
                  borderRadius: '4px',
                  width: '100%',
                  maxWidth: '300px',
                  transform: 'scale(0.9)',
                  transformOrigin: 'center center'
                }}
              >
                {title && (
                  <div
                    style={{
                      color: titleColor,
                      fontSize: `${titleFontSize}px`,
                      fontFamily: titleFontFamily,
                      fontWeight: titleFontWeight,
                      textAlign: titleTextAlign,
                      marginBottom: '8px'
                    }}
                  >
                    {title}
                  </div>
                )}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: '8px'
                  }}
                >
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="relative bg-white border border-gray-200 rounded-lg p-2"
                    >
                      <img
                        src={item.url}
                        alt=""
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </MapPreviewBackground>
          </div>

          {/* Controls Section */}
          <div className="w-1/2 p-6">
            <div className="space-y-6">
              {/* Title Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Title Settings
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title Text
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter group title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title Color
                    </label>
                    <input
                      type="color"
                      value={titleColor}
                      onChange={(e) => setTitleColor(e.target.value)}
                      className="w-full h-8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Size
                    </label>
                    <select
                      value={titleFontSize}
                      onChange={(e) => setTitleFontSize(Number(e.target.value))}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {[12, 14, 16, 18, 20, 24].map(size => (
                        <option key={size} value={size}>{size}px</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Family
                    </label>
                    <select
                      value={titleFontFamily}
                      onChange={(e) => setTitleFontFamily(e.target.value)}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Weight
                    </label>
                    <select
                      value={titleFontWeight}
                      onChange={(e) => setTitleFontWeight(e.target.value)}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Alignment
                  </label>
                  <select
                    value={titleTextAlign}
                    onChange={(e) => setTitleTextAlign(e.target.value as 'left' | 'center' | 'right')}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              {/* Container Style */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Container Style
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background
                    </label>
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-full h-8"
                    />
                    <div className="mt-2">
                      <label className="block text-sm text-gray-600 mb-1">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Border Color
                    </label>
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="w-full h-8"
                    />
                    <div className="mt-2">
                      <label className="block text-sm text-gray-600 mb-1">
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

              {/* Grid Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Grid Settings
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Columns
                  </label>
                  <select
                    value={columns}
                    onChange={(e) => setColumns(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Column' : 'Columns'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Management */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Items
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {/* Image Upload */}
                  <div
                    ref={dropZoneRef}
                    className={cn(
                      'border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer',
                      'hover:border-blue-500',
                      'border-gray-300'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <p className="text-sm text-gray-600">Upload Image</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    />
                  </div>

                  {/* Logo Search */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search logos..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      data-search-input="true"
                    />
                    <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={handleLogoSearch}
                      className="absolute right-2 top-1.5 px-2 py-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {loading && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Found Logos
                    </h4>
                    <div className="grid grid-cols-4 gap-2 max-h-[150px] overflow-y-auto pr-2">
                      {searchResults.map((logo, index) => (
                        <button
                          key={index}
                          onClick={() => handleLogoSelect(logo)}
                          className="p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors shadow-sm"
                        >
                          <div className="aspect-square relative">
                            <div className="absolute inset-0 p-2 flex items-center justify-center">
                              <img
                                src={logo.url}
                                alt={`Logo result ${index + 1}`}
                                className="max-w-full max-h-full object-contain"
                                loading="lazy"
                              />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Items */}
                {items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Current Items
                    </h4>
                    <div className="grid grid-cols-5 gap-2 max-h-[150px] overflow-y-auto pr-2">
                      {items.map((item) => (
                        <div key={item.id} className="relative">
                          <div className="aspect-square relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <img
                                src={item.url}
                                alt={`Group item ${item.id}`}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 shadow-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={items.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}