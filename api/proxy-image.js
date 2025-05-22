export default async function handler(req, res) {
  try {
    const { url } = req.query;
    console.log('[ProxyImage] Incoming request:', { url });

    if (!url) {
      console.error('[ProxyImage] Missing url parameter');
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }
    const decodedUrl = decodeURIComponent(url);
    console.log('[ProxyImage] Decoded URL:', decodedUrl);

    // Prevent proxying local/proxy URLs
    if (decodedUrl.startsWith('/api/proxy-image')) {
      console.error('[ProxyImage] Attempted to proxy a proxied URL:', decodedUrl);
      res.status(400).json({ error: 'Cannot proxy a proxied URL' });
      return;
    }

    // Only allow http/https
    if (!/^https?:\/\//.test(decodedUrl)) {
      console.error('[ProxyImage] Invalid URL protocol:', decodedUrl);
      res.status(400).json({ error: 'Invalid URL protocol' });
      return;
    }

    // Fetch the image
    console.log('[ProxyImage] Fetching image from:', decodedUrl);
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CRE MapsBuilder/1.0)'
      }
    });
    console.log('[ProxyImage] Fetch response status:', response.status);

    const contentType = response.headers.get('content-type');
    console.log('[ProxyImage] Response content-type:', contentType);

    if (!response.ok) {
      console.error('[ProxyImage] Upstream fetch failed:', response.status, decodedUrl);
      res.status(502).json({ error: 'Upstream fetch failed', status: response.status });
      return;
    }

    // Check if content-type is image
    if (!contentType || !contentType.startsWith('image/')) {
      const text = await response.text();
      console.error('[ProxyImage] Non-image content-type or error page:', { contentType, text: text.slice(0, 200) });
      res.status(502).json({ error: 'Upstream did not return an image', contentType, preview: text.slice(0, 200) });
      return;
    }

    // Pipe the image
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    const buffer = await response.arrayBuffer();
    console.log('[ProxyImage] Image buffer length:', buffer.byteLength);
    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('[ProxyImage] Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
