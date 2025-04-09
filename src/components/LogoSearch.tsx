import { useState } from 'react'
import { Search } from 'lucide-react'
import { fetchLogos } from '@/lib/brandfetch'
import { MapPreviewBackground } from './preview/MapPreviewBackground'

export function LogoSearch() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logos, setLogos] = useState<Array<{
    url: string
    width: number
    height: number
    source: string
  }>>([])
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setLoading(true)
    setError(null)
    setLogos([])

    try {
      // Use a default location (NYC) since we just want logos
      const defaultLocation = new google.maps.LatLng(40.7128, -74.0060)
      const results = await fetchLogos(searchTerm, defaultLocation)
      setLogos(results)
      
      if (results.length === 0) {
        setError('No logos found for this business')
      }
    } catch (error) {
      console.error('Error searching for logos:', error)
      setError('Failed to search for logos. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Business Logo Search
      </h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter business name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {logos.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">
            Found {logos.length} logo{logos.length !== 1 ? 's' : ''}
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {logos.map((logo, index) => (
              <div
                key={`${logo.url}-${index}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <MapPreviewBackground>
                  <div className="bg-white p-4 rounded-lg">
                    <img
                      src={logo.url}
                      alt={`Logo result ${index + 1}`}
                      className="max-w-full h-auto max-h-32 object-contain mx-auto"
                      loading="lazy"
                    />
                  </div>
                </MapPreviewBackground>
                <div className="p-4 border-t border-gray-100">
                  <a
                    href={logo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-blue-600 hover:text-blue-500"
                  >
                    Open Image
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}