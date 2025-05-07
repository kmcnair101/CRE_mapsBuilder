import React from 'react'

interface DownloadMapModalProps {
  open: boolean
  width: number
  height: number
  onWidthChange: (width: number) => void
  onHeightChange: (height: number) => void
  onClose: () => void
  onDownload: () => void
  mapRef: React.RefObject<HTMLDivElement>
  mapData: any // Replace with your map data type
}

export function DownloadMapModal({
  open,
  width,
  height,
  onWidthChange,
  onHeightChange,
  onClose,
  onDownload,
  mapRef,
  mapData
}: DownloadMapModalProps) {
  if (!open) return null

  // Increased maximum dimensions for the preview
  const maxPreviewWidth = 600 // Increased from 400 to 600
  const maxPreviewHeight = 450 // Increased from 300 to 450
  const scale = Math.min(
    maxPreviewWidth / width,
    maxPreviewHeight / height,
    1 // Don't scale up, only down
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-5xl w-full">
        <h2 className="text-xl font-bold mb-4">Download Map</h2>
        <div className="flex gap-6">
          {/* Controls Section - Left Side */}
          <div className="w-2/5">
            <div className="space-y-6">
              <div>
                <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
                  Width (px)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id="width"
                    min="100"
                    max="1000"
                    value={width}
                    onChange={(e) => onWidthChange(Math.min(1000, Math.max(100, parseInt(e.target.value) || 100)))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-16">{width}px</span>
                </div>
              </div>
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                  Height (px)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id="height"
                    min="100"
                    max="1000"
                    value={height}
                    onChange={(e) => onHeightChange(Math.min(1000, Math.max(100, parseInt(e.target.value) || 100)))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-16">{height}px</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onDownload}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Download
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section - Right Side */}
          <div className="w-3/5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
            <div className="flex items-center justify-center">
              <div
                className="border border-gray-300 rounded shadow overflow-hidden"
                style={{
                  width: width * scale,
                  height: height * scale,
                  background: '#eee',
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center'
                }}
              >
                <div ref={mapRef} className="w-full h-full" />
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-1 block text-center">
              Preview ({width} × {height})
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 