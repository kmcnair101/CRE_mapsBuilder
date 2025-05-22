export default async function handler(req, res) {
  const { url } = req.query
  
  console.log('[Proxy] Received request for:', {
    url,
    headers: req.headers
  })

  try {
    const response = await fetch(url)
    console.log('[Proxy] Fetch response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      console.error('[Proxy] Failed to fetch image:', {
        status: response.status,
        statusText: response.statusText,
        url
      })
      return res.status(response.status).json({ error: 'Failed to fetch image' })
    }

    const contentType = response.headers.get('content-type')
    console.log('[Proxy] Image content type:', contentType)

    // Set appropriate headers
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Stream the response
    response.body.pipe(res)
  } catch (error) {
    console.error('[Proxy] Error proxying image:', {
      error,
      url
    })
    res.status(500).json({ error: 'Failed to proxy image' })
  }
} 