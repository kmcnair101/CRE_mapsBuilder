import { useState } from 'react'
import { Search, ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchLogos } from '@/lib/brandfetch'
import { MapPreviewBackground } from '@/components/preview/MapPreviewBackground'
import { searchBusinesses, type BusinessResult } from '@/lib/utils/places'

interface LogoLayerProps {
  onAdd: (logo: {
    url: string
    width: number
    height: number
  }) => void
  isActive: boolean
  onToggle: () => void
  onClose?: () => void
}

export function LogoLayer({ onAdd, isActive, onToggle, onClose }: LogoLayerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [businesses, setBusinesses] = useState<BusinessResult[]>([])
  const [logos, setLogos] = useState<Array<{
    url: string
    width: number
    height: number
    source: string
  }>>([])
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessResult | null>(null)

  console.log('[LogoLayer] Component mounted:', {
    hasOnLogoSelect: typeof onAdd === 'function',
    timestamp: new Date().toISOString()
  })

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    console.log('[LogoLayer] Starting business search:', {
      searchTerm,
      timestamp: new Date().toISOString()
    });

    setLoading(true)
    setError(null)
    setLogos([])
    setBusinesses([])
    setSelectedBusiness(null)

    try {
      const results = await searchBusinesses(searchTerm)
      
      console.log('[LogoLayer] Business search results:', {
        searchTerm,
        resultCount: results.length,
        timestamp: new Date().toISOString()
      });
      
      if (results.length === 0) {
        setError('No businesses found with this name')
      } else if (results.length === 1) {
        // If only one result, automatically select it
        await handleBusinessSelect(results[0])
      } else {
        // Show list of businesses for user to choose from
        setBusinesses(results)
      }
    } catch (error) {
      console.error('Error searching for business:', error)
      setError('Failed to search for business. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessSelect = async (business: BusinessResult) => {
    console.log('[LogoLayer] Business selected:', {
      name: business.name,
      website: business.website,
      timestamp: new Date().toISOString()
    });

    setLoading(true)
    setError(null)
    setLogos([])
    setSelectedBusiness(business)

    try {
      console.log('[LogoLayer] Starting logo fetch for business:', {
        name: business.name,
        timestamp: new Date().toISOString()
      });

      const results = await fetchLogos(business.name)
      
      console.log('[LogoLayer] Logo fetch results:', {
        businessName: business.name,
        logoCount: results.length,
        timestamp: new Date().toISOString()
      });

      setLogos(results)
      
      if (results.length === 0) {
        console.warn('[LogoLayer] No logos found for business:', {
          name: business.name,
          timestamp: new Date().toISOString()
        });
        setError('No logos found for this business')
      }
    } catch (error) {
      console.error('[LogoLayer] Error fetching logos:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        businessName: business.name,
        timestamp: new Date().toISOString()
      });
      setError('Failed to fetch logos. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoSelect = async (logo: string) => {
    console.log('[LogoLayer] Logo selected:', {
      logo,
      logoType: typeof logo,
      timestamp: new Date().toISOString()
    })

    try {
      // Create a new image to get natural dimensions
      const img = new Image();
      img.onload = () => {
        const logoObject = {
          url: logo,
          width: img.naturalWidth,
          height: img.naturalHeight
        }

        console.log('[LogoLayer] Passing logo to parent:', {
          logoObject,
          timestamp: new Date().toISOString()
        })

        onAdd(logoObject)
      }
      img.src = logo;
    } catch (error) {
      console.error('[LogoLayer] Error handling logo selection:', {
        error,
        logo,
        timestamp: new Date().toISOString()
      })
    }
  }

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-md focus:outline-none',
          isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        )}
      >
        <ImagePlus className="h-4 w-4 mr-2" />
        Logo Search
      </button>

      {isActive && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search business name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

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

          {businesses.length > 0 && !selectedBusiness && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Multiple businesses found. Please select one:
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {businesses.map((business) => (
                  <button
                    key={business.placeId}
                    onClick={() => handleBusinessSelect(business)}
                    className="text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm line-clamp-1">{business.name}</p>
                        {business.website && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {new URL(business.website).hostname.replace('www.', '')}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedBusiness && (
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
              <span className="text-sm font-medium text-gray-700">
                {selectedBusiness.name}
              </span>
              <button
                onClick={() => {
                  setSelectedBusiness(null)
                  setLogos([])
                  setBusinesses([])
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Change
              </button>
            </div>
          )}

          {logos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Select a logo to add to the map:
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                {logos.map((logo, index) => (
                  <button
                    key={`${logo.url}-${index}`}
                    onClick={() => handleLogoSelect(logo.url)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow p-2"
                  >
                    <MapPreviewBackground>
                      <div className="bg-white p-2 rounded-lg aspect-square flex items-center justify-center">
                        <img
                          src={logo.url}
                          alt={`Logo result ${index + 1}`}
                          className="max-w-full max-h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    </MapPreviewBackground>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}