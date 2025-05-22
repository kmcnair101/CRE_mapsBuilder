export async function handler(req, res) {
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

    // Log the received imageUrl before proxy check
    console.log('[ProxyImage] imageUrl received:', imageUrl);

    // Prevent proxying already-proxied URLs
    if (imageUrl.startsWith('/api/proxy-image')) {
      console.error('[ProxyImage] Refusing to proxy a proxied URL:', imageUrl);
      return res.status(400).json({ error: 'Cannot proxy a proxied URL' });
    }

    // Log before decoding
    console.log('[ProxyImage] Decoding imageUrl:', imageUrl);
    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(imageUrl);
    console.log('[ProxyImage] Decoded URL:', {
      original: imageUrl,
      decoded: decodedUrl,
      timestamp: new Date().toISOString()
    });

    // Log before URL validation
    console.log('[ProxyImage] Validating decodedUrl:', decodedUrl);
    // Validate the URL
    let url;
    try {
      // Create URL from the decoded query parameter
      url = new URL(decodedUrl);
      // Log after successful URL creation
      console.log('[ProxyImage] URL object created:', url.toString());

      // After creating the URL object
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

    // Get the content type from the response
    const contentType = response.headers.get('content-type');
    console.log('[ProxyImage] Image fetched successfully:', {
      contentType,
      status: response.status,
      url: url.toString(),
      timestamp: new Date().toISOString()
    });

    // Set appropriate headers
    res.setHeader('Content-Type', contentType || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Stream the response
    response.body?.pipe(res);

    // After the fetch call
    console.log('[ProxyImage] Response details:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: url.toString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ProxyImage] Error in proxy-image handler:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Error processing image request' });
  }
}
