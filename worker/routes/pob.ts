// Stateless Path of Building URL Resolver (/api/pob/resolve)

export async function handlePobResolveRoute(
  request: Request,
  url: URL,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  if (url.pathname !== '/api/pob/resolve' || request.method !== 'GET') {
    return null;
  }

  try {
    const rawInput = String(url.searchParams.get('url') || '').trim();
    if (!rawInput) {
      return new Response(JSON.stringify({ error: 'Missing PoB URL parameter.' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    let normalized = rawInput;
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

    let fetchTarget = '';
    let canonicalUrl = normalized;

    const pobbinMatch = normalized.match(/^https?:\/\/(?:www\.)?pobb\.in\/([a-zA-Z0-9_-]{4,64})(?:\/raw)?\/?$/i);
    const pastebinMatch = normalized.match(/^https?:\/\/(?:www\.)?pastebin\.com\/(?:raw\/)?([a-zA-Z0-9]{4,32})\/?$/i);

    if (pobbinMatch) {
      fetchTarget = `https://pobb.in/${pobbinMatch[1]}/raw`;
      canonicalUrl = `https://pobb.in/${pobbinMatch[1]}`;
    } else if (pastebinMatch) {
      fetchTarget = `https://pastebin.com/raw/${pastebinMatch[1]}`;
      canonicalUrl = `https://pastebin.com/${pastebinMatch[1]}`;
    } else {
      return new Response(
        JSON.stringify({
          error:
            'Unsupported PoB URL. Paste a pobb.in link (e.g. https://pobb.in/abc123), pastebin.com link, or raw PoB export code.'
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const res = await fetch(fetchTarget, {
      headers: {
        'User-Agent': 'OAuth exile-ssf/1.0 (contact: exilessf.app)',
        Accept: 'text/plain, */*'
      }
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          error: `Could not fetch PoB code from ${canonicalUrl} (HTTP ${res.status}). Check that the link is public and valid.`
        }),
        { status: res.status === 404 ? 404 : 502, headers: corsHeaders }
      );
    }

    const code = (await res.text()).trim();
    if (!code || code.length < 20 || code.startsWith('<!DOCTYPE') || code.startsWith('<html')) {
      return new Response(
        JSON.stringify({ error: `The link ${canonicalUrl} did not return a valid Path of Building export code.` }),
        { status: 422, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ status: 'ok', sourceUrl: canonicalUrl, code }), {
      headers: corsHeaders
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to resolve PoB URL.' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
