import { useState } from 'react'
import { Type } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddTextModal } from '@/components/modals/AddTextModal'

interface TextLayerProps {
  onAdd: (text: string, style: { 
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
  isActive: boolean
  onToggle: () => void
  onClose?: () => void
}

export function TextLayer({ onAdd, isActive, onToggle, onClose }: TextLayerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
    onClose?.()
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSaveText = (text: string, style: any) => {
    onAdd(text, style)
    setIsModalOpen(false)
  }

  return (
    <>
      <div className="p-4">
        <button
          onClick={() => {
            if (isActive) {
              handleOpenModal();
            } else {
              onToggle();
            }
          }}
          className={cn(
            'flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-md focus:outline-none',
            isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <Type className="h-4 w-4 mr-2" />
          Add Text
        </button>
      </div>

      <AddTextModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveText}
      />
    </>
  )
}