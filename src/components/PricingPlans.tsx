const PricingPlans = ({ onSave }: PricingPlansProps) => {
  console.log('[PricingPlans] Component rendered with onSave:', {
    hasOnSave: typeof onSave === 'function',
    timestamp: new Date().toISOString()
  })

  // Add logging to the save handler
  const handleSave = async () => {
    console.log('[PricingPlans] handleSave called:', {
      timestamp: new Date().toISOString()
    })

    if (!googleMapRef.current || !mapData) {
      console.error('[PricingPlans] Missing required data:', {
        hasGoogleMapRef: Boolean(googleMapRef.current),
        hasMapData: Boolean(mapData),
        timestamp: new Date().toISOString()
      })
      return
    }

    try {
      const center = googleMapRef.current.getCenter()
      const zoom = googleMapRef.current.getZoom()
      const mapTypeId = googleMapRef.current.getMapTypeId()
      const styles = googleMapRef.current.get('styles')

      console.log('[PricingPlans] Map state:', {
        center: center?.toJSON(),
        zoom,
        mapTypeId,
        hasStyles: Boolean(styles),
        timestamp: new Date().toISOString()
      })

      // Log the overlays before mapping
      console.log('[PricingPlans] Current overlays:', {
        overlays: mapData.overlays.map(overlay => ({
          id: overlay.id,
          type: overlay.type,
          hasProperties: 'properties' in overlay,
          properties: overlay.properties ? {
            ...overlay.properties,
            url: overlay.properties.url?.substring(0, 100) + '...'
          } : null
        })),
        timestamp: new Date().toISOString()
      })

      const overlays = mapData.overlays.map(overlay => {
        console.log('[PricingPlans] Processing overlay:', {
          id: overlay.id,
          type: overlay.type,
          hasProperties: 'properties' in overlay,
          properties: overlay.properties ? {
            ...overlay.properties,
            url: overlay.properties.url?.substring(0, 100) + '...'
          } : null,
          timestamp: new Date().toISOString()
        })

        const instance = overlayInstances.current[overlay.id]
        if (!instance) {
          console.error('[PricingPlans] Missing overlay instance:', {
            overlayId: overlay.id,
            timestamp: new Date().toISOString()
          })
          return null
        }

        return {
          id: overlay.id,
          type: overlay.type,
          position: instance.getPosition().toJSON(),
          properties: {
            ...overlay.properties,
            width: instance.get('width'),
            height: instance.get('height')
          }
        }
      }).filter(Boolean)

      console.log('[PricingPlans] Processed overlays:', {
        overlays,
        timestamp: new Date().toISOString()
      })

      const mapState = {
        center: center.toJSON(),
        zoom,
        mapTypeId,
        styles,
        overlays
      }

      console.log('[PricingPlans] Calling onSave with map state:', {
        mapState,
        timestamp: new Date().toISOString()
      })

      await onSave(mapState)
    } catch (error) {
      console.error('[PricingPlans] Error in handleSave:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
    }
  }

  // ... rest of the component
} 