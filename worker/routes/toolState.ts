// Per-user Cloud Tool State routes (/api/tool-state GET & POST)

export interface ToolStateRouteDeps {
  request: Request;
  url: URL;
  env: any;
  db: any;
  now: string;
  corsHeaders: Record<string, string>;
  readVerifiedSession: (request: Request, env: any) => Promise<{ handle: string; isAdmin: boolean } | null>;
}

export async function handleToolStateRoutes(deps: ToolStateRouteDeps): Promise<Response | null> {
  const { request, url, env, db, now, corsHeaders, readVerifiedSession } = deps;

  if (url.pathname !== '/api/tool-state') return null;

  if (request.method === 'GET') {
    try {
      const handle = String(url.searchParams.get('handle') || '').trim().toLowerCase();
      const toolKey = String(url.searchParams.get('key') || '').trim();
      if (!handle) {
        return new Response(JSON.stringify({ error: 'Missing handle parameter.' }), {
          status: 400,
          headers: corsHeaders
        });
      }
      if (toolKey) {
        const row = await db
          .prepare('SELECT data, updated_at FROM user_tool_state WHERE handle_lower = ? AND tool_key = ?')
          .bind(handle, toolKey)
          .first();
        return new Response(
          JSON.stringify({
            status: 'ok',
            handle,
            toolKey,
            data: row?.data ? JSON.parse(String(row.data)) : null,
            updatedAt: row?.updated_at || null
          }),
          { headers: corsHeaders }
        );
      }
      const rows = await db
        .prepare('SELECT tool_key, data, updated_at FROM user_tool_state WHERE handle_lower = ?')
        .bind(handle)
        .all();
      const map: Record<string, any> = {};
      for (const r of (rows.results || []) as any[]) {
        try {
          map[String(r.tool_key)] = JSON.parse(String(r.data));
        } catch {}
      }
      return new Response(JSON.stringify({ status: 'ok', handle, states: map }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Failed to read tool state.' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  if (request.method === 'POST') {
    try {
      const body: any = await request.json();
      const handle = String(body.handle || '').trim().toLowerCase();
      const toolKey = String(body.toolKey || '').trim();
      if (!handle || !toolKey || body.data === undefined) {
        return new Response(JSON.stringify({ error: 'handle, toolKey, and data are required.' }), {
          status: 400,
          headers: corsHeaders
        });
      }
      const toolSession = await readVerifiedSession(request, env);
      if (!toolSession || (toolSession.handle.trim().toLowerCase() !== handle && !toolSession.isAdmin)) {
        return new Response(JSON.stringify({ error: 'You may only save tool state for your own signed in account.' }), {
          status: 403,
          headers: corsHeaders
        });
      }
      const serialized = JSON.stringify(body.data);
      if (serialized.length > 150000) {
        return new Response(JSON.stringify({ error: 'Tool state payload exceeds size limit.' }), {
          status: 413,
          headers: corsHeaders
        });
      }
      await db
        .prepare(
          'INSERT INTO user_tool_state (handle_lower, tool_key, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(handle_lower, tool_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at'
        )
        .bind(handle, toolKey, serialized, now)
        .run();
      return new Response(JSON.stringify({ status: 'ok', handle, toolKey, updatedAt: now }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Failed to save tool state.' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  return null;
}
