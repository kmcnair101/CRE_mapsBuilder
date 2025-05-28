import React, { useEffect, useState } from 'react'

interface DeleteMapModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const DeleteMapModal: React.FC<DeleteMapModalProps> = ({ open, onCancel, onConfirm }) => {
  const [input, setInput] = useState('')

  // Reset input when modal opens or closes
  useEffect(() => {
    if (open) setInput('')
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Permanently Delete – Map</h2>
        <p className="text-gray-600 mb-4">
          You are about to permanently delete this <strong>map</strong> and all its contents.
          You will not be able to recover this map.
          <strong>This operation cannot be undone.</strong>
        </p>
        <div className="mb-4">
          <label htmlFor="confirmInput" className="block text-sm font-medium text-gray-700 mb-1">
            Type "delete" to confirm:
          </label>
          <input
            id="confirmInput"
            type="text"
            placeholder="delete"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={input.trim().toLowerCase() !== 'delete'}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}