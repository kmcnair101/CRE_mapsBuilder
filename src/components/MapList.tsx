import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MoreVertical, Edit, Download, Trash2, MapPin, ArrowUpDown, ExternalLink, Search, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useMapDownload } from '@/lib/map/hooks/useMapDownload'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import { useSubscription } from '@/hooks/useSubscription'
import { PricingPlans } from './pricing/PricingPlans'
import { DeleteMapModal } from './modals/DeleteMapModal'
import { loader } from '@/lib/google-maps'
import { Loader } from '@googlemaps/js-api-loader'
import { createCustomImageOverlay, createCustomTextOverlay } from '@/lib/map/utils/customOverlays'
import { createBusinessLogoOverlay } from '@/lib/map/overlays/BusinessLogoOverlay'
import { createGroupOverlay } from '@/lib/map/overlays/GroupOverlay'
import { createShapeOverlay } from '@/lib/map/overlays/ShapeOverlay'
import { createDeleteButton, createEditButton, createResizeHandle } from '@/lib/map/utils/overlayControls'

type Map = Database['public']['Tables']['maps']['Row']
type SortOption = 'updated_at' | 'created_at' | 'title'

function MapPreview({ 
  center_lat, 
  center_lng, 
  zoom_level,
  mapStyle,
  overlays = [],
  subject_property,
  className 
}: { 
  center_lat: number
  center_lng: number
  zoom_level: number
  mapStyle?: any
  overlays?: any[]
  subject_property?: any
  className?: string
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const overlayRefs = useRef<any[]>([])

  useEffect(() => {
    if (!mapRef.current) return

    let mapInstance: google.maps.Map | null = null

    loader.load().then(() => {
      console.log('[MapPreview] Creating scaled preview map:', {
        center: { lat: center_lat, lng: center_lng },
        zoom: zoom_level,
        overlayCount: overlays.length,
        hasSubjectProperty: !!subject_property
      })

      // Calculate zoomed-out level for preview
      const previewZoom = Math.max(zoom_level - 1.2, 8) // Zoom out by 1.5 levels, minimum zoom 8
      const zoomReduction = zoom_level - previewZoom
      
      // Calculate scale factor based on zoom reduction
      // Each zoom level is roughly 2x scale change, so 2^zoomReduction gives us the scale factor
      const scaleFactor = Math.pow(0.5, zoomReduction) // 0.5^2 = 0.25 for 2 zoom levels out
      
      console.log('[MapPreview] Using preview zoom with scaling:', {
        originalZoom: zoom_level,
        previewZoom: previewZoom,
        zoomReduction: zoomReduction,
        scaleFactor: scaleFactor
      })

      // Create the map with zoomed-out view
      mapInstance = new google.maps.Map(mapRef.current!, {
        center: { lat: center_lat, lng: center_lng },
        zoom: previewZoom, // Use reduced zoom level
        disableDefaultUI: true,
        styles: Array.isArray(mapStyle)
          ? mapStyle
          : (mapStyle?.customStyles || []),
        gestureHandling: 'none',
        draggable: false,
        clickableIcons: false,
        zoomControl: false,
        streetViewControl: false,
        fullscreenControl: false
      })

      // Remove old overlays
      overlayRefs.current.forEach((ov) => {
        if (ov.setMap) ov.setMap(null)
      })
      overlayRefs.current = []

      const map = mapInstance as google.maps.Map

      // Replace the overlay creation section with this improved version that forces scaling:

      overlays.forEach((overlay, index) => {
        console.log(`[MapPreview] Adding scaled overlay ${index + 1}/${overlays.length}:`, {
          type: overlay.type,
          position: overlay.position,
          scaleFactor: scaleFactor
        })

        switch (overlay.type) {
          case 'image': {
            const originalWidth = overlay.properties.width || 200
            const scaledWidth = Math.max(20, originalWidth * scaleFactor)
            const originalPadding = overlay.properties.containerStyle?.padding || 8
            const scaledPadding = Math.max(2, originalPadding * scaleFactor)
            const originalBorderWidth = overlay.properties.containerStyle?.borderWidth || 1
            const scaledBorderWidth = Math.max(0.5, originalBorderWidth * scaleFactor)

            const imageOverlay = createCustomImageOverlay(
              {
                position: new google.maps.LatLng(overlay.position.lat, overlay.position.lng),
                url: overlay.properties.url || '',
                width: scaledWidth,
                style: {
                  backgroundColor: overlay.properties.containerStyle?.backgroundColor || '#FFFFFF',
                  borderColor: overlay.properties.containerStyle?.borderColor || '#000000',
                  borderWidth: scaledBorderWidth,
                  padding: scaledPadding,
                  backgroundOpacity: overlay.properties.containerStyle?.backgroundOpacity || 1,
                  borderOpacity: overlay.properties.containerStyle?.borderOpacity || 1
                }
              },
              map,
              () => {},
              () => {},
              () => {},
              () => {},
              () => {}
            )
            overlayRefs.current.push(imageOverlay)
            break
          }
          case 'business': {
            const originalWidth = overlay.properties.width || 200
            const scaledWidth = Math.max(30, originalWidth * scaleFactor)
            const originalFontSize = overlay.properties.containerStyle?.fontSize || 14
            const scaledFontSize = Math.max(8, originalFontSize * scaleFactor)
            const originalPadding = overlay.properties.containerStyle?.padding || 8
            const scaledPadding = Math.max(2, originalPadding * scaleFactor)

            // Create a modified overlay object with forced scaled properties
            const scaledBusinessOverlay = {
              ...overlay,
              properties: {
                ...overlay.properties,
                width: scaledWidth,
                containerStyle: {
                  ...overlay.properties.containerStyle,
                  fontSize: scaledFontSize,
                  padding: scaledPadding,
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)'
                }
              }
            }

            console.log(`[MapPreview] Business overlay ${index} forced scaling:`, {
              originalWidth,
              scaledWidth,
              originalFontSize,
              scaledFontSize,
              originalPadding,
              scaledPadding,
              scaledOverlay: scaledBusinessOverlay
            })

            const businessOverlay = createBusinessLogoOverlay(
              {
                position: new google.maps.LatLng(overlay.position.lat, overlay.position.lng),
                logo: overlay.properties.logo || '',
                businessName: overlay.properties.businessName || '',
                width: scaledWidth,
                // Force the scaled styles
                style: {
                  fontSize: `${scaledFontSize}px`,
                  padding: `${scaledPadding}px`,
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)',
                  // Include any other original styles but override the scaled ones
                  ...overlay.properties.containerStyle,
                  fontSize: `${scaledFontSize}px`, // Force override
                  padding: `${scaledPadding}px`, // Force override
                }
              },
              map,
              () => {},
              () => {},
              () => {},
              () => {},
              () => {}
            )
            overlayRefs.current.push(businessOverlay)
            break
          }
          case 'text': {
            const originalFontSize = overlay.properties.fontSize || 14
            const scaledFontSize = Math.max(8, originalFontSize * scaleFactor)
            const originalPadding = overlay.properties.padding || 8
            const scaledPadding = Math.max(2, originalPadding * scaleFactor)
            const originalBorderWidth = overlay.properties.borderWidth || 1
            const scaledBorderWidth = Math.max(0.5, originalBorderWidth * scaleFactor)

            // Create a completely new overlay object with forced scaled properties
            const scaledTextOverlay = {
              ...overlay,
              properties: {
                ...overlay.properties,
                fontSize: scaledFontSize, // Force scaled font size
                padding: scaledPadding, // Force scaled padding
                borderWidth: scaledBorderWidth, // Force scaled border
                // Ensure these are applied
                style: {
                  ...overlay.properties.style,
                  fontSize: `${scaledFontSize}px`,
                  padding: `${scaledPadding}px`,
                  borderWidth: `${scaledBorderWidth}px`
                }
              }
            }

            console.log(`[MapPreview] Text overlay ${index} forced scaling:`, {
              originalFontSize,
              scaledFontSize,
              originalPadding,
              scaledPadding,
              originalBorderWidth,
              scaledBorderWidth,
              scaledOverlay: scaledTextOverlay
            })

            const textOverlay = createCustomTextOverlay(
              scaledTextOverlay, // Pass the modified overlay object
              map,
              () => {},
              () => {},
              () => {},
              () => {},
              () => {}
            )
            overlayRefs.current.push(textOverlay)
            break
          }
          case 'group': {
            const originalFontSize = overlay.properties.fontSize || 14
            const scaledFontSize = Math.max(8, originalFontSize * scaleFactor)
            const originalPadding = overlay.properties.padding || 8
            const scaledPadding = Math.max(2, originalPadding * scaleFactor)
            const originalBorderWidth = overlay.properties.borderWidth || 1
            const scaledBorderWidth = Math.max(0.5, originalBorderWidth * scaleFactor)

            // Create a completely new overlay object with forced scaled properties
            const scaledGroupOverlay = {
              ...overlay,
              properties: {
                ...overlay.properties,
                fontSize: scaledFontSize, // Force scaled font size
                padding: scaledPadding, // Force scaled padding
                borderWidth: scaledBorderWidth, // Force scaled border
                // Ensure these are applied
                style: {
                  ...overlay.properties.style,
                  fontSize: `${scaledFontSize}px`,
                  padding: `${scaledPadding}px`,
                  borderWidth: `${scaledBorderWidth}px`
                }
              }
            }

            console.log(`[MapPreview] Group overlay ${index} forced scaling:`, {
              originalFontSize,
              scaledFontSize,
              originalPadding,
              scaledPadding,
              originalBorderWidth,
              scaledBorderWidth,
              scaledOverlay: scaledGroupOverlay
            })

            const groupOverlay = createGroupOverlay(
              scaledGroupOverlay, // Pass the modified overlay object
              map,
              () => {},
              () => {},
              () => {},
              () => {},
              () => {}
            )
            overlayRefs.current.push(groupOverlay)
            break
          }
          case 'shape': {
            const originalStrokeWeight = overlay.properties.strokeWeight || 2
            const scaledStrokeWeight = Math.max(1, originalStrokeWeight * scaleFactor)

            const scaledShapeOverlay = {
              ...overlay,
              properties: {
                ...overlay.properties,
                strokeWeight: scaledStrokeWeight
              }
            }

            console.log(`[MapPreview] Shape overlay ${index} forced scaling:`, {
              originalStrokeWeight,
              scaledStrokeWeight,
              scaledOverlay: scaledShapeOverlay
            })

            const shapeOverlay = createShapeOverlay(
              scaledShapeOverlay,
              map,
              () => {},
              () => {},
              () => {}
            )
            overlayRefs.current.push(shapeOverlay)
            break
          }
          default:
            console.warn(`[MapPreview] Unknown overlay type: ${overlay.type}`)
        }
      })

      // Add subject property overlay with scaled styling
      if (subject_property?.lat && subject_property?.lng) {
        const style = subject_property.style || {};
        const position = new google.maps.LatLng(subject_property.lat, subject_property.lng);

        const originalFontSize = style.fontSize || 14
        const scaledFontSize = Math.max(8, originalFontSize * scaleFactor) // Min 8px
        const originalPadding = style.padding || 8
        const scaledPadding = Math.max(2, originalPadding * scaleFactor) // Min 2px
        const originalBorderWidth = style.borderWidth || 1
        const scaledBorderWidth = Math.max(0.5, originalBorderWidth * scaleFactor) // Min 0.5px

        console.log('[MapPreview] Adding scaled subject property:', {
          name: subject_property.name,
          position: { lat: subject_property.lat, lng: subject_property.lng },
          scaleFactor: scaleFactor,
          scaledValues: {
            fontSize: `${originalFontSize}px -> ${scaledFontSize}px`,
            padding: `${originalPadding}px -> ${scaledPadding}px`,
            borderWidth: `${originalBorderWidth}px -> ${scaledBorderWidth}px`
          }
        })

        class PreviewSubjectPropertyOverlay extends google.maps.OverlayView {
          div: HTMLDivElement | null = null;
          
          onAdd() {
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.display = 'flex';
            div.style.justifyContent = 'center';
            div.style.alignItems = 'center';

            const contentDiv = document.createElement('div');
            contentDiv.style.position = 'relative';
            contentDiv.style.minWidth = 'min-content';
            contentDiv.style.maxWidth = `${Math.max(100, 400 * scaleFactor)}px`; // Scaled max width
            contentDiv.style.backgroundColor = style.backgroundColor || '#FFFFFF';
            contentDiv.style.border = `${scaledBorderWidth}px solid ${style.borderColor || '#000000'}`; // Scaled border
            contentDiv.style.padding = `${scaledPadding}px`; // Scaled padding
            contentDiv.style.borderRadius = `${Math.max(1, 4 * scaleFactor)}px`; // Scaled border radius
            contentDiv.style.boxSizing = 'border-box';
            contentDiv.style.color = style.color || '#000000';
            contentDiv.style.fontSize = `${scaledFontSize}px`; // Scaled font size
            contentDiv.style.fontFamily = style.fontFamily || 'Arial';
            contentDiv.style.fontWeight = style.fontWeight || 'normal';
            contentDiv.style.textAlign = 'center';
            contentDiv.style.whiteSpace = 'pre';
            contentDiv.style.display = 'inline-block';
            contentDiv.innerHTML = subject_property.name || '';

            div.appendChild(contentDiv);
            this.div = div;
            this.getPanes()?.overlayLayer.appendChild(div);
          }
          
          draw() {
            if (!this.div) return;
            const overlayProjection = this.getProjection();
            const pos = overlayProjection.fromLatLngToDivPixel(position);
            if (pos) {
              const width = this.div.offsetWidth;
              const height = this.div.offsetHeight;
              this.div.style.left = `${pos.x - width / 2}px`;
              this.div.style.top = `${pos.y - height / 2}px`;
            }
          }
          
          onRemove() {
            if (this.div && this.div.parentNode) {
              this.div.parentNode.removeChild(this.div);
            }
            this.div = null;
          }
        }

        const overlay = new PreviewSubjectPropertyOverlay();
        overlay.setMap(map);
        overlayRefs.current.push(overlay);
      }

      console.log('[MapPreview] Preview map created successfully with scaling:', {
        totalOverlays: overlayRefs.current.length,
        mapCenter: { lat: center_lat, lng: center_lng },
        mapZoom: previewZoom,
        scaleFactor: scaleFactor
      })
    })

    return () => {
      overlayRefs.current.forEach(ov => {
        if (ov.setMap) ov.setMap(null)
      })
      overlayRefs.current = []
    }
  }, [center_lat, center_lng, zoom_level, mapStyle, overlays, subject_property])

  return (
    <div ref={mapRef} className={className} />
  )
}

