import { loader } from '@/lib/google-maps'

export async function getBusinessDomain(businessName: string, location?: google.maps.LatLng): Promise<string | null> {
  try {
    await loader.load()
    
    // Create a PlacesService (requires a map div)
    const mapDiv = document.createElement('div')
    const map = new google.maps.Map(mapDiv)
    const placesService = new google.maps.places.PlacesService(map)

    // Search for the business
    const request: google.maps.places.TextSearchRequest = {
      query: businessName,
      ...(location && {
        location,
        radius: 5000 // 5km radius
      })
    }

    return new Promise((resolve) => {
      placesService.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.place_id) {
          // Get detailed place information
          placesService.getDetails(
            {
              placeId: results[0].place_id,
              fields: ['website', 'name', 'formatted_address']
            },
            (place, detailStatus) => {
              if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place?.website) {
                // Extract domain from website URL
                try {
                  const url = new URL(place.website)
                  const domain = url.hostname.replace('www.', '')
                  console.log('Found business domain:', domain)
                  resolve(domain)
                } catch {
                  console.warn('Failed to parse website URL:', place.website)
                  resolve(null)
                }
              } else {
                console.warn('No website found for business')
                resolve(null)
              }
            }
          )
        } else {
          console.warn('No place found for business:', businessName)
          resolve(null)
        }
      })
    })
  } catch (error) {
    console.error('Error getting business domain:', error)
    return null
  }
}