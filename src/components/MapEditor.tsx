import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Save, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase/client'
import { MapControls } from './MapControls'
import { useMapInitialization } from '@/lib/map/hooks/useMapInitialization'
import { useMapOverlays } from '@/lib/map/hooks/useMapOverlays'
import { useMapDownload } from '@/lib/map/hooks/useMapDownload'
import { DownloadButton } from './DownloadButton'
import { DeleteMapModal } from './modals/DeleteMapModal'
import { cn } from '@/lib/utils'
import type { MapData, MapOverlay, MapStyleName } from '@/lib/types'
import { useMapStyle } from '@/lib/map/hooks/useMapStyle'
import { DownloadMapModal } from './modals/DownloadMapModal'
import { PricingPlans } from './pricing/PricingPlans'
import { useSubscription } from '@/hooks/useSubscription'

const calculateLogoDimensions = (naturalWidth: number, naturalHeight: number) => {
  // Define maximum dimensions
  const MAX_WIDTH = 200;
  const MAX_HEIGHT = 200;

  // Calculate aspect ratio
  const aspectRatio = naturalWidth / naturalHeight;

  let width = naturalWidth;
  let height = naturalHeight;

  // If width is greater than max width, scale down
  if (width > MAX_WIDTH) {
    width = MAX_WIDTH;
    height = width / aspectRatio;
  }

  // If height is still greater than max height, scale down again
  if (height > MAX_HEIGHT) {
    height = MAX_HEIGHT;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
};

export default function MapEditor() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const mapRef = useRef<HTMLDivElement>(null)

  const { hasAccess } = useSubscription(); // <-- ADD THIS LINE

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [activeDrawingShape, setActiveDrawingShape] = useState<'rect' | 'circle' | 'polygon' | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [downloadWidth, setDownloadWidth] = useState(1280)
  const [downloadHeight, setDownloadHeight] = useState(720)
  const [showPricingPlans, setShowPricingPlans] = useState(false)

  const [mapData, setMapData] = useState<MapData>(() => {
    return {
      title: location.state?.subject_property?.name || 
              location.state?.subject_property?.address || 
              'New Map',
      center_lat: location.state?.center_lat || 40.7128,
      center_lng: location.state?.center_lng || -74.0060,
      zoom_level: location.state?.zoom_level || 12,
      overlays: location.state?.overlays || [],
      subject_property: location.state?.subject_property || null,
      mapStyle: location.state?.mapStyle
    }
  })

  useEffect(() => {
    const checkForSavedState = () => {
      const pendingMapId = localStorage.getItem('pendingMapId')
      const pendingEdits = localStorage.getItem('pendingMapEdits')
      
      if (pendingMapId === id && pendingEdits) {
        const { state } = JSON.parse(pendingEdits)
        localStorage.removeItem('pendingMapId')
        localStorage.removeItem('pendingMapEdits')
        
        setMapDataWithLog((prev: MapData) => ({
          ...prev,
          title: state?.subject_property?.name || 
                 state?.subject_property?.address || 
                 'New Map',
          center_lat: state?.center_lat || 40.7128,
          center_lng: state?.center_lng || -74.0060,
          zoom_level: state?.zoom_level || 12,
          overlays: state?.overlays || [],
          subject_property: state?.subject_property || null,
          mapStyle: state?.mapStyle
        }), 'restore saved state')
      }
    }

    checkForSavedState()

    window.addEventListener('popstate', checkForSavedState)
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) checkForSavedState()
    })

    return () => {
      window.removeEventListener('popstate', checkForSavedState)
    }
  }, [id])

  useEffect(() => {
    async function loadMapData() {
      if (!id || !user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('maps')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        if (data) {
          if (Array.isArray(data.overlays)) {
            data.overlays = data.overlays.map(o => ({
              ...o,
              properties: {
                ...o.properties,
                width: o.properties?.width ?? 200 // <-- Ensure width is set
              }
            }));
          }
          setMapDataWithLog((prev: MapData) => ({
            ...prev,
            title: data.title,
            center_lat: data.center_lat,
            center_lng: data.center_lng,
            zoom_level: data.zoom_level,
            overlays: data.overlays as MapOverlay[],
            subject_property: data.subject_property as any,
            mapStyle: data.map_style
          }), 'load map data')
        }
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    loadMapData()
  }, [id, user])

  useEffect(() => {}, [mapData.overlays])

  useEffect(() => {}, [mapData.subject_property])

  useEffect(() => {}, [mapData.overlays])

  const handleDeleteLayer = (id: string) => {
    setMapDataWithLog((prev: MapData) => ({
      ...prev,
      overlays: prev.overlays.filter((o: MapOverlay) => o.id !== id)
    }), 'delete layer')
    setSelectedLayer(null)
  }

  const handleTextEdit = (id: string, text: string, style: any) => {
    setMapDataWithLog((prev: MapData) => ({
      ...prev,
      overlays: prev.overlays.map((o: MapOverlay) =>
        o.id === id ? {
          ...o,
          properties: {
            ...o.properties,
            content: text,
            textStyle: {
              color: style.color,
              fontSize: style.fontSize,
              fontFamily: style.fontFamily,
              fontWeight: style.fontWeight,
              textAlign: style.textAlign,
            },
            containerStyle: {
              backgroundColor: style.backgroundColor,
              borderColor: style.borderColor,
              borderWidth: style.borderWidth,
              padding: style.padding,
              backgroundOpacity: style.backgroundOpacity,
              borderOpacity: style.borderOpacity,
            },
            width: style.width
          }
        } : o
      )
    }), 'edit text')
  }

  const handleContainerEdit = (id: string, style: any) => {
    setMapDataWithLog((prev: MapData) => ({
      ...prev,
      overlays: prev.overlays.map((o: MapOverlay) => 
        o.id === id ? {
          ...o,
          properties: {
            ...(o.properties ?? {}),
            containerStyle: style,
            width: typeof style.width === 'number' ? style.width : o.properties?.width ?? 200,
            height: typeof style.height === 'number' ? style.height : o.properties?.height ?? 200,
          }
        } : o
      )
    }), 'edit container')
  }

  const handleShapeEdit = (id: string, style: {
    fillColor: string
    strokeColor: string
    strokeWeight: number
    fillOpacity: number
    strokeOpacity: number
  }) => {
    setMapDataWithLog((prev: MapData) => ({
      ...prev,
      overlays: prev.overlays.map((o: MapOverlay) => 
        o.id === id ? {
          ...o,
          properties: {
            ...o.properties,
            style: {
              fillColor: style.fillColor,
              strokeColor: style.strokeColor,
              strokeWeight: style.strokeWeight,
              fillOpacity: style.fillOpacity,
              strokeOpacity: style.strokeOpacity
            }
          }
        } : o
      )
    }), 'edit shape')
  }

  const { overlaysRef, addOverlayToMap, removeOverlay } = useMapOverlays(
    handleDeleteLayer,
    handleTextEdit,
    handleContainerEdit,
    handleShapeEdit
  )

  const { googleMapRef, drawingManagerRef, setDrawingMode, getSafePosition } = useMapInitialization(
    mapRef,
    mapData,
    addOverlayToMap,
    { setMapData }
  )

  const { handleDownload, downloadMapFromData } = useMapDownload()

  const { handleMapStyleChange: applyMapStyle } = useMapStyle()

  const handleMapStyleChange = (style: {
    type: MapStyleName | 'satellite' | 'terrain'
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
  }) => {
    if (!googleMapRef.current) return

    applyMapStyle(googleMapRef.current, style)

    setMapDataWithLog((prev: MapData) => ({
      ...prev,
      mapStyle: style
    }), 'change map style')
  }

  const handleCenterSubjectProperty = () => {
    if (!googleMapRef.current || !mapData.subject_property) return

    const { lat, lng } = mapData.subject_property
    googleMapRef.current.panTo({ lat, lng })
  }

  const calculateInitialSize = (width: number, height: number, maxWidth = 600) => {
    const aspectRatio = width / height
    if (width <= maxWidth) return { width, height }
    
    const newWidth = maxWidth
    const newHeight = maxWidth / aspectRatio
    return { width: newWidth, height: newHeight }
  }

  const handleImageAdd = async (file: File, containerStyle?: {
    backgroundColor: string
    borderColor: string
    borderWidth: number
    padding: number
    backgroundOpacity: number
    borderOpacity: number
  }) => {
    if (!googleMapRef.current) return

    const reader = new FileReader()
    reader.onload = (e) => {
      if (!e.target?.result) return

      const img = new Image()
      img.onload = () => {
        const { width, height } = calculateInitialSize(img.naturalWidth, img.naturalHeight)

        const safePosition = getSafePosition(googleMapRef.current!)

        const overlay: MapOverlay = {
          id: crypto.randomUUID(),
          type: 'image',
          position: {
            lat: safePosition.lat(),
            lng: safePosition.lng()
          },
          properties: {
            url: e.target!.result as string,
            width,
            height,
            containerStyle: containerStyle || {
              backgroundColor: '#FFFFFF',
              borderColor: '#000000',
              borderWidth: 1,
              padding: 8,
              backgroundOpacity: 1,
              borderOpacity: 1
            }
          }
        }

        addOverlayToMap(overlay, googleMapRef.current!)
        setMapDataWithLog((prev: MapData) => ({
          ...prev,
          overlays: [...prev.overlays, overlay]
        }), 'add image')
      }
      img.src = e.target.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleLogoAdd = (logo: Logo) => {
    if (!googleMapRef.current) return

    const safePosition = getSafePosition(googleMapRef.current)
    const imageUrl = logo.url

    // Preload image to get dimensions
    const img = new Image()
    img.src = imageUrl
    
    img.onload = () => {
      const dimensions = calculateLogoDimensions(img.naturalWidth, img.naturalHeight);

      const overlay: MapOverlay = {
        id: `logo-${Date.now()}`,
        type: 'image',
        position: safePosition.toJSON(),
        properties: {
          url: imageUrl,
          width: dimensions.width,
          height: dimensions.height
        }
      };

      const instance = addOverlayToMap(overlay, googleMapRef.current);

      setMapDataWithLog(prev => ({
        ...prev,
        overlays: [...prev.overlays, overlay]
      }), 'add logo');
    };
  };

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
    if (!googleMapRef.current) return

    const safePosition = getSafePosition(googleMapRef.current)

    const overlay: MapOverlay = {
      id: crypto.randomUUID(),
      type: 'text',
      position: {
        lat: safePosition.lat(),
        lng: safePosition.lng()
      },
      properties: {
        content: text,
        ...style,
        width: style.width ?? 200 // <-- Ensure width is set
      }
    }

    addOverlayToMap(overlay, googleMapRef.current)
    setMapDataWithLog((prev: MapData) => ({
      ...prev,
      overlays: [...prev.overlays, overlay]
    }), 'add text')
  }

  const handleBusinessAdd = (business: {
    name: string
    address: string
    location: google.maps.LatLng
    logo?: string
    logoWidth?: number
    logoHeight?: number
  }) => {
    if (!googleMapRef.current) return

    const overlay: MapOverlay = {
      id: crypto.randomUUID(),
      type: 'business',
      position: {
        lat: business.location.lat(),
        lng: business.location.lng()
      },
      properties: {
        businessName: business.name,
        address: business.address,
        logo: business.logo,
        width: business.logoWidth || 200,
        height: business.logoHeight || 200,
        containerStyle: {
          backgroundColor: '#FFFFFF',
          borderColor: '#000000',
          borderWidth: 1,
          padding: 8,
          backgroundOpacity: 1,
          borderOpacity: 1
        }
      }
    }

    addOverlayToMap(overlay, googleMapRef.current)
    setMapDataWithLog((prev: MapData) => ({
      ...prev,
      overlays: [...prev.overlays, overlay]
    }), 'add business')
  }

  const handleGroupAdd = (group: {
    title?: string
    items: Array<{
      id: string
      type: 'image' | 'logo'
      url: string
      width: number
      height: number
    }>
    style?: {
      backgroundColor: string
      borderColor: string
      borderWidth: number
      padding: number
      backgroundOpacity: number
      borderOpacity: number
    }
  }) => {
    if (!googleMapRef.current) return
 
    const safePosition = getSafePosition(googleMapRef.current)

    const overlay: MapOverlay = {
      id: crypto.randomUUID(),
      type: 'group',
      position: {
        lat: safePosition.lat(),
        lng: safePosition.lng()
      },
      properties: {
        title: group.title,
        items: group.items,
        containerStyle: group.style || {
          backgroundColor: '#FFFFFF',
          borderColor: '#000000',
          borderWidth: 1,
          padding: 8,
          backgroundOpacity: 1,
          borderOpacity: 1
        }
      }
    }

    addOverlayToMap(overlay, googleMapRef.current)
    setMapDataWithLog((prev: MapData) => ({
      ...prev,
      overlays: [...prev.overlays, overlay]
    }), 'add group')
  }

  const handleShapeAdd = (shape: {
    type: 'rect' | 'circle' | 'polygon'
    fill: string
    stroke: string
    strokeWidth: number
    opacity: number
  }) => {
    if (!googleMapRef.current) return
    
    setActiveDrawingShape(shape.type)

    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: shape.type === 'rect' ? google.maps.drawing.OverlayType.RECTANGLE :
                  shape.type === 'circle' ? google.maps.drawing.OverlayType.CIRCLE :
                  google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      rectangleOptions: {
        fillColor: shape.fill,
        fillOpacity: shape.opacity,
        strokeWeight: shape.strokeWidth,
        strokeColor: shape.stroke,
        editable: false,
        draggable: true,
        clickable: true
      },
      circleOptions: {
        fillColor: shape.fill,
        fillOpacity: shape.opacity,
        strokeWeight: shape.strokeWidth,
        strokeColor: shape.stroke,
        editable: false,
        draggable: true,
        clickable: true
      },
      polygonOptions: {
        fillColor: shape.fill,
        fillOpacity: shape.opacity,
        strokeWeight: shape.strokeWidth,
        strokeColor: shape.stroke,
        editable: false,
        draggable: true,
        clickable: true
      }
    })

    google.maps.event.addListenerOnce(drawingManager, 'overlaycomplete', (e: google.maps.drawing.OverlayCompleteEvent) => {
      drawingManager.setDrawingMode(null)
      drawingManager.setMap(null)
      setActiveDrawingShape(null)

      let overlay: MapOverlay
      const id = crypto.randomUUID()
      let position: google.maps.LatLng | null = null
      let shapeWidth = 0
      let shapeHeight = 0

      if (e.type === google.maps.drawing.OverlayType.RECTANGLE) {
        const bounds = e.overlay.getBounds()
        if (bounds) {
          position = bounds.getCenter()
          const ne = bounds.getNorthEast()
          const sw = bounds.getSouthWest()
          const center = bounds.getCenter()

          shapeWidth = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(center.lat(), sw.lng()),
            new google.maps.LatLng(center.lat(), ne.lng())
          )

          shapeHeight = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(sw.lat(), center.lng()),
            new google.maps.LatLng(ne.lat(), center.lng())
          )
        }
      } else if (e.type === google.maps.drawing.OverlayType.CIRCLE) {
        position = e.overlay.getCenter()
      } else if (e.type === google.maps.drawing.OverlayType.POLYGON) {
        const path = e.overlay.getPath()
        position = path.getAt(0)
      }

      if (!position) {
        return
      }

      overlay = {
        id,
        type: 'shape',
        position: {
          lat: position.lat(),
          lng: position.lng()
        },
        properties: {
          shapeType: shape.type,
          style: {
            fillColor: shape.fill,
            strokeColor: shape.stroke,
            strokeWeight: shape.strokeWidth,
            fillOpacity: shape.opacity
          },
          ...(e.type === google.maps.drawing.OverlayType.RECTANGLE && {
            shapeWidth,
            shapeHeight
          }),
          ...(e.type === google.maps.drawing.OverlayType.CIRCLE && {
            radius: e.overlay.getRadius()
          }),
          ...(e.type === google.maps.drawing.OverlayType.POLYGON && {
            points: e.overlay.getPath().getArray().map(point => ({
              lat: point.lat(),
              lng: point.lng()
            }))
          })
        }
      }

      e.overlay.setMap(null)

      addOverlayToMap(overlay, googleMapRef.current!)
      setMapDataWithLog((prev: MapData) => ({
        ...prev,
        overlays: [...prev.overlays, overlay]
      }), 'add shape')
    })

    drawingManager.setMap(googleMapRef.current)
  }

  const handleSubjectPropertyEdit = ({ name, image, style }: {
    name: string
    image: string | null
    style?: {
      color: string
      fontSize: number
      fontFamily: string
      backgroundColor: string
      borderColor: string
      borderWidth: number
      padding: number
      backgroundOpacity: number
      borderOpacity: number
    }
  }) => {
    if (!mapData.subject_property) return

    setMapDataWithLog((prev: MapData) => ({
      ...prev,
      subject_property: prev.subject_property ? {
        ...prev.subject_property,
        name,
        image,
        style: {
          color: '#000000',
          fontSize: 14,
          fontFamily: 'Arial',
          backgroundColor: '#FFFFFF',
          borderColor: '#000000',
          borderWidth: 1,
          padding: 8,
          backgroundOpacity: 1,
          borderOpacity: 1,
          ...style
        }
      } : null
    }), 'edit subject property')
  }

  const handleMapDownload = async () => {
    setDownloading(true)
    try {
      await handleDownload(mapRef, false, undefined, undefined, googleMapRef)
    } catch (error) {
    } finally {
      setDownloading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!googleMapRef.current || !user) {
      return
    }

    setSaving(true)

    try {
      const center = googleMapRef.current.getCenter()
      const zoom = googleMapRef.current.getZoom()
      const mapType = googleMapRef.current.getMapTypeId()
      const styles = googleMapRef.current.get('styles')

      const updatedOverlays = mapData.overlays.map(overlay => {
        const currentOverlay = overlaysRef.current[overlay.id]
        
        if (currentOverlay) {
          let updatedPosition = overlay.position
          let updatedProperties = { ...overlay.properties }
          
          if (overlay.type === 'shape' && 'shape' in currentOverlay) {
            const shape = currentOverlay.shape as google.maps.Rectangle | google.maps.Circle | google.maps.Polygon
            let position: google.maps.LatLng | null = null
            
            if ('getCenter' in shape) {
              position = shape.getCenter()
            } else if ('getBounds' in shape) {
              position = shape.getBounds()?.getCenter() || null
            } else if ('getPath' in shape) {
              const bounds = new google.maps.LatLngBounds()
              shape.getPath().forEach((point: google.maps.LatLng) => bounds.extend(point))
              position = bounds.getCenter()
            }
            
            if (position) {
              updatedPosition = {
                lat: position.lat(),
                lng: position.lng()
              }
            }
            
            updatedProperties = {
              ...updatedProperties,
              style: {
                fillColor: shape.fillColor || '#FFFFFF',
                strokeColor: shape.strokeColor || '#000000',
                strokeWeight: shape.strokeWeight || 2,
                fillOpacity: shape.fillOpacity || 0.5,
                strokeOpacity: shape.strokeOpacity || 1
              }
            }

            // Add size properties based on shape type
            if ('getBounds' in shape) {
              const bounds = shape.getBounds()
              if (bounds) {
                const ne = bounds.getNorthEast()
                const sw = bounds.getSouthWest()
                const width = google.maps.geometry.spherical.computeDistanceBetween(
                  new google.maps.LatLng(ne.lat(), sw.lng()),
                  new google.maps.LatLng(ne.lat(), ne.lng())
                )
                const height = google.maps.geometry.spherical.computeDistanceBetween(
                  new google.maps.LatLng(ne.lat(), ne.lng()),
                  new google.maps.LatLng(sw.lat(), ne.lng())
                )
                updatedProperties.shapeWidth = width
                updatedProperties.shapeHeight = height
              }
            } else if ('getRadius' in shape) {
              updatedProperties.radius = shape.getRadius()
            }
          } else if ('getPosition' in currentOverlay) {
            const position = currentOverlay.getPosition()
            if (position) {
              updatedPosition = {
                lat: position.lat(),
                lng: position.lng()
              }
            }
          }
          
          const updatedOverlay = {
            ...overlay,
            position: updatedPosition,
            properties: {
              ...(overlay.properties ?? {}),
              ...(updatedProperties ?? {}),
              width: (overlay.properties?.width ?? updatedProperties?.width ?? 200),
              height: (overlay.properties?.height ?? updatedProperties?.height ?? 200),
            }
          }

          return updatedOverlay
        }
        
        return overlay
      })

      // 1. Prepare map update WITHOUT thumbnail
      const simplifiedMapStyle = {
        type: mapType as MapStyleName | 'satellite' | 'terrain',
        customStyles: styles ? styles.map((style: any) => ({
          featureType: style.featureType,
          elementType: style.elementType,
          stylers: style.stylers
        })) : []
      }

      const mapUpdate = {
        user_id: user.id,
        title: mapData.title,
        center_lat: center?.lat() || 0,
        center_lng: center?.lng() || 0,
        zoom_level: zoom || 12,
        overlays: updatedOverlays,
        subject_property: mapData.subject_property,
        map_style: simplifiedMapStyle
        // thumbnail: OMITTED HERE
      }

      let mapId = id
      if (id) {
        const { error } = await supabase
          .from('maps')
          .update(mapUpdate)
          .eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('maps')
          .insert([mapUpdate])
          .select('id')
          .single()
        if (error) throw error
        mapId = data.id
      }

      // 2. Generate thumbnail in the background and update the map record
      setTimeout(async () => {
        try {
          const thumbnail = await handleDownload(mapRef, true, undefined, undefined, googleMapRef)
          await supabase
            .from('maps')
            .update({ thumbnail })
            .eq('id', mapId)
        } catch (err) {
        }
      }, 0)

      navigate('/')
    } catch (error) {
    } finally {
      setSaving(false)
    }
  }

  const handleSaveOnly = async () => {
    if (!googleMapRef.current || !user) return

    setSaving(true)
    try {
      const center = googleMapRef.current.getCenter()
      const zoom = googleMapRef.current.getZoom()
      const mapType = googleMapRef.current.getMapTypeId()
      const styles = googleMapRef.current.get('styles')

      const updatedOverlays = mapData.overlays.map(overlay => {
        const currentOverlay = overlaysRef.current[overlay.id]
        if (currentOverlay) {
          let updatedPosition = overlay.position
          let updatedProperties = { ...overlay.properties }

          if (overlay.type === 'shape' && 'shape' in currentOverlay) {
            const shape = currentOverlay.shape as google.maps.Rectangle | google.maps.Circle | google.maps.Polygon
            let position: google.maps.LatLng | null = null

            if ('getCenter' in shape) {
              position = shape.getCenter()
            } else if ('getBounds' in shape) {
              position = shape.getBounds()?.getCenter() || null
            } else if ('getPath' in shape) {
              const bounds = new google.maps.LatLngBounds()
              shape.getPath().forEach((point: google.maps.LatLng) => bounds.extend(point))
              position = bounds.getCenter()
            }

            if (position) {
              updatedPosition = {
                lat: position.lat(),
                lng: position.lng()
              }
            }

            updatedProperties = {
              ...updatedProperties,
              style: {
                fillColor: shape.fillColor || '#FFFFFF',
                strokeColor: shape.strokeColor || '#000000',
                strokeWeight: shape.strokeWeight || 2,
                fillOpacity: shape.fillOpacity || 0.5,
                strokeOpacity: shape.strokeOpacity || 1
              }
            }

            // Add size properties based on shape type
            if ('getBounds' in shape) {
              const bounds = shape.getBounds()
              if (bounds) {
                const ne = bounds.getNorthEast()
                const sw = bounds.getSouthWest()
                const width = google.maps.geometry.spherical.computeDistanceBetween(
                  new google.maps.LatLng(ne.lat(), sw.lng()),
                  new google.maps.LatLng(ne.lat(), ne.lng())
                )
                const height = google.maps.geometry.spherical.computeDistanceBetween(
                  new google.maps.LatLng(ne.lat(), ne.lng()),
                  new google.maps.LatLng(sw.lat(), ne.lng())
                )
                updatedProperties.shapeWidth = width
                updatedProperties.shapeHeight = height
              }
            } else if ('getRadius' in shape) {
              updatedProperties.radius = shape.getRadius()
            }
          } else if ('getPosition' in currentOverlay) {
            const position = currentOverlay.getPosition()
            if (position) {
              updatedPosition = {
                lat: position.lat(),
                lng: position.lng()
              }
            }
          }

          const updatedOverlay = {
            ...overlay,
            position: updatedPosition,
            properties: {
              ...(overlay.properties ?? {}),
              ...(updatedProperties ?? {}),
              width: (overlay.properties?.width ?? updatedProperties?.width ?? 200),
              height: (overlay.properties?.height ?? updatedProperties?.height ?? 200),
            }
          }
          return updatedOverlay
        }
        return overlay
      })

      // 1. Prepare map update WITHOUT thumbnail
      const simplifiedMapStyle = {
        type: mapType as MapStyleName | 'satellite' | 'terrain',
        customStyles: styles ? styles.map((style: any) => ({
          featureType: style.featureType,
          elementType: style.elementType,
          stylers: style.stylers
        })) : []
      }

      const mapUpdate = {
        user_id: user.id,
        title: mapData.title,
        center_lat: center?.lat() || 0,
        center_lng: center?.lng() || 0,
        zoom_level: zoom || 12,
        overlays: updatedOverlays,
        subject_property: mapData.subject_property,
        map_style: simplifiedMapStyle
      }

      if (id) {
        const { error } = await supabase
          .from('maps')
          .update(mapUpdate)
          .eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('maps')
          .insert([mapUpdate])
          .select('id')
          .single()
        if (error) throw error
      }
      // No navigation here!
    } catch (error) {
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMap = async () => {
    if (!id || !user) return

    try {
      const { error } = await supabase
        .from('maps')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      navigate('/maps')
    } catch (error) {
    }
  }

  useEffect(() => {
    return () => {
      if (googleMapRef.current) {
        googleMapRef.current.overlayMapTypes.clear()
      }
    }
  }, [])

  const setMapDataWithLog = (updater: (prev: MapData) => MapData, action: string) => {
    setMapData(prev => {
      const next = updater(prev);
      return next;
    });
  };

  function extractLiveOverlays(overlaysRef, mapData) {
    return mapData.overlays.map(overlay => {
      const currentOverlay = overlaysRef.current[overlay.id]
      if (currentOverlay) {
        let updatedPosition = overlay.position
        let updatedProperties = { ...overlay.properties }

        if (overlay.type === 'shape' && 'shape' in currentOverlay) {
          const shape = currentOverlay.shape
          let position = null
          if (shape) { // <-- Minimal fix: only proceed if shape is not null
            if ('getCenter' in shape) {
              position = shape.getCenter()
            } else if ('getBounds' in shape) {
              position = shape.getBounds()?.getCenter() || null
            } else if ('getPath' in shape) {
              const bounds = new google.maps.LatLngBounds()
              shape.getPath().forEach((point) => bounds.extend(point))
              position = bounds.getCenter()
            }
            if (position) {
              updatedPosition = { lat: position.lat(), lng: position.lng() }
            }
            updatedProperties = {
              ...updatedProperties,
              style: {
                fillColor: shape.fillColor || '#FFFFFF',
                strokeColor: shape.strokeColor || '#000000',
                strokeWeight: shape.strokeWeight || 2,
                fillOpacity: shape.fillOpacity || 0.5,
                strokeOpacity: shape.strokeOpacity || 1
              }
            }
            // Add size/radius as needed...
          }
        } else if ('getPosition' in currentOverlay) {
          const position = currentOverlay.getPosition()
          if (position) {
            updatedPosition = { lat: position.lat(), lng: position.lng() }
          }
        }

        return {
          ...overlay,
          position: updatedPosition,
          properties: {
            ...(overlay.properties ?? {}),
            ...(updatedProperties ?? {}),
            width: (overlay.properties?.width ?? updatedProperties?.width ?? 200),
            height: (overlay.properties?.height ?? updatedProperties?.height ?? 200),
          }
        }
      }
      return overlay
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      <div className="w-56 bg-gray-900 flex flex-col">
        <div className="flex-shrink-0 p-2 border-b border-gray-700">
          <div 
            className="relative group mb-2"
            onBlur={() => setIsEditingTitle(false)}
          >
            <input
              type="text"
              value={mapData.title}
              onChange={(e) => setMapDataWithLog(prev => ({ ...prev, title: e.target.value }))}
              onFocus={() => setIsEditingTitle(true)}
              className={cn(
                "text-lg font-medium text-gray-100 bg-transparent border-0 border-b-2 focus:outline-none focus:ring-0 px-1 py-0.5 w-full",
                isEditingTitle 
                  ? "border-blue-500" 
                  : "border-transparent hover:border-gray-700"
              )}
              placeholder="Map Title"
            />
            {!isEditingTitle && (
              <div className="absolute inset-0 cursor-text opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-900 px-1">
                  Click to edit
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              disabled={saving || !mapData.subject_property}
              className="flex-1 flex items-center justify-center px-2 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
            <DownloadButton
              onDownload={() => {
                if (hasAccess()) {
                  setDownloadModalOpen(true)
                }
              }}
              loading={downloading}
              className="flex-1 flex items-center justify-center px-2 py-1.5 rounded-md text-sm font-medium bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
              handleSaveOnly={handleSaveOnly}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <MapControls
            onBusinessAdd={handleBusinessAdd}
            onTextAdd={handleTextAdd}
            onImageAdd={handleImageAdd}
            onLogoAdd={handleLogoAdd}
            onGroupAdd={handleGroupAdd}
            onShapeAdd={handleShapeAdd}
            onMapStyleChange={handleMapStyleChange}
            onSubjectPropertyEdit={handleSubjectPropertyEdit}
            onCenterSubjectProperty={handleCenterSubjectProperty}
            onDeleteMap={() => setShowDeleteModal(true)}
            subjectProperty={mapData.subject_property ? {
              name: mapData.subject_property.name || 'Subject Property',
              image: mapData.subject_property.image || null,
              style: mapData.subject_property.style
            } : {
              name: 'Subject Property',
              image: null
            }}
            mapBounds={googleMapRef.current?.getBounds()}
            subjectPropertyLocation={mapData.subject_property ? {
              lat: mapData.subject_property.lat,
              lng: mapData.subject_property.lng
            } : undefined}
            initialMapStyle={mapData.mapStyle}
            map={googleMapRef.current}
            setDrawingMode={setDrawingMode}
            activeDrawingShape={activeDrawingShape}
          />
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full max-h-full flex items-center justify-center">
            <div className="w-full h-full relative shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              {activeDrawingShape && (
                <div className="absolute top-0 left-0 right-0 z-20 bg-blue-500 text-white px-4 py-2 text-sm font-medium text-center">
                  Drawing {activeDrawingShape === 'rect' ? 'Rectangle' : 
                          activeDrawingShape === 'circle' ? 'Circle' : 
                          'Polygon'} - Click and drag to draw
                </div>
              )}
              <div ref={mapRef} className="w-full h-full" />
              {mapData.overlays.map((overlay, i) => {
                // Defensive fallback to prevent crash:
                const width = overlay.properties?.width ?? 200;
                const height = overlay.properties?.height ?? 200;

                // ...rest of your rendering logic
              })}
            </div>
          </div>
        </div>
      </div>

      <DownloadMapModal
        open={downloadModalOpen}
        width={downloadWidth}
        height={downloadHeight}
        onWidthChange={setDownloadWidth}
        onHeightChange={setDownloadHeight}
        onClose={() => setDownloadModalOpen(false)}
        onDownload={async (center, zoom) => {
          setDownloading(true)
          try {
            const map = googleMapRef.current
            let originalCenter, originalZoom
            if (map) {
              originalCenter = map.getCenter()
              originalZoom = map.getZoom()
              map.setCenter(center)
              map.setZoom(zoom)
              await new Promise(res => setTimeout(res, 400))
            }
            // --- Use live overlays here ---
            const liveOverlays = extractLiveOverlays(overlaysRef, mapData)
            await handleDownload(
              mapRef,
              false,
              downloadWidth,
              downloadHeight,
              googleMapRef,
              liveOverlays // <-- pass live overlays
            )
            setDownloadModalOpen(false)
            if (map && originalCenter && originalZoom !== undefined) {
              map.setCenter(originalCenter)
              map.setZoom(originalZoom)
            }
          } catch (error) {
          } finally {
            setDownloading(false)
          }
        }}
        mapRef={mapRef}
        mapData={{ ...mapData, overlays: extractLiveOverlays(overlaysRef, mapData) }} // <-- also for preview
      />

      <PricingPlans
        isOpen={showPricingPlans}
        onClose={() => setShowPricingPlans(false)}
        onSave={handleSaveOnly}
      />

      <DeleteMapModal
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => {
          handleDeleteMap()
          setShowDeleteModal(false)
        }}
      />
    </div>
  )
}