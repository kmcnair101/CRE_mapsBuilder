import { loader } from '@/lib/google-maps'

export interface BusinessResult {
  name: string
  placeId: string
  website?: string
}

export async function searchBusinesses(query: string): Promise<BusinessResult[]> {
  try {
    await loader.load()
    
    // Create a PlacesService (requires a map div)
    const mapDiv = document.createElement('div')
    const map = new google.maps.Map(mapDiv)
    const placesService = new google.maps.places.PlacesService(map)

    // Search for businesses with broader scope
    const request: google.maps.places.TextSearchRequest = {
      query,
      // Remove type to get all kinds of businesses and brands
      fields: ['name', 'place_id', 'website']
    }

    return new Promise((resolve, reject) => {
      placesService.textSearch(request, async (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          try {
            // Get details for each place
            const detailedResults = await Promise.all(
              results.map(place => 
                new Promise<BusinessResult | null>((detailResolve) => {
                  if (!place.place_id) {
                    detailResolve(null)
                    return
                  }

                  placesService.getDetails(
                    {
                      placeId: place.place_id,
                      fields: [
                        'name',
                        'website',
                        'types'
                      ]
                    },
                    (result, detailStatus) => {
                      if (detailStatus === google.maps.places.PlacesServiceStatus.OK && result) {
                        detailResolve({
                          name: result.name || place.name || '',
                          placeId: place.place_id || '',
                          website: result.website
                        })
                      } else {
                        detailResolve(null)
                      }
                    }
                  )
                })
              )
            )

            // Filter and deduplicate results by name
            const seenNames = new Set<string>()
            const validResults = detailedResults
              .filter((result): result is BusinessResult => {
                if (!result) return false
                
                // Skip if we've seen this name before
                const normalizedName = result.name.toLowerCase()
                if (seenNames.has(normalizedName)) return false
                seenNames.add(normalizedName)
                
                return true
              })
              .sort((a, b) => {
                // Calculate relevance score based on name match
                const getRelevanceScore = (result: BusinessResult) => {
                  let score = 0
                  
                  // Exact name match (highest priority)
                  if (result.name.toLowerCase() === query.toLowerCase()) {
                    score += 100
                  }
                  // Starts with query
                  else if (result.name.toLowerCase().startsWith(query.toLowerCase())) {
                    score += 50
                  }
                  // Contains query
                  else if (result.name.toLowerCase().includes(query.toLowerCase())) {
                    score += 25
                  }
                  
                  // Bonus for having a website (likely a legitimate business)
                  if (result.website) {
                    score += 5
                  }
                  
                  return score
                }

                return getRelevanceScore(b) - getRelevanceScore(a)
              })
              // Limit to top 5 most relevant results
              .slice(0, 5)

            resolve(validResults)
          } catch (error) {
            console.error('Error getting business details:', error)
            reject(error)
          }
        } else {
          resolve([])
        }
      })
    })
  } catch (error) {
    console.error('Error searching businesses:', error)
    return []
  }
}