import { useState, useRef, useEffect } from 'react'
import { Search, Type, Image, MapPin, Target, ImagePlus, FolderPlus, Square, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BusinessLayer } from './layers/BusinessLayer'
import { TextLayer } from './layers/TextLayer'
import { ImageLayer } from './layers/ImageLayer'
import { LogoLayer } from './layers/LogoLayer'
import { ShapeLayer } from './layers/ShapeLayer'
import { SubjectPropertyModal } from './modals/SubjectPropertyModal'
import { GroupModal } from './modals/GroupModal'
import { MapStyleModal } from './modals/MapStyleModal'
import { AddTextModal } from './modals/AddTextModal'
import type { MapStyleName } from '../lib/map/styles'

interface MapControlsProps {
  onBusinessAdd: (business: {
    name: string
    address: string
    location: google.maps.LatLng
    logo?: string
  }) => void
  onTextAdd: (text: string, style: { 
    color: string
    fontSize: number
    fontFamily: string
    backgroundColor: string
    borderColor: string
    borderWidth: number
    padding: number
    backgroundOpacity: number
    borderOpacity: number
  }) => void
  onImageAdd: (file: File) => void
  onLogoAdd: (logo: {
    url: string
    width: number
    height: number
  }) => void
  onGroupAdd: (group: {
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
  }) => void
  onShapeAdd: (shape: {
    type: 'rect' | 'circle' | 'polygon'
    fill: string
    stroke: string
    strokeWidth: number
    opacity: number
  }) => void
  onMapStyleChange: (style: {
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
  }) => void
  onSubjectPropertyEdit: (data: {
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
  }) => void
  onCenterSubjectProperty: () => void
  subjectProperty: {
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
  }
  mapBounds?: google.maps.LatLngBounds
  subjectPropertyLocation?: {
    lat: number
    lng: number
  }
  initialMapStyle?: {
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
  }
  map: google.maps.Map | null
  setDrawingMode: (mode: google.maps.drawing.OverlayType | null) => void
  activeDrawingShape: 'rect' | 'circle' | 'polygon' | null
}

