import { z } from 'zod'
import { getBusinessDomain } from './utils/domain'

const BRANDFETCH_API_KEY = '4aNIBty5gfr79P03bxmBBMDijq-TijRPGfRAxDZI2/14='
const LOGODEV_API_KEY = 'pk_MxyuUoAQTXSlNndFI3R6vg'

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
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return null
    }
    return url
  } catch (error) {
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
    return []
  }
}

async function fetchLogoFromLogoDev(domain: string, size: number): Promise<string | null> {
  const originalUrl = `https://img.logo.dev/${encodeURIComponent(domain)}?token=${LOGODEV_API_KEY}&size=${size}&format=png`
  const url = `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return null
    }
    return url
  } catch (error) {
    return null
  }
}

export async function fetchLogos(businessName: string, location?: google.maps.LatLng) {
  try {
    const domain = await getBusinessDomain(businessName, location)

    if (!domain) {
      return []
    }

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

    return allLogos
  } catch (error) {
    return []
  }
}

// Example edit handler for logo overlays
export async function editLogoOverlay(overlay, updates) {
  const updatedOverlay = {
    ...overlay,
    properties: {
      ...(overlay.properties ?? {}),
      ...(updates ?? {}),
      width: (overlay.properties?.width ?? updates?.width ?? 200),
      height: (overlay.properties?.height ?? updates?.height ?? 200),
    }
  }
  return updatedOverlay;
}

// Example edit handler for group overlays
export async function editGroupOverlay(overlay, updates) {
  const updatedOverlay = {
    ...overlay,
    properties: {
      ...(overlay.properties ?? {}),
      ...(updates ?? {}),
      width: (overlay.properties?.width ?? updates?.width ?? 200),
      height: (overlay.properties?.height ?? updates?.height ?? 200),
    }
  }
  return updatedOverlay;
}

// Example edit handler for text overlays
export async function editTextOverlay(overlay, updates) {
  const updatedOverlay = {
    ...overlay,
    properties: {
      ...(overlay.properties ?? {}),
      ...(updates ?? {}),
      width: (overlay.properties?.width ?? updates?.width ?? 200),
      height: (overlay.properties?.height ?? updates?.height ?? 200),
    }
  }
  return updatedOverlay;
}

// Add a log for all overlay updates
export function logOverlayUpdate(action, overlay) {
  console.log(`[Brandfetch] Overlay update: ${action}`, { overlayId: overlay.id, overlay });
}