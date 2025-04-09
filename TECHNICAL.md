# Retailer Map Technical Documentation

## Architecture Overview

The Retailer Map solution follows a modular architecture with clear separation of concerns:

### Core Components

1. Map Editor (`src/components/MapEditor.tsx`)
   - Map initialization and state management
   - Overlay coordination
   - Save/load functionality
   - Screenshot generation

2. Map Controls (`src/components/MapControls.tsx`)
   - Business location addition
   - Text overlay creation
   - Image overlay upload
   - Map style customization

3. Custom Overlays
   - Business Logo Overlay
   - Text Overlay
   - Image Overlay
   - Group Overlay
   - Shape Overlay

### API Components

1. Map Iframe API (`src/lib/api/mapIframe.ts`)
   - Iframe creation and configuration
   - Map instance management
   - Overlay rendering
   - Download functionality

2. Iframe Endpoint (`src/pages/api/maps/[id]/iframe.ts`)
   - Map data retrieval
   - HTML generation
   - Security headers
   - Error handling

3. Map Embed Component (`src/components/MapEmbed.tsx`)
   - Iframe integration
   - Copy-to-clipboard functionality
   - Responsive design
   - Configuration options

## Data Flow

1. Map Creation:
```
User Input -> MapControls -> MapEditor -> Database
```

2. Map Embedding:
```
API Request -> Iframe Endpoint -> Map Creation -> Rendered Map
```

3. Map Updates:
```
Edit Action -> State Update -> Visual Update -> Database Sync
```

## State Management

### Map Data Structure
```typescript
interface MapData {
  title: string
  center_lat: number
  center_lng: number
  zoom_level: number
  overlays: MapOverlay[]
  subject_property: SubjectProperty | null
  mapStyle?: MapStyle
}
```

### Overlay Management
```typescript
interface MapOverlay {
  id: string
  type: 'image' | 'text' | 'business' | 'group' | 'shape'
  position: Position
  properties: OverlayProperties
}
```

## Security Measures

1. Authentication
   - JWT-based auth
   - Role-based access
   - API key validation

2. Data Protection
   - Input validation
   - SQL injection prevention
   - XSS protection

3. API Security
   - Rate limiting
   - CORS policies
   - Security headers

## Performance Optimizations

1. Map Rendering
   - Efficient overlay management
   - Lazy loading
   - Canvas optimization

2. State Updates
   - Debounced updates
   - Batch processing
   - Memoization

3. API Responses
   - Response caching
   - Compression
   - Connection pooling

## Error Handling

1. Map Operations
```typescript
try {
  await mapOperation()
} catch (error) {
  handleMapError(error)
}
```

2. API Errors
```typescript
try {
  const response = await apiCall()
  handleSuccess(response)
} catch (error) {
  handleApiError(error)
}
```

## Testing Strategy

1. Unit Tests
   - Component testing
   - Utility function testing
   - State management testing

2. Integration Tests
   - API endpoint testing
   - Map functionality testing
   - Database operations testing

3. End-to-End Tests
   - User flow testing
   - Error scenario testing
   - Performance testing

## Deployment

1. Environment Setup
   - API key configuration
   - Database connection
   - Security settings

2. Build Process
   - Asset optimization
   - Code splitting
   - Environment variables

3. Monitoring
   - Error tracking
   - Performance metrics
   - Usage analytics

## Development Guidelines

1. Code Style
   - TypeScript strict mode
   - ESLint configuration
   - Prettier formatting

2. Git Workflow
   - Feature branches
   - Pull request reviews
   - Version tagging

3. Documentation
   - Code comments
   - API documentation
   - Change logs

## Troubleshooting

1. Common Issues
   - Map loading errors
   - Overlay rendering issues
   - API connection problems

2. Debugging Tools
   - Browser DevTools
   - Network monitoring
   - Error logging

3. Performance Issues
   - Memory leaks
   - Render optimization
   - API response times

## Future Enhancements

1. Features
   - Additional overlay types
   - Advanced styling options
   - Collaboration tools

2. Performance
   - WebGL rendering
   - Worker threads
   - Caching improvements

3. Integration
   - Additional APIs
   - Plugin system
   - Export options

## Support and Maintenance

1. Issue Tracking
   - Bug reports
   - Feature requests
   - Performance issues

2. Updates
   - Security patches
   - Feature updates
   - Dependency updates

3. Documentation
   - API changes
   - New features
   - Best practices