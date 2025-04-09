import { supabase } from '@/lib/supabase/client'
import type { MapData } from '@/lib/types'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()
    const params = new URLSearchParams(url.search)
    
    const width = parseInt(params.get('width') || '800', 10)
    const height = parseInt(params.get('height') || '600', 10)
    const interactive = params.get('interactive') !== 'false'
    const showControls = params.get('controls') !== 'false'

    // Get map data
    const { data: map, error } = await supabase
      .from('maps')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: 'Map not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate iframe HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${map.title}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              width: ${width}px;
              height: ${height}px;
              overflow: hidden;
            }
            #map {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script type="module">
            import { createMapIframe } from '${url.origin}/lib/api/mapIframe.js';
            
            const mapData = ${JSON.stringify(map)};
            const container = document.getElementById('map');
            
            createMapIframe({
              width: ${width},
              height: ${height},
              mapData,
              container,
              interactive: ${interactive},
              showControls: ${showControls}
            });
          </script>
        </body>
      </html>
    `

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'X-Frame-Options': 'SAMEORIGIN'
      }
    })
  } catch (error) {
    console.error('Error generating iframe:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}