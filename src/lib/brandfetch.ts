import { z } from 'zod'
import { getBusinessDomain } from './utils/domain'

const BRANDFETCH_API_KEY = '1id07tPwKlmKE0Dbd-w'
const LOGODEV_API_KEY = 'sk_JkxtsBv9QDCSqWVyxiRyrw'

const logoResponseSchema = z.array(z.object({
  url: z.string().url(),
  width: z.number().optional(),
  height: z.number().optional(),
  format: z.string().optional(),
  size: z.number().optional()
})).default([])

async function fetchLogoFromBrandfetch(domain: string, path: string): Promise<string | null> {
  const originalUrl = `https://cdn.brandfetch.io/${encodeURIComponent(domain)}/fallback/404${path}?c=${BRANDFETCH_API_KEY}&format=png`
  const url = `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`
  console.log('[Brandfetch] Attempting to fetch logo:', {
    domain,
    path,
    originalUrl,
    proxiedUrl: url
  })

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn('[Brandfetch] Failed to fetch logo:', {
        status: response.status,
        statusText: response.statusText,
        url
      })
      return null
    }
    console.log('[Brandfetch] Successfully fetched logo from:', url)
    return url
  } catch (error) {
    console.warn('[Brandfetch] Error fetching logo:', {
      error,
      url
    })
    return null
  }
}

async function fetchLogoFromLogoDev(domain: string, size: number): Promise<string | null> {
  const originalUrl = `https://img.logo.dev/${encodeURIComponent(domain)}?token=${LOGODEV_API_KEY}&size=${size}&format=png`
  const url = `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`
  console.log('[LogoDev] Attempting to fetch logo:', {
    domain,
    size,
    originalUrl,
    proxiedUrl: url
  })

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn('[LogoDev] Failed to fetch logo:', {
        status: response.status,
        statusText: response.statusText,
        url
      })
      return null
    }
    console.log('[LogoDev] Successfully fetched logo from:', url)
    return url
  } catch (error) {
    console.warn('[LogoDev] Error fetching logo:', {
      error,
      url
    })
    return null
  }
}

export async function fetchLogos(businessName: string, location?: google.maps.LatLng) {
  console.log('[LogoSearch] Starting logo search for:', {
    businessName,
    location: location ? {
      lat: location.lat(),
      lng: location.lng()
    } : undefined
  })

  try {
    const domain = await getBusinessDomain(businessName, location)
    console.log('[LogoSearch] Domain lookup result:', {
      businessName,
      domain,
      location: location ? {
        lat: location.lat(),
        lng: location.lng()
      } : undefined,
      timestamp: new Date().toISOString()
    });

    if (!domain) {
      console.warn('[LogoSearch] No domain found for business')
      return []
    }

    console.log('[LogoSearch] Starting parallel logo fetches:', {
      domain,
      services: ['LogoDev', 'Brandfetch'],
      timestamp: new Date().toISOString()
    });

    const [logoDevLogos, brandfetchLogos] = await Promise.all([
      Promise.all([
        fetchLogoFromLogoDev(domain, 300).then(logoUrl => {
          if (logoUrl) {
            return {
              url: logoUrl,
              width: 300,
              height: 150,
              source: 'logo.dev'
            }
          }
          return null
        })
      ]),
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

    const allLogos = [...logoDevLogos, ...brandfetchLogos]
      .filter((logo): logo is NonNullable<typeof logo> => {
        if (!logo) return false
        return true
      })
      .sort((a, b) => {
        if (a.source !== b.source) {
          return a.source === 'logo.dev' ? -1 : 1
        }
        return b.width - a.width
      })

    console.log('[LogoSearch] Found logos:', {
      total: allLogos.length,
      fromLogoDev: logoDevLogos.filter(Boolean).length,
      fromBrandfetch: brandfetchLogos.filter(Boolean).length,
      logos: allLogos
    })

    return allLogos
  } catch (error) {
    console.error('[LogoSearch] Error in logo fetch process:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      businessName,
      timestamp: new Date().toISOString()
    });
    return []
  }
}