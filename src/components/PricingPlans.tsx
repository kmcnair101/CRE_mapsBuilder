const PricingPlans = ({ onSave }: PricingPlansProps) => {
  const handleSave = async () => {
    if (!googleMapRef.current || !mapData) {
      return
    }

    try {
      const center = googleMapRef.current.getCenter()
      const zoom = googleMapRef.current.getZoom()
      const mapTypeId = googleMapRef.current.getMapTypeId()
      const styles = googleMapRef.current.get('styles')

      const overlays = mapData.overlays.map(overlay => {
        const instance = overlayInstances.current[overlay.id]
        if (!instance) {
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

      const mapState = {
        center: center.toJSON(),
        zoom,
        mapTypeId,
        styles,
        overlays
      }

      await onSave(mapState)
    } catch (error) {
      // No console.error
    }
  }

  // ... rest of the component
}