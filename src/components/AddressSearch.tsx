import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Upload } from 'lucide-react'
import { loader } from '@/lib/google-maps'
import { cn } from '@/lib/utils'

export function AddressSearch() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propertyName, setPropertyName] = useState('')
  const [propertyImage, setPropertyImage] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null)
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    async function initializeSearchBox() {
      try {
        setLoading(true)
        await loader.load()

        if (searchInputRef.current) {
          const searchBox = new google.maps.places.SearchBox(searchInputRef.current)
          searchBoxRef.current = searchBox

          searchBox.addListener('places_changed', () => {
            const places = searchBox.getPlaces()
            if (!places || places.length === 0) {
              setError('Please select an address from the suggestions')
              return
            }

            const place = places[0]
            if (!place.geometry || !place.geometry.location) {
              setError('Invalid address selected')
              return
            }

            setSelectedPlace(place)
            setSearchValue(place.formatted_address || '')
            setError(null)
          })
        }
      } catch (error) {
        console.error('Error initializing Google Maps:', error)
        setError('Failed to load address search')
      } finally {
        setLoading(false)
      }
    }

    initializeSearchBox()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPropertyImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPlace || !selectedPlace.geometry?.location) {
      setError('Please select a valid address')
      return
    }

    const mapData = {
      subject_property: {
        address: selectedPlace.formatted_address || '',
        lat: selectedPlace.geometry.location.lat(),
        lng: selectedPlace.geometry.location.lng(),
        name: propertyName || 'Subject Property',
        image: propertyImage
      },
      center_lat: selectedPlace.geometry.location.lat(),
      center_lng: selectedPlace.geometry.location.lng(),
      zoom_level: 16
    }

    navigate('/maps/new', { state: mapData })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Create New Map
        </h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Subject Property Address
              </label>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  id="address"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search for an address..."
                  className="block w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              {selectedPlace && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ Address selected: {selectedPlace.formatted_address}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="propertyName" className="block text-sm font-medium text-gray-700">
                  Property Name (Optional)
                </label>
                <input
                  type="text"
                  id="propertyName"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="Enter property name..."
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Property Image (Optional)
                </label>
                <div
                  className={cn(
                    'mt-1 border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer',
                    'hover:border-blue-500',
                    propertyImage ? 'border-blue-500' : 'border-gray-300'
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {propertyImage ? (
                    <div className="relative">
                      <img
                        src={propertyImage}
                        alt="Property"
                        className="w-full h-48 object-contain rounded-md"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPropertyImage(null)
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
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
            </div>

            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : (
              <button
                type="submit"
                disabled={!selectedPlace}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}