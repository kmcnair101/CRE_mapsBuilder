import { useState, useRef, useEffect } from 'react'
import { Search, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loader } from '@/lib/google-maps'
import { LogoSelectionModal } from '@/components/modals/LogoSelectionModal'
import { fetchLogos } from '@/lib/brandfetch'

interface BusinessLayerProps {
  onAdd: (business: {
    name: string
    address: string
    location: google.maps.LatLng
    logo?: string
  }) => void
  isActive: boolean
  onToggle: () => void
  onClose?: () => void
  mapBounds?: google.maps.LatLngBounds
  subjectProperty?: {
    lat: number
    lng: number
  }
}

export function BusinessLayer({ 
  onAdd, 
  isActive, 
  onToggle, 
  onClose, 
  mapBounds,
  subjectProperty 
}: BusinessLayerProps) {
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logos, setLogos] = useState<Array<{ url: string }>>([])
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<google.maps.places.PlaceResult[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<{
    name: string
    address: string
    location: google.maps.LatLng
  } | null>(null)
  const [previewMarker, setPreviewMarker] = useState<google.maps.Marker | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const searchTimeoutRef = useRef<number | null>(null)
  const shouldMaintainFocus = useRef(false)

  useEffect(() => {
    if (isActive) {
      loader.load().then(() => {
        // Create a map for PlacesService and preview marker
        const mapDiv = document.createElement('div')
        const map = new google.maps.Map(mapDiv, {
          center: subjectProperty 
            ? { lat: subjectProperty.lat, lng: subjectProperty.lng }
            : mapBounds?.getCenter()?.toJSON() || { lat: 0, lng: 0 },
          zoom: 15
        })
        mapRef.current = map
        placesService.current = new google.maps.places.PlacesService(map)
      })
    }

    // Cleanup
    return () => {
      if (previewMarker) {
        previewMarker.setMap(null)
        setPreviewMarker(null)
      }
    }
  }, [isActive, mapBounds, subjectProperty])

  useEffect(() => {
    if (isActive && shouldMaintainFocus.current && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isActive, loading, searchResults])

  const searchBusinesses = async (query: string) => {
    if (!placesService.current || !query.trim()) {
      setSearchResults([])
      return []
    }

    const center = subjectProperty 
      ? new google.maps.LatLng(subjectProperty.lat, subjectProperty.lng)
      : mapBounds?.getCenter()

    if (!center) {
      throw new Error('No map center available')
    }

    const bounds = mapBounds || new google.maps.LatLngBounds(
      new google.maps.LatLng(
        center.lat() - 0.1,
        center.lng() - 0.1
      ),
      new google.maps.LatLng(
        center.lat() + 0.1,
        center.lng() + 0.1
      )
    )

    const searchRequest: google.maps.places.TextSearchRequest = {
      query,
      bounds,
      type: 'establishment'
    }

    return new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
      placesService.current!.textSearch(searchRequest, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Get details for each place to ensure we have complete address information
          Promise.all(
            results.map(place => 
              new Promise<google.maps.places.PlaceResult>((detailResolve) => {
                if (!place.place_id) {
                  detailResolve(place)
                  return
                }

                placesService.current!.getDetails(
                  {
                    placeId: place.place_id,
                    fields: ['name', 'formatted_address', 'geometry', 'address_components']
                  },
                  (result, detailStatus) => {
                    if (detailStatus === google.maps.places.PlacesServiceStatus.OK && result) {
                      detailResolve(result)
                    } else {
                      detailResolve(place)
                    }
                  }
                )
              })
            )
          ).then(detailedResults => {
            // Filter results to ensure they have complete addresses
            const validResults = detailedResults.filter(place => 
              place.formatted_address && 
              place.geometry?.location &&
              place.address_components?.some(component => 
                component.types.includes('street_number')
              ) &&
              place.address_components?.some(component => 
                component.types.includes('route')
              )
            )

            // Sort by distance from center
            const sortedResults = validResults.sort((a, b) => {
              if (!a.geometry?.location || !b.geometry?.location) return 0
              const distA = google.maps.geometry.spherical.computeDistanceBetween(
                center,
                a.geometry.location
              )
              const distB = google.maps.geometry.spherical.computeDistanceBetween(
                center,
                b.geometry.location
              )
              return distA - distB
            })

            resolve(sortedResults)
          })
        } else {
          reject(new Error('Failed to find businesses'))
        }
      })
    })
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = await searchBusinesses(query)

      if (results.length === 0) {
        setError('No businesses found with complete addresses')
        setSearchResults([])
      } else {
        setSearchResults(results)
        setError(null)
      }
    } catch (error) {
      console.error('Error searching for businesses:', error)
      setError('Failed to search for businesses. Please try again.')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    shouldMaintainFocus.current = true
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current)
    }

    // Set a new timeout to search after 300ms of no typing
    searchTimeoutRef.current = window.setTimeout(() => {
      handleSearch(query)
    }, 300)
  }

  const handleInputFocus = () => {
    shouldMaintainFocus.current = true
  }

  const handleInputBlur = () => {
    shouldMaintainFocus.current = false
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleBusinessHover = (place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location || !mapRef.current) return

    // Remove existing preview marker if any
    if (previewMarker) {
      previewMarker.setMap(null)
    }

    // Create new preview marker
    const marker = new google.maps.Marker({
      position: place.geometry.location,
      map: mapRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3B82F6',
        fillOpacity: 0.7,
        strokeColor: '#2563EB',
        strokeWeight: 2
      },
      animation: google.maps.Animation.DROP,
      title: place.name
    })

    setPreviewMarker(marker)
  }

  const handleBusinessLeave = () => {
    if (previewMarker) {
      previewMarker.setMap(null)
      setPreviewMarker(null)
    }
  }

  const handleBusinessSelect = async (place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location) {
      setError('Invalid business location')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const business = {
        name: place.name || '',
        address: place.formatted_address || '',
        location: place.geometry.location
      }
      setSelectedBusiness(business)

      // Fetch logos using the business name and location
      const fetchedLogos = await fetchLogos(business.name, business.location)
      if (fetchedLogos.length > 0) {
        setLogos(fetchedLogos)
        setIsLogoModalOpen(true)
      } else {
        // If no logos found, show logo selection modal with upload option
        setLogos([])
        setIsLogoModalOpen(true)
      }
    } catch (err) {
      console.error('Error in business search:', err)
      
      // Show logo selection modal even if logo fetch fails
      setLogos([])
      setIsLogoModalOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoSelect = (logoUrl: string) => {
    console.log('[BusinessLayer] Logo selected:', logoUrl);
    if (selectedBusiness) {
      console.log('[BusinessLayer] Selected business:', selectedBusiness);
      onAdd({
        ...selectedBusiness,
        logo: logoUrl
      })
      if (searchInputRef.current) {
        searchInputRef.current.value = ''
      }
      setSearchResults([])
      setIsLogoModalOpen(false)
      onClose?.()
    }
  }
  

  const handleLogoUpload = async (file: File) => {
    if (!selectedBusiness) return

    const reader = new FileReader()
    reader.onload = (e) => {
      if (selectedBusiness && e.target?.result) {
        onAdd({
          ...selectedBusiness,
          logo: e.target.result as string
        })
        if (searchInputRef.current) {
          searchInputRef.current.value = ''
        }
        setSearchResults([])
        setIsLogoModalOpen(false)
        onClose?.()
      }
    }
    reader.readAsDataURL(file)
  }

  const handleTextOnly = (businessName: string) => {
    if (selectedBusiness) {
      onAdd({
        ...selectedBusiness,
        logo: undefined // Don't include a logo for text-only
      })
      if (searchInputRef.current) {
        searchInputRef.current.value = ''
      }
      setSearchResults([])
      setIsLogoModalOpen(false)
      onClose?.()
    }
  }

  const formatDistance = (meters: number): string => {
    const miles = meters * 0.000621371 // Convert meters to miles
    if (miles < 0.1) {
      return 'Less than 0.1 miles away'
    } else if (miles < 1) {
      return `${(miles).toFixed(1)} miles away`
    } else {
      return `${Math.round(miles)} miles away`
    }
  }

  const handleBusinessAdd = (business: {
    name: string
    address: string
    location: google.maps.LatLng
    logo?: string
  }) => {
    console.log('[MapEditor] Adding business with logo:', business);
    // ... rest of the function
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-md focus:outline-none',
          isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        )}
      >
        <Building2 className="h-4 w-4 mr-2" />
        Location Search
      </button>

      {isActive && (
        <div className="space-y-4">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by business name or type (e.g., Starbucks, coffee shop)..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
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
              <p className="text-sm text-gray-500">
                Found {searchResults.length} location{searchResults.length !== 1 ? 's' : ''}.
                Select one to add to the map:
              </p>
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                {searchResults.map((place, index) => {
                  const distance = place.geometry?.location && subjectProperty
                    ? google.maps.geometry.spherical.computeDistanceBetween(
                        place.geometry.location,
                        new google.maps.LatLng(subjectProperty.lat, subjectProperty.lng)
                      )
                    : null

                  return (
                    <button
                      key={place.place_id || index}
                      onClick={() => handleBusinessSelect(place)}
                      onMouseEnter={() => handleBusinessHover(place)}
                      onMouseLeave={handleBusinessLeave}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{place.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{place.formatted_address}</p>
                      {distance !== null && (
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDistance(distance)}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <LogoSelectionModal
        isOpen={isLogoModalOpen}
        onClose={() => {
          setIsLogoModalOpen(false)
          setSelectedBusiness(null)
          if (searchInputRef.current) {
            searchInputRef.current.value = ''
          }
          setSearchResults([])
          onClose?.()
        }}
        logos={logos}
        onSelect={handleLogoSelect}
        onUpload={handleLogoUpload}
        onTextOnly={handleTextOnly}
        businessName={selectedBusiness?.name}
      />
    </div>
  )
}