export function MapList() {
  const { profile } = useAuthStore()
  const [maps, setMaps] = useState<Map[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('updated_at')
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const [downloadingMap, setDownloadingMap] = useState<string | null>(null)
  const [activeMapMenu, setActiveMapMenu] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const { downloadMapFromData } = useMapDownload()
  const { hasAccess } = useSubscription()
  const [showPricingPlans, setShowPricingPlans] = useState(false)
  const [mapToDelete, setMapToDelete] = useState<string | null>(null)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadMaps() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('maps')
          .select('*')
          .order(sortBy, { ascending: sortBy === 'title' })

        if (error) throw error
        setMaps(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load maps')
      } finally {
        setLoading(false)
      }
    }

    loadMaps()
  }, [sortBy])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMapMenu) {
        const menuRef = menuRefs.current[activeMapMenu]
        if (menuRef && !menuRef.contains(event.target as Node)) {
          setActiveMapMenu(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeMapMenu])

  const handleDelete = async (id: string) => {
    setMapToDelete(id)
  }

  const handleDeleteConfirm = async () => {
    if (!mapToDelete) return
    
    try {
      const { error } = await supabase
        .from('maps')
        .delete()
        .eq('id', mapToDelete)

      if (error) throw error
      setMaps(maps.filter(map => map.id !== mapToDelete))
      setActiveMapMenu(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete map')
    } finally {
      setMapToDelete(null)
    }
  }

  const handleMapDownload = async (mapId: string) => {
    if (!hasAccess()) {
      setShowPricingPlans(true)
      setActiveMapMenu(null)
      return
    }

    try {
      setDownloadingMap(mapId)
      setActiveMapMenu(null)
      
      const { data, error } = await supabase
        .from('maps')
        .select('*')
        .eq('id', mapId)
        .single()

      if (error) throw error

      await downloadMapFromData({
        title: data.title,
        center_lat: data.center_lat,
        center_lng: data.center_lng,
        zoom_level: data.zoom_level,
        overlays: data.overlays as any[] || [],
        subject_property: data.subject_property as any,
        mapStyle: data.map_style as any
      }, `${data.title || 'map'}.png`)

      if (data) {
        const res = await fetch('/api/create-portal-link', {
          method: 'POST',
          body: JSON.stringify({ userId: profile.id }),
        })
        const json = await res.json()
        if (json?.url) setPortalUrl(json.url)
      }
    } catch (error) {
      alert('Failed to download map. Please try again.')
    } finally {
      setDownloadingMap(null)
    }
  }

  const toggleMenu = (id: string) => {
    setActiveMapMenu(activeMapMenu === id ? null : id)
  }

  const filteredMaps = maps.filter(map => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (map.title && map.title.toLowerCase().includes(searchLower)) ||
      (map.description && map.description.toLowerCase().includes(searchLower)) ||
      ((map.subject_property as any)?.address && 
        (map.subject_property as any).address.toLowerCase().includes(searchLower)) ||
      ((map.subject_property as any)?.name && 
        (map.subject_property as any).name.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-md">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">My Maps</h1>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search maps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
              />
            </div>
            
            <div className="flex gap-3">
              <Link
                to="/maps/new/address"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Map
              </Link>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sortBy === 'updated_at' ? 'Last modified' : sortBy === 'created_at' ? 'Date created' : 'Name'}
                </button>
                
                {isSortMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setIsSortMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                      <div className="py-1" role="menu">
                        <button
                          className={cn(
                            'block w-full text-left px-4 py-2 text-sm',
                            sortBy === 'updated_at' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                          )}
                          onClick={() => {
                            setSortBy('updated_at')
                            setIsSortMenuOpen(false)
                          }}
                        >
                          Last modified
                        </button>
                        <button
                          className={cn(
                            'block w-full text-left px-4 py-2 text-sm',
                            sortBy === 'created_at' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                          )}
                          onClick={() => {
                            setSortBy('created_at')
                            setIsSortMenuOpen(false)
                          }}
                        >
                          Date created
                        </button>
                        <button
                          className={cn(
                            'block w-full text-left px-4 py-2 text-sm',
                            sortBy === 'title' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                          )}
                          onClick={() => {
                            setSortBy('title')
                            setIsSortMenuOpen(false)
                          }}
                        >
                          Name
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {filteredMaps.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No maps found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try a different search term or' : 'Get started by'} creating a new map.
            </p>
            <div className="mt-6">
              <Link
                to="/maps/new/address"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Map
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaps.map((map) => {
              const subjectProperty = map.subject_property as any;
              return (
                <div
                  key={map.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <div className="relative">
                    {/* Map Preview */}
                    <Link to={`/maps/${map.id}`} className="block">
                      <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                        {map.thumbnail ? (
                          <img
                            src={map.thumbnail}
                            alt={map.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <MapPreview
                            center_lat={map.center_lat}
                            center_lng={map.center_lng}
                            zoom_level={map.zoom_level}
                            mapStyle={map.map_style}
                            overlays={map.overlays}
                            subject_property={map.subject_property ? {
                              lat: map.subject_property.lat,
                              lng: map.subject_property.lng,
                              name: map.subject_property.name,
                              style: {
                                backgroundColor: map.subject_property.style?.backgroundColor,
                                backgroundOpacity: map.subject_property.style?.backgroundOpacity,
                                borderColor: map.subject_property.style?.borderColor,
                                borderWidth: map.subject_property.style?.borderWidth,
                                color: map.subject_property.style?.color,
                                fontSize: map.subject_property.style?.fontSize,
                                fontFamily: map.subject_property.style?.fontFamily,
                                fontWeight: map.subject_property.style?.fontWeight
                              }
                            } : undefined}
                            className="w-full h-full"
                          />
                        )}
                        
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2 shadow-lg">
                            <ExternalLink className="h-5 w-5 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    {/* Menu button */}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => toggleMenu(map.id)}
                        className="p-1.5 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 shadow-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {/* Dropdown menu */}
                      {activeMapMenu === map.id && (
                        <div 
                          ref={el => menuRefs.current[map.id] = el}
                          className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20"
                        >
                          <div className="py-1" role="menu">
                            <Link
                              to={`/maps/${map.id}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4 mr-3 text-gray-500" />
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(map.id)}
                              className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              <Trash2 className="h-4 w-4 mr-3 text-red-500" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 line-clamp-1">{map.title}</h3>
                      {subjectProperty?.name && subjectProperty.name !== 'Subject Property' && (
                        <p className="text-sm text-gray-600 font-medium mt-1 line-clamp-1">
                        {subjectProperty.name.replace(/<[^>]+>/g, '')}
                      </p>
                      )}
                      {subjectProperty?.address && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {subjectProperty.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <DeleteMapModal
        open={!!mapToDelete}
        onCancel={() => setMapToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
      <PricingPlans 
        isOpen={showPricingPlans} 
        onClose={() => setShowPricingPlans(false)} 
      />
    </div>
  )
}