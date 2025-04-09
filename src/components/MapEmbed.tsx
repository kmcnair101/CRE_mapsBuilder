import { useState, useEffect } from 'react'
import { Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MapEmbedProps {
  mapId: string
  width?: number
  height?: number
  interactive?: boolean
  showControls?: boolean
}

export function MapEmbed({
  mapId,
  width = 800,
  height = 600,
  interactive = true,
  showControls = true
}: MapEmbedProps) {
  const [copied, setCopied] = useState(false)
  const [embedCode, setEmbedCode] = useState('')

  useEffect(() => {
    const params = new URLSearchParams({
      width: width.toString(),
      height: height.toString(),
      interactive: interactive.toString(),
      controls: showControls.toString()
    })

    const iframeSrc = `${window.location.origin}/api/maps/${mapId}/iframe?${params}`
    const code = `<iframe src="${iframeSrc}" width="${width}" height="${height}" frameborder="0" style="border:0" allowfullscreen></iframe>`
    setEmbedCode(code)
  }, [mapId, width, height, interactive, showControls])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Embed Map</h3>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center px-3 py-1 text-sm font-medium rounded-md',
            copied
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <Copy className="h-4 w-4 mr-1.5" />
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>

      <div className="relative">
        <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
          {embedCode}
        </pre>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <iframe
          src={`/api/maps/${mapId}/iframe?${new URLSearchParams({
            width: width.toString(),
            height: height.toString(),
            interactive: interactive.toString(),
            controls: showControls.toString()
          })}`}
          width={width}
          height={height}
          frameBorder="0"
          style={{ border: 0 }}
          allowFullScreen
        />
      </div>
    </div>
  )
}