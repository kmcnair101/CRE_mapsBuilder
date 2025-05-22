export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }
    const decodedUrl = decodeURIComponent(url);

    // Prevent proxying local/proxy URLs
    if (decodedUrl.startsWith('/api/proxy-image')) {
      res.status(400).json({ error: 'Cannot proxy a proxied URL' });
      return;
    }

    // Only allow http/https
    if (!/^https?:\/\//.test(decodedUrl)) {
      res.status(400).json({ error: 'Invalid URL protocol' });
      return;
    }

    // Fetch the image
    const response = await fetch(decodedUrl);
    if (!response.ok) {
      console.error('[ProxyImage] Upstream fetch failed:', response.status, decodedUrl);
      res.status(502).json({ error: 'Upstream fetch failed', status: response.status });
      return;
    }

    // Pipe the image
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');
    const buffer = await response.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('[ProxyImage] Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
