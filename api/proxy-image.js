export default async function handler(req, res) {
  const { url } = req.query
  console.log('Received proxy request for URL:', url)

  if (!url || typeof url !== 'string') {
    console.log('Invalid URL param')
    res.status(400).json({ error: 'Missing or invalid `url` query parameter' })
    return
  }

  if (url.startsWith('data:')) {
    console.log('Blocked data URL')
    res.status(400).json({ error: 'Cannot proxy data URLs' })
    return
  }

  try {
    const decodedUrl = decodeURIComponent(url)
    console.log('Decoded URL:', decodedUrl)

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })

    console.log('Fetch response status:', response.status)
    console.log('Content-Type:', response.headers.get('content-type'))

    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to fetch image' })
      return
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(buffer)
  } catch (err) {
    console.error('Error in proxy-image handler:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
  
}
