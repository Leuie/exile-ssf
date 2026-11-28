// Auth API routes (/api/auth/register, /api/auth/login, /api/auth/admin-login, /api/auth/logout, /api/auth/session)

export interface AuthRouteDeps {
  request: Request;
  url: URL;
  env: any;
  db: any;
  now: string;
  session: { handle: string; isAdmin: boolean } | null;
  corsHeaders: Record<string, string>;
  serverAdminSha256: string;
  hashPasswordPBKDF2: (password: string) => Promise<string>;
  verifyPassword: (password: string, storedHash: string) => Promise<{ valid: boolean; needsUpgrade: boolean }>;
  computeSha256Hex: (input: string) => Promise<string>;
  sanitizeUserAccountForClient: (acc: any) => any;
  buildSessionCookieHeader: (handle: string, isAdmin: boolean, env: any) => Promise<string>;
  buildClearSessionCookieHeader: () => string;
}

export async function handleAuthRoutes(deps: AuthRouteDeps): Promise<Response | null> {
  const {
    request,
    url,
    env,
    db,
    now,
    session,
    corsHeaders,
    serverAdminSha256,
    hashPasswordPBKDF2,
    verifyPassword,
    computeSha256Hex,
    sanitizeUserAccountForClient,
    buildSessionCookieHeader,
    buildClearSessionCookieHeader
  } = deps;

  // POST /api/auth/register (Cloudflare D1 PBKDF2 Registration)
  if (url.pathname === '/api/auth/register' && request.method === 'POST') {
    try {
      const body = (await request.json()) as any;
      const username = String(body.username || '').trim();
      const email = body.email ? String(body.email).trim() : '';
      const password = String(body.password || '');
      const userAccount = body.userAccount;
      const rosterEntry = body.rosterEntry;

      if (!username || !userAccount) {
        return new Response(JSON.stringify({ error: 'Missing username or account profile' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const userLower = username.toLowerCase();
      const emailLower = email ? email.toLowerCase() : null;
      const existingAcc = await db
        .prepare('SELECT username_lower FROM accounts WHERE username_lower = ?')
        .bind(userLower)
        .first();
      if (existingAcc && (!session || (!session.isAdmin && session.handle.toLowerCase() !== userLower))) {
        return new Response(JSON.stringify({ error: 'Username is already registered. Please sign in instead.' }), {
          status: 409,
          headers: corsHeaders
        });
      }

      const passwordHash = password ? await hashPasswordPBKDF2(password) : '';
      const safeUserObj = { ...sanitizeUserAccountForClient(userAccount), isAdmin: false };
      const record = {
        username,
        email: email || undefined,
        passwordHash,
        userAccount: { ...safeUserObj, passwordHash },
        rosterEntry
      };

      await db
        .prepare('INSERT OR REPLACE INTO accounts (username_lower, email_lower, data, updated_at) VALUES (?, ?, ?, ?)')
        .bind(userLower, emailLower, JSON.stringify(record), now)
        .run();

      const cookie = await buildSessionCookieHeader(username, false, env);
      return new Response(
        JSON.stringify({
          success: true,
          userAccount: safeUserObj,
          rosterEntry: record.rosterEntry
        }),
        { headers: { ...corsHeaders, 'Set-Cookie': cookie } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // POST /api/auth/login (Cloudflare D1 PBKDF2 Verification)
  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    try {
      const body = (await request.json()) as any;
      const identifier = String(body.identifier || body.username || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!identifier || !password) {
        return new Response(JSON.stringify({ error: 'Please provide username and password.' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const row = await db
        .prepare('SELECT username_lower, email_lower, data FROM accounts WHERE username_lower = ? OR email_lower = ?')
        .bind(identifier, identifier)
        .first();

      if (!row?.data) {
        return new Response(JSON.stringify({ error: 'Account not found. Check your username or register.' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const record = JSON.parse(row.data);
      const storedHash = record.passwordHash || record.userAccount?.passwordHash || '';
      const isAdminUser = Boolean(record.userAccount?.isAdmin);
      const isPasswordlessGoogle =
        Boolean(body.googleEmailSignIn) &&
        !isAdminUser &&
        !storedHash &&
        row.email_lower &&
        row.email_lower === identifier;

      if (!isPasswordlessGoogle) {
        const check = await verifyPassword(password, storedHash);
        if (!check.valid) {
          return new Response(JSON.stringify({ error: 'Incorrect password. Please try again.' }), {
            status: 401,
            headers: corsHeaders
          });
        }

        // Transparently upgrade legacy SHA-256 hashes to PBKDF2 in D1
        if (check.needsUpgrade) {
          const upgradedHash = await hashPasswordPBKDF2(password);
          record.passwordHash = upgradedHash;
          if (record.userAccount) record.userAccount.passwordHash = upgradedHash;
          await db
            .prepare('UPDATE accounts SET data = ?, updated_at = ? WHERE username_lower = ?')
            .bind(JSON.stringify(record), now, row.username_lower)
            .run();
        }
      }

      const cookie = await buildSessionCookieHeader(record.username || row.username_lower, isAdminUser, env);
      return new Response(
        JSON.stringify({
          success: true,
          userAccount: sanitizeUserAccountForClient(record.userAccount),
          rosterEntry: record.rosterEntry
        }),
        { headers: { ...corsHeaders, 'Set-Cookie': cookie } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // POST /api/auth/admin-login (Server side admin password verification -> HttpOnly signed admin cookie)
  if (url.pathname === '/api/auth/admin-login' && request.method === 'POST') {
    try {
      const body = (await request.json()) as any;
      const password = String(body.password || '').trim();
      if (!password) {
        return new Response(JSON.stringify({ error: 'Admin password required.' }), { status: 400, headers: corsHeaders });
      }
      const expectedHash = (env.ADMIN_PASSWORD_HASH || serverAdminSha256).trim().toLowerCase();
      const suppliedHash = (await computeSha256Hex(password)).toLowerCase();
      if (suppliedHash !== expectedHash) {
        return new Response(JSON.stringify({ error: 'Invalid Admin Password. Access denied.' }), {
          status: 401,
          headers: corsHeaders
        });
      }
      const cookie = await buildSessionCookieHeader('Leuie', true, env);
      return new Response(JSON.stringify({ success: true, handle: 'Leuie', isAdmin: true }), {
        headers: { ...corsHeaders, 'Set-Cookie': cookie }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // POST /api/auth/logout (Clears HttpOnly session cookie)
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Set-Cookie': buildClearSessionCookieHeader() }
    });
  }

  // GET /api/auth/session (Verify active HttpOnly session)
  if (url.pathname === '/api/auth/session' && request.method === 'GET') {
    return new Response(
      JSON.stringify({
        authenticated: Boolean(session),
        handle: session?.handle || null,
        isAdmin: Boolean(session?.isAdmin)
      }),
      { headers: corsHeaders }
    );
  }

  return null;
}
