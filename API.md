# Retailer Map API Documentation

## Overview

The Retailer Map API enables seamless integration of interactive maps into external applications through both iframe embedding and programmatic access. The API provides secure, performant, and customizable map functionality.

## Authentication

All API requests require authentication using either:
- API Key (for programmatic access)
- Session token (for authenticated users)

```typescript
// Using API key
const headers = {
  'Authorization': `Bearer ${API_KEY}`
}

// Using session token
const headers = {
  'Authorization': `Bearer ${sessionToken}`
}
```

## Endpoints

### Map Iframe

```
GET /api/maps/{id}/iframe
```

Embeds a map in an iframe with customizable options.

Query Parameters:
- `width` (number, default: 800): Width in pixels
- `height` (number, default: 600): Height in pixels
- `interactive` (boolean, default: true): Enable map interaction
- `controls` (boolean, default: true): Show map controls
- `style` (string, optional): Map style preset
- `zoom` (number, optional): Initial zoom level

Response:
- Content-Type: text/html
- X-Frame-Options: SAMEORIGIN

Example:
```html
<iframe 
  src="/api/maps/abc123/iframe?width=800&height=600&interactive=true" 
  width="800" 
  height="600" 
  frameborder="0" 
  allowfullscreen
></iframe>
```

### Map Data

```
GET /api/maps/{id}
```

Retrieves map data for programmatic usage.

Response:
```typescript
interface MapResponse {
  id: string
  title: string
  center_lat: number
  center_lng: number
  zoom_level: number
  overlays: MapOverlay[]
  subject_property: SubjectProperty | null
  mapStyle?: MapStyle
  created_at: string
  updated_at: string
}
```

### Map Screenshot

```
GET /api/maps/{id}/screenshot
```

Generates a static image of the map.

Query Parameters:
- `width` (number, default: 1200): Image width
- `height` (number, default: 630): Image height
- `format` (string, default: 'png'): Image format (png/jpeg)
- `quality` (number, default: 90): Image quality (1-100)

Response:
- Content-Type: image/png or image/jpeg

## Client Library

### Installation

```bash
npm install @retailer-map/client
```

### Usage

```typescript
import { RetailerMap } from '@retailer-map/client'

const map = new RetailerMap({
  apiKey: 'your_api_key',
  container: document.getElementById('map')
})

// Load map data
await map.load('map_id')

// Add overlay
await map.addOverlay({
  type: 'business',
  position: { lat: 40.7128, lng: -74.0060 },
  properties: {
    businessName: 'Example Business',
    logo: 'https://example.com/logo.png'
  }
})

// Save changes
await map.save()
```

## React Component

### Installation

```bash
npm install @retailer-map/react
```

### Usage

```tsx
import { MapEmbed } from '@retailer-map/react'

function App() {
  return (
    <MapEmbed
      mapId="abc123"
      width={800}
      height={600}
      interactive={true}
      showControls={true}
      onLoad={() => console.log('Map loaded')}
      onError={(error) => console.error('Map error:', error)}
    />
  )
}
```

## Data Types

### Map Overlay

```typescript
interface MapOverlay {
  id: string
  type: 'image' | 'text' | 'business' | 'group' | 'shape'
  position: {
    lat: number
    lng: number
  }
  properties: {
    // Common properties
    width?: number
    draggable?: boolean
    zIndex?: number
    
    // Type-specific properties
    url?: string
    content?: string
    businessName?: string
    logo?: string
    
    // Style properties
    containerStyle?: {
      backgroundColor: string
      borderColor: string
      borderWidth: number
      padding: number
      backgroundOpacity: number
      borderOpacity: number
    }
  }
}
```

### Map Style

```typescript
interface MapStyle {
  type: 'default' | 'light' | 'dark' | 'retro' | 'silver' | 'night'
  hideLabels?: boolean
  hideStreetNames?: boolean
  hideHighwayLabels?: boolean
  hideAreaLabels?: boolean
  hideBusinessLabels?: boolean
  hideTransitLabels?: boolean
  hideWaterLabels?: boolean
  highlightHighways?: {
    color: string
    weight: number
  }
  customStyles?: google.maps.MapTypeStyle[]
}
```

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages:

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
  }
}
```

Common error codes:
- `invalid_request`: Malformed request
- `authentication_required`: Missing or invalid authentication
- `permission_denied`: Insufficient permissions
- `resource_not_found`: Map not found
- `rate_limit_exceeded`: Too many requests
- `internal_error`: Server error

## Rate Limits

Default limits per API key:
- 100 requests/minute
- 1,000 requests/hour
- 10,000 requests/day

Contact support for higher limits.

## Security

1. Authentication
   - API key validation
   - JWT session tokens
   - CORS restrictions

2. Data Protection
   - Input validation
   - SQL injection prevention
   - XSS protection

3. Headers
   - X-Frame-Options: SAMEORIGIN
   - Content-Security-Policy
   - X-Content-Type-Options: nosniff

## Best Practices

1. Performance
   - Use appropriate map dimensions
   - Limit overlay count
   - Enable caching
   - Compress responses

2. Error Handling
   - Implement retry logic
   - Add error boundaries
   - Log errors properly
   - Show user feedback

3. Security
   - Validate input
   - Sanitize output
   - Use HTTPS
   - Rotate API keys

## Support

- Documentation: https://docs.retailermap.com
- API Status: https://status.retailermap.com
- Email: api@retailermap.com
- Discord: https://discord.gg/retailermap

## Changelog

### v1.1.0
- Added map screenshot endpoint
- Improved error handling
- Added rate limiting
- Enhanced security headers

### v1.0.0
- Initial release
- Basic iframe embedding
- Map data structure
- Security implementation