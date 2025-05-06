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
    const parsedUrl = parse(url)
    const client = parsedUrl.protocol === 'https:' ? https : http

    client.get(url, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {
        return res.status(proxyRes.statusCode).json({ error: 'Failed to fetch image' })
      }

      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/png')
      proxyRes.pipe(res)
    }).on('error', (err) => {
      console.error('Proxy error:', err)
      res.status(500).json({ error: 'Error proxying image' })
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
