# Retailer Map

A powerful and customizable mapping solution for displaying and managing business locations, custom overlays, and styled maps.

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

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

3. Start the development server:
```bash
npm run dev
```

## Documentation

- [User Guide](USER_GUIDE.md) - Detailed guide for end users
- [Technical Documentation](TECHNICAL.md) - Technical details and architecture
- [API Documentation](API.md) - API reference and integration guide
- [Developer Guide](DEVELOPER.md) - Setup and development guidelines

## API Integration

Embed maps in your application:

```html
<iframe 
  src="https://your-domain.com/api/maps/{mapId}/iframe" 
  width="800" 
  height="600" 
  frameborder="0" 
  allowfullscreen
></iframe>
```

Or use the React component:

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

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT License

## Support

For support, please check:
- Documentation
- Issue tracker
- Community discussions