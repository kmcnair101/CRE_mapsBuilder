import { z } from 'zod'
import { getBusinessDomain } from './utils/domain'

const BRANDFETCH_API_KEY = '1id07tPwKlmKE0Dbd-w'
const LOGODEV_API_KEY = 'pk_MyxZHgjIRKmPG38LuoM1Hg'

const logoResponseSchema = z.array(z.object({
  url: z.string().url(),
  width: z.number().optional(),
  height: z.number().optional(),
  format: z.string().optional(),
  size: z.number().optional()
})).default([])

async function fetchLogoFromBrandfetch(domain: string, path: string): Promise<string | null> {
  // Add format=png to ensure PNG format
  const originalUrl = `https://cdn.brandfetch.io/${encodeURIComponent(domain)}/fallback/404${path}?c=${BRANDFETCH_API_KEY}&format=png`
  // Proxy the URL through our endpoint
  const url = `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`
  console.log('Trying to fetch logo from Brandfetch:', url)

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`Failed to fetch logo from ${path}:`, response.status, response.statusText)
      return null
    }
    return url
  } catch (error) {
    console.warn(`Error fetching logo from ${path}:`, error)
    return null
  }
}

async function fetchLogoFromLogoDev(domain: string, size: number): Promise<string | null> {
  // Logo.dev already has format=png in the URL
  const originalUrl = `https://img.logo.dev/${encodeURIComponent(domain)}?token=${LOGODEV_API_KEY}&size=${size}&format=png`
  // Proxy the URL through our endpoint
  const url = `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`
  console.log('Trying to fetch logo from Logo.dev:', url)

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn('Failed to fetch logo from Logo.dev:', response.status, response.statusText)
      return null
    }
    return url
  } catch (error) {
    console.warn('Error fetching logo from Logo.dev:', error)
    return null
  }
}

export async function fetchLogos(businessName: string, location?: google.maps.LatLng) {
  try {
    console.log('Fetching logos for business:', businessName)

    // First try to get the actual business website
    const domain = await getBusinessDomain(businessName, location)
    if (!domain) {
      console.warn('No domain found for business')
      return []
    }

    // Try both Logo.dev and Brandfetch in parallel
    const [logoDevLogos, brandfetchLogos] = await Promise.all([
      // Logo.dev logos - only try 300px size
      Promise.all([
        fetchLogoFromLogoDev(domain, 300).then(logoUrl => {
          if (logoUrl) {
            return {
              url: logoUrl,
              width: 300,
              height: 150, // Approximate height based on typical logo proportions
              source: 'logo.dev'
            }
          }
          return null
        })
      ]),

      // Brandfetch logos - only try larger sizes
      Promise.all([
        { path: '/logo/w/300', width: 300, height: 150 },
        { path: '/w/300', width: 300, height: 150 },
        { path: '/logo/icon/w/100', width: 100, height: 100 }
      ].map(async variation => {
        const logoUrl = await fetchLogoFromBrandfetch(domain, variation.path)
        if (logoUrl) {
          return {
            url: logoUrl,
            width: variation.width,
            height: variation.height,
            source: 'brandfetch'
          }
        }
        return null
      }))
    ])

    // Combine and filter out null results
    const allLogos = [...logoDevLogos, ...brandfetchLogos]
      .filter((logo): logo is NonNullable<typeof logo> => {
        if (!logo) return false
        
        // Validate logo URL - allow both direct and proxied URLs
        try {
          const url = new URL(logo.url, window.location.origin)
          return url.pathname.startsWith('/api/proxy-image') || 
                 url.hostname === 'img.logo.dev' || 
                 url.hostname === 'cdn.brandfetch.io'
        } catch {
          return false
        }
      })
      // Sort by size (larger first) and source (Logo.dev first as it might be faster)
      .sort((a, b) => {
        if (a.source !== b.source) {
          return a.source === 'logo.dev' ? -1 : 1
        }
        return b.width - a.width
      })

    // Return empty array if no valid logos found
    if (allLogos.length === 0) {
      return []
    }

    console.log('Found logos:', allLogos)
    return allLogos
  } catch (error) {
    console.error('Error fetching logos:', error)
    return []
  }
}