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

  useEffect(() => {
    if (!mapRef.current) {
      console.log('[MapPreview] Map container not ready')
      return
    }

    // Log initial container state
    console.log('[MapPreview] Container dimensions:', {
      width: mapRef.current.offsetWidth,
      height: mapRef.current.offsetHeight,
      className: mapRef.current.className
    })

    // Log initial props
    console.log('[MapPreview] Initial props:', {
      center: { lat: center_lat, lng: center_lng },
      zoom: zoom_level,
      mapStyle: mapStyle,
      overlaysCount: overlays.length,
      subjectProperty: subject_property
    })

    loader.load().then(() => {
      console.log('[MapPreview] Google Maps loaded')
      
      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: center_lat, lng: center_lng },
        zoom: zoom_level,
        disableDefaultUI: true,
        styles: Array.isArray(mapStyle)
          ? mapStyle
          : (mapStyle?.customStyles || []),
        gestureHandling: 'none',
        draggable: false,
        backgroundColor: '#f3f4f6',
        clickableIcons: false
      })

      // Log map instance creation
      console.log('[MapPreview] Map instance created:', {
        center: map.getCenter()?.toJSON(),
        zoom: map.getZoom(),
        bounds: map.getBounds()?.toJSON(),
        containerSize: {
          width: mapRef.current?.offsetWidth,
          height: mapRef.current?.offsetHeight
        }
      })

      // Add overlays
      console.log('[MapPreview] Starting overlay creation')
      overlays.forEach((overlay, index) => {
        console.log(`[MapPreview] Processing overlay ${index}:`, {
          type: overlay.type,
          position: overlay.position,
          properties: overlay.properties
        })

        if (overlay.type === 'text') {
          const textDiv = document.createElement('div')
          textDiv.className = 'map-text-overlay'
          textDiv.style.color = overlay.properties.color || '#000000'
          textDiv.style.fontSize = `${overlay.properties.fontSize || 14}px`
          textDiv.style.padding = `${overlay.properties.padding || 8}px`
          textDiv.innerHTML = overlay.properties.content

          const textOverlay = new google.maps.OverlayView()
          
          textOverlay.onAdd = function() {
            console.log(`[MapPreview] Text overlay ${index} onAdd called`)
            const panes = this.getPanes()!
            panes.overlayLayer.appendChild(textDiv)
          }

          textOverlay.draw = function() {
            const overlayProjection = this.getProjection()
            const position = overlayProjection.fromLatLngToDivPixel(
              new google.maps.LatLng(overlay.position.lat, overlay.position.lng)
            )!
            
            console.log(`[MapPreview] Text overlay ${index} draw called:`, {
              position: position?.toJSON(),
              content: overlay.properties.content,
              divStyle: textDiv.style.cssText
            })

            if (position) {
              textDiv.style.position = 'absolute'
              textDiv.style.left = `${position.x}px`
              textDiv.style.top = `${position.y}px`
              textDiv.style.transform = 'translate(-50%, -50%)'
            }
          }

          textOverlay.setMap(map)
          console.log(`[MapPreview] Text overlay ${index} added to map`)
        }
      })

      // Add subject property marker
      if (subject_property?.lat && subject_property?.lng) {
        console.log('[MapPreview] Adding subject property:', {
          position: { lat: subject_property.lat, lng: subject_property.lng },
          style: subject_property.style
        })

        const style = subject_property.style || {}
        const marker = new google.maps.Marker({
          map,
          position: { lat: subject_property.lat, lng: subject_property.lng },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: style.backgroundColor || '#FF0000',
            fillOpacity: style.backgroundOpacity ?? 1,
            strokeColor: style.borderColor || '#FFFFFF',
            strokeWeight: style.borderWidth ?? 2
          },
          label: subject_property.name ? {
            text: subject_property.name,
            color: style.color || '#000000',
            fontSize: `${style.fontSize || 14}px`,
            fontFamily: style.fontFamily || 'Arial'
          } : undefined
        })

        console.log('[MapPreview] Subject property marker created:', {
          position: marker.getPosition()?.toJSON(),
          label: marker.getLabel()
        })
      }

      // Add map state change listener
      google.maps.event.addListenerOnce(map, 'idle', () => {
        console.log('[MapPreview] Map idle state:', {
          center: map.getCenter()?.toJSON(),
          zoom: map.getZoom(),
          bounds: map.getBounds()?.toJSON(),
          containerSize: {
            width: mapRef.current?.offsetWidth,
            height: mapRef.current?.offsetHeight
          }
        })
      })

    }).catch(error => {
      console.error('[MapPreview] Error loading map:', error)
    })
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
      console.error('Error downloading map:', error)
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
              console.log('[MapList] Preview map object:', map)
              console.log('[MapList] Preview map data:', {
                id: map.id,
                title: map.title,
                center_lat: map.center_lat,
                center_lng: map.center_lng,
                zoom_level: map.zoom_level,
                overlays: map.overlays,
                map_style: map.map_style,
              })

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
                            subject_property={map.subject_property}
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
                            {/* 
                            <button
                              onClick={() => handleMapDownload(map.id)}
                              disabled={downloadingMap === map.id}
                              className={cn(
                                "flex items-center w-full text-left px-4 py-2 text-sm",
                                hasAccess() 
                                  ? "text-gray-700 hover:bg-gray-100" 
                                  : "text-gray-400 cursor-not-allowed"
                              )}
                            >
                              
                              {downloadingMap === map.id ? (
                                <>
                                  <div className="animate-spin h-4 w-4 mr-3 border-b-2 border-gray-600 rounded-full" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  {hasAccess() ? (
                                    <Download className="h-4 w-4 mr-3 text-gray-500" />
                                  ) : (
                                    <Lock className="h-4 w-4 mr-3 text-gray-500" />
                                  )}
                                  <span>Download</span>
                                </>
                              )}
                            </button>
                            */}
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