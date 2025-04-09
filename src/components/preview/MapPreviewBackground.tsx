import React from 'react'

export function MapPreviewBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full">
      {/* Checkered background */}
      <div 
        className="w-full h-48 rounded-lg overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #f3f4f6 25%, transparent 25%),
            linear-gradient(-45deg, #f3f4f6 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f3f4f6 75%),
            linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          backgroundColor: '#fff'
        }}
      />

      {/* Content overlay with max dimensions */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="max-w-full max-h-full overflow-hidden flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  )
}