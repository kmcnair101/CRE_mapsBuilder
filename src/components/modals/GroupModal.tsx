import { useState, useRef } from 'react'
import { X, Upload, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MapPreviewBackground } from '@/components/preview/MapPreviewBackground'
import { fetchLogos } from '@/lib/brandfetch'
import { searchBusinesses } from '@/lib/utils/places'

interface GroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (group: {
    title?: string
    items: Array<{
      id: string
      type: 'image' | 'logo'
      url: string
      width: number
      height: number
    }>
    style?: {
      backgroundColor: string
      borderColor: string
      borderWidth: number
      padding: number
      backgroundOpacity: number
      borderOpacity: number
      columnWidth: number
    }
  }) => void
}

export function GroupModal({ isOpen, onClose, onSave }: GroupModalProps) {
  const [title, setTitle] = useState('')
  const [items, setItems] = useState<Array<{
    id: string
    type: 'image' | 'logo'
    url: string
    width: number
    height: number
  }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
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

  const handleSubmit = () => {
    if (items.length === 0) {
      setError('Please add at least one image or logo')
      return
    }

    onSave({
      title: title || undefined,
      items,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#000000',
        borderWidth: 1,
        padding: 8,
        backgroundOpacity: 1,
        borderOpacity: 1,
        columnWidth: 60
      }
    })

    // Reset form
    setTitle('')
    setItems([])
    setSearchTerm('')
    setSearchResults([])
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Create Group
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex" onKeyDown={handleKeyDown}>
          {/* Preview Section */}
          <div className="w-1/2 p-6 border-r overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
            <MapPreviewBackground>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #000000',
                  padding: '8px',
                  borderRadius: '4px',
                  width: '100%',
                  maxWidth: '300px',
                  transform: 'scale(0.9)',
                  transformOrigin: 'center center'
                }}
              >
                {title && (
                  <div className="text-lg font-medium mb-4 text-center">
                    {title}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="relative bg-white border border-gray-200 rounded-lg p-2 aspect-square"
                    >
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                        <img
                          src={item.url}
                          alt=""
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </MapPreviewBackground>
          </div>

          {/* Controls Section */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Title (Optional)
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
                {/* Image Upload */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Upload Image
                  </h3>
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
                      <Upload className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-600 text-center">
                        Drop images here or click to upload
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    />
                  </div>
                </div>

                {/* Logo Search */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Logo Search
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search for business logos..."
                      className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      data-search-input="true"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={handleLogoSearch}
                      className="absolute right-2 top-1.5 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Search
                    </button>
                  </div>
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
                  <h3 className="text-sm font-medium text-gray-700">
                    Found Logos
                  </h3>
                  <div className="grid grid-cols-4 gap-2 max-h-[150px] overflow-y-auto pr-2">
                    {searchResults.map((logo, index) => (
                      <button
                        key={index}
                        onClick={() => handleLogoSelect(logo)}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors bg-white shadow-sm"
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

              {/* Added Items */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">
                      Added Items ({items.length})
                    </h3>
                  </div>
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
            Create Group
          </button>
        </div>
      </div>
    </div>
  )
}