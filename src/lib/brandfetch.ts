import { z } from 'zod'
import { getBusinessDomain } from './utils/domain'

const BRANDFETCH_API_KEY = 'Y1RHW9DpY+ca5sePNlM3+AKFSj3RkCeoRrS5EDOQugw='
const LOGODEV_API_KEY = 'pk_IUW5ADLFTyaB0B8WF5lwtA'

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

async function fetchAllBrandfetchLogos(domain: string): Promise<Array<{ url: string, width?: number, height?: number, format?: string, source: string }>> {
  const apiUrl = `https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`
  const headers = {
    'Authorization': `Bearer ${BRANDFETCH_API_KEY}`,
  }

  try {
    const response = await fetch(apiUrl, { headers })
    if (!response.ok) {
      console.warn('[Brandfetch] API failed:', { status: response.status, statusText: response.statusText, apiUrl })
      return []
    }
    const data = await response.json()
    // Collect all logos and icons in all formats
    const allAssets = [
      ...(data.logos || []),
      ...(data.icons || [])
    ]
    const allFormats = allAssets.flatMap((asset: any) =>
      (asset.formats || []).map((format: any) => ({
        url: `/api/proxy-image?url=${encodeURIComponent(format.src)}`,
        width: format.width,
        height: format.height,
        format: format.format,
        source: 'brandfetch'
      }))
    )
    return allFormats
  } catch (error) {
    console.warn('[Brandfetch] API error:', { error, apiUrl })
    return []
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
      fetchAllBrandfetchLogos(domain)
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