export default async function handler(req, res) {
  console.log('[ProxyImage] ===== PROXY ENDPOINT CHECK =====');
  console.log('[ProxyImage] Proxy Configuration:', {
    endpoint: '/api/proxy-image',
    method: req.method,
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      'user-agent': req.headers['user-agent']
    },
    timestamp: new Date().toISOString()
  });

  console.log('[ProxyImage] ===== START OF REQUEST =====');
  console.log('[ProxyImage] Request details:', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  try {
    const imageUrl = req.query.url;

    console.log('[ProxyImage] Raw imageUrl:', {
      imageUrl,
      type: typeof imageUrl,
      timestamp: new Date().toISOString()
    });

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

    console.log('[ProxyImage] URL Analysis:', {
      originalUrl: imageUrl,
      containsProxyDomain: imageUrl.includes('cre-maps-builder.vercel.app'),
      containsProxyPath: imageUrl.includes('/api/proxy-image'),
      isAlreadyProxied: imageUrl.includes('cre-maps-builder.vercel.app') || imageUrl.includes('/api/proxy-image'),
      decodedUrl: decodeURIComponent(imageUrl),
      timestamp: new Date().toISOString()
    });

    console.log('[ProxyImage] URL Validation Check:', {
      originalUrl: imageUrl,
      isEncoded: imageUrl !== decodeURIComponent(imageUrl),
      containsProxy: imageUrl.includes('/api/proxy-image'),
      containsExternalDomain: imageUrl.includes('http'),
      timestamp: new Date().toISOString()
    });

    console.log('[ProxyImage] Image URL Verification:', {
      originalUrl: imageUrl,
      urlComponents: {
        protocol: imageUrl.startsWith('http') ? imageUrl.split('://')[0] : 'none',
        domain: imageUrl.includes('://') ? imageUrl.split('://')[1]?.split('/')[0] : 'none',
        path: imageUrl.includes('://') ? imageUrl.split('://')[1]?.split('/').slice(1).join('/') : imageUrl,
        queryParams: imageUrl.includes('?') ? imageUrl.split('?')[1] : 'none'
      },
      validation: {
        isEncoded: imageUrl !== decodeURIComponent(imageUrl),
        hasProtocol: imageUrl.startsWith('http'),
        hasDomain: imageUrl.includes('://'),
        hasQueryParams: imageUrl.includes('?'),
        isProxied: imageUrl.includes('/api/proxy-image') || imageUrl.includes('cre-maps-builder.vercel.app')
      },
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

    console.log('[ProxyImage] Fetch Configuration:', {
      targetUrl: url.toString(),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
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

    console.log('[ProxyImage] Response Analysis:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      timestamp: new Date().toISOString()
    });

    console.log('[ProxyImage] CORS Check:', {
      request: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        host: req.headers.host,
        'access-control-request-method': req.headers['access-control-request-method'],
        'access-control-request-headers': req.headers['access-control-request-headers']
      },
      response: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': 'Content-Type, Authorization',
        'access-control-max-age': '86400'
      },
      validation: {
        hasOrigin: !!req.headers.origin,
        hasReferer: !!req.headers.referer,
        isPreflight: req.method === 'OPTIONS',
        timestamp: new Date().toISOString()
      }
    });

    console.log('[ProxyImage] CORS Headers Set:', {
      headers: {
        'Content-Type': contentType || 'image/png',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ProxyImage] Proxy Error Details:', {
      error: error.message,
      stack: error.stack,
      url: req.query.url,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      error: 'Error processing image request',
      details: error.message,
      url: req.query.url
    });
  }
}
