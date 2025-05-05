const https = require('https')
const http = require('http')
const { parse } = require('url')

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { url } = req.query

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Missing or invalid `url` query parameter' })
      return
    }

    try {
      const parsedUrl = parse(url)
      const client = parsedUrl.protocol === 'https:' ? https : http

      client.get(url, (proxyRes) => {
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

  else if (req.method === 'POST') {
    let body = ''
    req.on('data', chunk => {
      body += chunk
    })
    req.on('end', () => {
      try {
        const { base64 } = JSON.parse(body)

        if (!base64 || typeof base64 !== 'string' || !base64.startsWith('data:image')) {
          res.status(400).json({ error: 'Invalid base64 image data' })
          return
        }

        const imageBuffer = Buffer.from(base64.split(',')[1], 'base64')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Content-Type', 'image/png')
        res.status(200).send(imageBuffer)
      } catch (err) {
        console.error('Error decoding base64:', err)
        res.status(500).json({ error: 'Failed to process image' })
      }
    })
  }

  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
