module.exports = async (req, res) => {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid `url` query parameter' })
  }

  if (url.startsWith('data:')) {
    return res.status(400).json({ error: 'Cannot proxy data URLs' })
  }

  try {
    const decodedUrl = decodeURIComponent(url)

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      return res.status(response.status).json({ error: 'Failed to fetch image' })
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const buffer = Buffer.from(await response.arrayBuffer())

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    res.status(200).send(buffer)
  } catch (err) {
    console.error('Proxy error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
