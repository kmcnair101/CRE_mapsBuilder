const https = require('https')
const http = require('http')
const { parse } = require('url')

module.exports = (req, res) => {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid `url` query parameter' })
  }

  if (url.startsWith('data:')) {
    return res.status(400).json({ error: 'Cannot proxy data URLs' })
  }

  try {
    // Decode the URL before parsing
    const decodedUrl = decodeURIComponent(url)
    const parsedUrl = parse(decodedUrl)
    const client = parsedUrl.protocol === 'https:' ? https : http

    const options = {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }

    const request = client.get(decodedUrl, options, (proxyRes) => {
      // Handle redirects
      if (proxyRes.statusCode === 301 || proxyRes.statusCode === 302) {
        const location = proxyRes.headers.location
        if (location) {
          return res.redirect(location)
        }
      }

      if (proxyRes.statusCode !== 200) {
        console.error(`Failed to fetch image: ${proxyRes.statusCode} ${proxyRes.statusMessage}`)
        return res.status(proxyRes.statusCode).json({ error: 'Failed to fetch image' })
      }

      // Set appropriate headers
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
      
      // Stream the response
      proxyRes.pipe(res)
    })

    request.on('error', (err) => {
      console.error('Proxy error:', err)
      res.status(500).json({ error: 'Error proxying image' })
    })

    request.on('timeout', () => {
      request.destroy()
      res.status(504).json({ error: 'Request timeout' })
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
