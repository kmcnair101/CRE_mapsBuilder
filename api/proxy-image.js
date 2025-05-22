export default async function handler(req, res) {
  console.log('[ProxyImage] Received request:', {
    url: req.query.url,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  try {
    const imageUrl = req.query.url;

    if (!imageUrl) {
      console.error('[ProxyImage] No URL provided');
      return res.status(400).json({ error: 'No URL provided' });
    }

    console.log('[ProxyImage] imageUrl received:', imageUrl);

    if (imageUrl.startsWith('/api/proxy-image')) {
      console.error('[ProxyImage] Refusing to proxy a proxied URL:', imageUrl);
      return res.status(400).json({ error: 'Cannot proxy a proxied URL' });
    }

    const decodedUrl = decodeURIComponent(imageUrl);
    console.log('[ProxyImage] Decoded URL:', {
      original: imageUrl,
      decoded: decodedUrl,
      timestamp: new Date().toISOString()
    });

    let url;
    try {
      url = new URL(decodedUrl);
      console.log('[ProxyImage] URL object created:', url.toString());

      if (url.toString().includes('token=') || url.toString().includes('c=')) {
        console.log('[ProxyImage] API key detected in URL:', {
          hasLogoDevToken: url.toString().includes('token='),
          hasBrandfetchToken: url.toString().includes('c='),
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('[ProxyImage] Invalid URL:', {
        url: decodedUrl,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ error: 'Invalid URL' });
    }

    console.log('[ProxyImage] Fetching image from:', {
      url: url.toString(),
      timestamp: new Date().toISOString()
    });

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error('[ProxyImage] Failed to fetch image:', {
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        timestamp: new Date().toISOString()
      });
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    const contentType = response.headers.get('content-type');
    console.log('[ProxyImage] Image fetched successfully:', {
      contentType,
      status: response.status,
      url: url.toString(),
      timestamp: new Date().toISOString()
    });

    res.setHeader('Content-Type', contentType || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log('[ProxyImage] Response body check:', {
      hasBody: !!response.body,
      bodyType: response.body ? typeof response.body : 'none',
      isReadable: response.body ? response.body.readable : false,
      url: url.toString(),
      timestamp: new Date().toISOString()
    });

    response.body?.pipe(res);

    response.body?.on('error', (error) => {
      console.error('[ProxyImage] Stream error:', {
        error: error.message,
        url: url.toString(),
        timestamp: new Date().toISOString()
      });
    });

    console.log('[ProxyImage] Response streamed:', {
      url: url.toString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ProxyImage] Error in proxy-image handler:', {
      error: error.message,
      stack: error.stack,
      url: req.query.url,
      timestamp: new Date().toISOString(
