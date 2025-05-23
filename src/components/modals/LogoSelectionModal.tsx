import { useRef, useState } from 'react'
import { X, Upload, Type } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MapPreviewBackground } from '@/components/preview/MapPreviewBackground'

interface LogoSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  logos: Array<{
    url: string
    width: number
    height: number
  }>
  onSelect: (logo: string) => void
  onUpload: (file: File) => void
  onTextOnly?: (businessName: string) => void
  businessName?: string
}

export function LogoSelectionModal({
  isOpen,
  onClose,
  logos,
  onSelect,
  onUpload,
  onTextOnly,
  businessName
}: LogoSelectionModalProps) {
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  console.log('[LogoSelection] Modal opened with logos:', {
    logoCount: logos.length,
    logos: logos.map(logo => ({
      url: logo.url,
      width: logo.width,
      height: logo.height,
      isDataUrl: logo.url.startsWith('data:'),
      isProxied: logo.url.startsWith('/api/proxy-image')
    })),
    timestamp: new Date().toISOString()
  })

  const getProxiedImageUrl = (url: string): string => {
    if (url.startsWith('data:') || url.startsWith('/api/proxy-image')) {
      console.log('[LogoSelection] Using already proxied URL:', {
        url: url.substring(0, 100) + '...',
        type: url.startsWith('data:') ? 'data-url' : 'proxy-url'
      })
      return url
    }
    const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`
    console.log('[LogoSelection] Proxying URL:', {
      original: url.substring(0, 100) + '...',
      proxied: proxiedUrl
    })
    return proxiedUrl
  }

  const handleLogoSelect = (logo: string) => {
    console.log('[LogoSelection] Selecting logo:', {
      logo,
      logoType: typeof logo,
      timestamp: new Date().toISOString()
    })
    
    if (!logo) {
      console.error('[LogoSelection] Invalid logo selection:', {
        logo,
        timestamp: new Date().toISOString()
      })
      return
    }

    // Create a new image to get natural dimensions
    const img = new Image();
    img.onload = () => {
      const logoObject = {
        url: logo,
        width: img.naturalWidth,
        height: img.naturalHeight
      }
      
      console.log('[LogoSelection] Passing logo to onSelect:', {
        logoObject,
        timestamp: new Date().toISOString()
      })
      
      onSelect(logoObject)
    }
    img.src = logo;
  }

  const handleConfirm = () => {
    if (selectedLogo) {
      onSelect(selectedLogo)
      onClose()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
      onClose()
    }
  }

  const handleTextOnly = () => {
    if (onTextOnly && businessName) {
      onTextOnly(businessName)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Business Logo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Upload Custom Logo */}
            <div
              className={cn(
                'aspect-video border-2 border-dashed rounded-lg transition-colors cursor-pointer hover:border-blue-500 group',
                'flex flex-col items-center justify-center space-y-2 p-4',
                'bg-gray-50 hover:bg-gray-100'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-gray-400 group-hover:text-blue-500" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                  Upload Custom Logo
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click to upload your own logo image
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Use Text Only */}
            <button
              onClick={handleTextOnly}
              className={cn(
                'aspect-video border-2 rounded-lg transition-colors hover:border-blue-500 group',
                'flex flex-col items-center justify-center space-y-2 p-4',
                'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <Type className="h-8 w-8 text-gray-400 group-hover:text-blue-500" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                  Use Text Only
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Display business name as text
                </p>
              </div>
            </button>
          </div>

          {/* Found Logos Section */}
          {logos.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Found Business Logos
              </h3>
              <div className="grid grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-2">
                {logos.map((logo, index) => {
                  console.log('[LogoSelection] Rendering logo:', {
                    index,
                    logo,
                    hasUrl: 'url' in logo,
                    hasWidth: 'width' in logo,
                    hasHeight: 'height' in logo,
                    timestamp: new Date().toISOString()
                  })
                  
                  return (
                    <button
                      key={logo.url}
                      onClick={() => handleLogoSelect(logo.url)}
                      className={cn(
                        'p-3 border-2 rounded-lg transition-colors hover:border-blue-500',
                        selectedLogo === logo.url ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      )}
                    >
                      <MapPreviewBackground>
                        <div className="bg-white p-2 rounded-lg aspect-square flex items-center justify-center">
                          {logo.url && (
                            <img
                              key={logo.url}
                              src={getProxiedImageUrl(logo.url)}
                              alt={`Logo option ${index + 1}`}
                              className="max-w-full max-h-full object-contain"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error('[LogoSelection] Image load error:', {
                                  src: e.currentTarget.src,
                                  error: e,
                                  index,
                                  logo,
                                  timestamp: new Date().toISOString()
                                })
                              }}
                              onLoad={(e) => {
                                console.log('[LogoSelection] Image loaded:', {
                                  src: e.currentTarget.src,
                                  naturalWidth: e.currentTarget.naturalWidth,
                                  naturalHeight: e.currentTarget.naturalHeight,
                                  index,
                                  logo,
                                  timestamp: new Date().toISOString()
                                })
                              }}
                              loading="lazy"
                            />
                          )}
                        </div>
                      </MapPreviewBackground>
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-end mt-4 sticky bottom-0 bg-white pt-2 border-t">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!selectedLogo}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Use Selected Logo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}