export function MapControls({
  onBusinessAdd,
  onTextAdd,
  onImageAdd,
  onLogoAdd,
  onGroupAdd,
  onShapeAdd,
  onMapStyleChange,
  onSubjectPropertyEdit,
  onCenterSubjectProperty,
  subjectProperty,
  mapBounds,
  subjectPropertyLocation,
  initialMapStyle,
  map,
  setDrawingMode,
  activeDrawingShape
}: MapControlsProps) {
  const [activeControl, setActiveControl] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyleName | 'satellite' | 'terrain'>(
    initialMapStyle?.type || 'default'
  )

  const [highlightHighways, setHighlightHighways] = useState<{
    enabled: boolean
    color: string
    weight: number
  }>({
    enabled: initialMapStyle?.highlightHighways !== undefined,
    color: initialMapStyle?.highlightHighways?.color || '#FFEB3B',
    weight: initialMapStyle?.highlightHighways?.weight || 2
  })

  const [labelStates, setLabelStates] = useState({
    hideAllLabels: initialMapStyle?.hideLabels || false,
    hideStreetNames: initialMapStyle?.hideStreetNames || false,
    hideHighwayLabels: initialMapStyle?.hideHighwayLabels || false,
    hideAreaLabels: initialMapStyle?.hideAreaLabels || false,
    hideBusinessLabels: initialMapStyle?.hideBusinessLabels || false,
    hideTransitLabels: initialMapStyle?.hideTransitLabels || false,
    hideWaterLabels: initialMapStyle?.hideWaterLabels || false
  })

  const handleStyleChange = (style: {
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
    setCurrentMapStyle(style.type)
    setLabelStates({
      hideAllLabels: style.hideLabels || false,
      hideStreetNames: style.hideStreetNames || false,
      hideHighwayLabels: style.hideHighwayLabels || false,
      hideAreaLabels: style.hideAreaLabels || false,
      hideBusinessLabels: style.hideBusinessLabels || false,
      hideTransitLabels: style.hideTransitLabels || false,
      hideWaterLabels: style.hideWaterLabels || false
    })
    setHighlightHighways({
      enabled: style.highlightHighways !== undefined,
      color: style.highlightHighways?.color || '#FFEB3B',
      weight: style.highlightHighways?.weight || 2
    })
    onMapStyleChange(style)
  }

  const controls = [
    {
      id: 'subject-property',
      icon: MapPin,
      label: 'Subject Property',
      onClick: () => setActiveModal('subject-property')
    },
    {
      id: 'business',
      icon: Search,
      label: 'Location Search',
      onClick: () => setActiveModal('business')
    },
    {
      id: 'logo',
      icon: ImagePlus,
      label: 'Logo Search',
      onClick: () => setActiveModal('logo')
    },
    {
      id: 'text',
      icon: Type,
      label: 'Text',
      onClick: () => setActiveModal('text')
    },
    {
      id: 'image',
      icon: Image,
      label: 'Image',
      onClick: () => setActiveModal('image')
    },
    {
      id: 'group',
      icon: FolderPlus,
      label: 'Group',
      onClick: () => setActiveModal('group')
    },
    {
      id: 'shape',
      icon: Square,
      label: 'Shapes',
      onClick: () => setActiveModal('shape')
    },
    {
      id: 'style',
      icon: Map,
      label: 'Style',
      onClick: () => setActiveModal('style')
    }
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setActiveModal(null)
      }
    }

    if (activeModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeModal])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-3 space-y-2 overflow-y-auto">
        {controls.map((control) => (
          <button
            key={control.id}
            onClick={control.onClick}
            className={cn(
              'w-full p-2 flex items-center gap-2.5 rounded-md transition-colors',
              activeModal === control.id 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <control.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{control.label}</span>
          </button>
        ))}

        {subjectPropertyLocation && (
          <button
            onClick={onCenterSubjectProperty}
            className="w-full p-2 flex items-center gap-2.5 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Target className="h-4 w-4" />
            <span className="text-sm font-medium">Center Map</span>
          </button>
        )}
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={(e) => {
              e.stopPropagation()
              setActiveModal(null)
            }}
          />
          <div 
            ref={modalRef}
            className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {activeModal === 'subject-property' && (
              <SubjectPropertyModal
                isOpen={true}
                onClose={() => setActiveModal(null)}
                initialName={subjectProperty.name}
                initialImage={subjectProperty.image}
                initialStyle={subjectProperty.style}
                onSave={(data) => {
                  onSubjectPropertyEdit(data)
                  setActiveModal(null)
                }}
              />
            )}

            {activeModal === 'business' && (
              <BusinessLayer
                onAdd={(business) => {
                  onBusinessAdd(business)
                  setActiveModal(null)
                }}
                isActive={true}
                onToggle={() => {}}
                onClose={() => setActiveModal(null)}
                mapBounds={mapBounds}
                subjectProperty={subjectPropertyLocation}
              />
            )}

            {activeModal === 'logo' && (
              <LogoLayer
                onAdd={(logo) => {
                  onLogoAdd(logo)
                  setActiveModal(null)
                }}
                isActive={true}
                onToggle={() => {}}
                onClose={() => setActiveModal(null)}
              />
            )}

            {activeModal === 'text' && (
              <AddTextModal
                isOpen={true}
                onClose={() => setActiveModal(null)}
                onSave={(text, style) => {
                  onTextAdd(text, style)
                  setActiveModal(null)
                }}
              />
            )}

            {activeModal === 'image' && (
              <ImageLayer
                onAdd={(file) => {
                  onImageAdd(file)
                  setActiveModal(null)
                }}
                isActive={true}
                onToggle={() => {}}
                onClose={() => setActiveModal(null)}
              />
            )}

            {activeModal === 'group' && (
              <GroupModal
                isOpen={true}
                onClose={() => setActiveModal(null)}
                onSave={(group) => {
                  onGroupAdd(group)
                  setActiveModal(null)
                }}
              />
            )}

            {activeModal === 'shape' && (
              <ShapeLayer
                onAdd={(shape) => {
                  onShapeAdd(shape)
                  setActiveModal(null)
                }}
                isActive={true}
                onToggle={() => {}}
                onClose={() => setActiveModal(null)}
                activeDrawingShape={activeDrawingShape}
              />
            )}

            {activeModal === 'style' && (
              <MapStyleModal
                isOpen={true}
                onClose={() => setActiveModal(null)}
                currentStyle={currentMapStyle}
                labelStates={labelStates}
                highlightHighways={highlightHighways}
                onStyleChange={(style) => {
                  handleStyleChange(style)
                  setActiveModal(null)
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}