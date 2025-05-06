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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Download Map</h2>
        <div className="mb-4 flex flex-col items-center">
          <div
            className="border border-gray-300 rounded shadow"
            style={{
              width: width + 'px',
              height: height + 'px',
              overflow: 'hidden',
              background: '#eee'
            }}
          />
          <span className="text-xs text-gray-500 mt-1">
            Preview ({width} × {height})
          </span>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Width (px): <span className="font-mono">{width}</span></label>
          <input
            type="range"
            min={400}
            max={3000}
            step={10}
            value={width}
            onChange={(e) => onWidthChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Height (px): <span className="font-mono">{height}</span></label>
          <input
            type="range"
            min={300}
            max={2000}
            step={10}
            value={height}
            onChange={(e) => onHeightChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="flex justify-end space-x-2">
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
  )
} 