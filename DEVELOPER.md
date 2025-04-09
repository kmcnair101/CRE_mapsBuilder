# Retailer Map Integration Guide

## Overview

The Retailer Map solution is a powerful mapping tool designed for businesses to create and manage interactive maps with custom overlays, business locations, and styled visualizations.

## Features

- 🗺️ Interactive Google Maps integration
- 🏢 Business location markers with logos
- 📝 Custom text overlays
- 🖼️ Image overlays
- 🎨 Multiple map styles with customization
- 🏷️ Label controls
- 🛣️ Highway highlighting
- 📍 Subject property management
- 🔄 Drag and drop positioning
- ↔️ Resizable overlays
- 💾 Map state persistence
- 📸 Map screenshot functionality
- 🔌 API for embedding maps

## Prerequisites

- Google Maps API Key with enabled services:
  - Maps JavaScript API
  - Places API
  - Geocoding API
- Supabase account and project
- Node.js 16+
- React 18+

## Installation

1. Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd retailer-map
npm install
```

2. Set up environment variables in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

3. Set up the database schema in Supabase using the provided migration files in `/supabase/migrations`.

## Integration Steps

1. Initialize the map component:
```tsx
import { MapEditor } from './components/MapEditor'

function App() {
  return (
    <div className="h-screen">
      <MapEditor />
    </div>
  )
}
```

2. Set up authentication:
```tsx
import { useAuthStore } from '@/stores/auth'

// In your component
const { user, signIn, signUp } = useAuthStore()
```

3. Handle map operations:
```tsx
// Add business location
const handleBusinessAdd = (business: {
  name: string
  address: string
  location: google.maps.LatLng
  logo?: string
}) => {
  // Implementation
}

// Add text overlay
const handleTextAdd = (text: string, style: {
  color: string
  fontSize: number
  fontFamily: string
  backgroundColor: string
  borderColor: string
  borderWidth: number
  padding: number
  backgroundOpacity: number
  borderOpacity: number
}) => {
  // Implementation
}

// Save map
const handleSave = async () => {
  // Implementation
}
```

## API Integration

1. Embed maps using iframe:
```html
<iframe 
  src="/api/maps/{mapId}/iframe?width=800&height=600" 
  width="800" 
  height="600" 
  frameborder="0" 
  allowfullscreen
></iframe>
```

2. Use the React component:
```tsx
import { MapEmbed } from '@/components/MapEmbed'

function App() {
  return (
    <MapEmbed
      mapId="your-map-id"
      width={800}
      height={600}
      interactive={true}
      showControls={true}
    />
  )
}
```

3. Programmatic usage:
```typescript
import { createMapIframe } from '@/lib/api/mapIframe'

const container = document.getElementById('map')
const mapData = await fetchMapData(mapId)

const { map, centerMap, downloadMap } = await createMapIframe({
  width: 800,
  height: 600,
  mapData,
  container,
  interactive: true,
  showControls: true
})
```

## Best Practices

1. Performance
   - Use connection pooling for database access
   - Implement proper memoization
   - Optimize overlay rendering

2. Security
   - Validate user input
   - Use parameterized queries
   - Implement proper access control

3. Error Handling
   - Implement error boundaries
   - Provide meaningful error messages
   - Log errors appropriately

4. Accessibility
   - Ensure keyboard navigation
   - Add ARIA labels
   - Maintain proper contrast

## Common Issues

1. Map not loading
   - Verify API key
   - Check container height
   - Ensure proper initialization

2. Overlay issues
   - Verify overlay creation
   - Check event handlers
   - Inspect DOM structure

3. Style issues
   - Validate style object
   - Check application timing
   - Verify map instance state

## Testing

1. Component Testing
```typescript
describe('MapEditor', () => {
  it('should render correctly', () => {
    // Test implementation
  })
})
```

2. Integration Testing
```typescript
describe('Map Operations', () => {
  it('should add overlay correctly', () => {
    // Test implementation
  })
})
```

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the built files to your hosting service.

3. Ensure environment variables are set in your production environment.

## Support

For issues and feature requests, please use the GitHub issue tracker or contact support@example.com.