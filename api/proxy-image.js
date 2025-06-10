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
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CRE MapsBuilder/1.0)'
      }
    });

    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      const text = await response.text();
      res.status(502).json({ 
        error: 'Upstream fetch failed', 
        status: response.status, 
        preview: text.slice(0, 300) 
      });
      return;
    }

    // Check if content-type is image
    if (!contentType || !contentType.startsWith('image/')) {
      const text = await response.text();
      res.status(502).json({ 
        error: 'Upstream did not return an image', 
        contentType, 
        preview: text.slice(0, 300) 
      });
      return;
    }

    // Pipe the image
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    const buffer = await response.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
