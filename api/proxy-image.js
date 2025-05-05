import https from 'https'
import http from 'http'
import { parse } from 'url'

export default function handler(req, res) {
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
