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
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Width (px)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => onWidthChange(Number(e.target.value))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Height (px)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => onHeightChange(Number(e.target.value))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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