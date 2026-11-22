// Modular Farming, Stash Snapshot, poe.ninja Pricing, and Cloud Stash Routes for Exile SSF

export interface FarmingRouteContext {
  url: URL;
  request: Request;
  env: any;
  now: string;
  corsHeaders: Record<string, string>;
  initD1Schema: (db: any) => Promise<void>;
  resolveOfficialLadderName: (leagueId: string, customName?: string | null) => string;
  readVerifiedSession: (request: Request, env: any) => Promise<{ handle: string; isAdmin: boolean } | null>;
}

export async function handleFarmingRoutes(ctx: FarmingRouteContext): Promise<Response | null> {
  const { url, request, env, now, corsHeaders, initD1Schema, resolveOfficialLadderName, readVerifiedSession } = ctx;

  // POST /api/farming/detect-leagues (Stateless GGG character league detector; never stores POESESSID)
  if (url.pathname === '/api/farming/detect-leagues' && request.method === 'POST') {
    try {
      const body: any = await request.json();
      const accountName = String(body.accountName || '').trim();
      const realm = String(body.realm || 'pc').trim().toLowerCase();
      const poesessid = String(body.poesessid || '').trim();

      if (!accountName || !poesessid) {
        return new Response(
          JSON.stringify({ error: 'Account Name and POESESSID are required to detect leagues.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const gggHeaders = {
        Cookie: `POESESSID=${poesessid}`,
        'User-Agent': 'OAuth exile-ssf/1.0 (contact: exilessf.app)',
        Accept: 'application/json'
      };

      const candidates = [accountName];
      if (accountName.includes('#')) candidates.push(accountName.replace('#', '-'));
      if (accountName.includes('-')) candidates.push(accountName.replace('-', '#'));

      let chars: any[] | null = null;
      let lastStatus = 0;
      let lastBody = '';
      let matchedAccount = accountName;

      for (const acct of candidates) {
        const urlChars = `https://www.pathofexile.com/character-window/get-characters?accountName=${encodeURIComponent(acct)}&realm=${encodeURIComponent(realm)}`;
        const res = await fetch(urlChars, { headers: gggHeaders });
        lastStatus = res.status;
        if (res.ok) {
          const parsed: any = await res.json();
          if (Array.isArray(parsed)) {
            chars = parsed;
            matchedAccount = acct;
            break;
          }
          lastBody = JSON.stringify(parsed).slice(0, 220);
        } else {
          lastBody = (await res.text()).slice(0, 220);
        }
      }

      if (!chars) {
        return new Response(
          JSON.stringify({
            error: `GGG returned HTTP ${lastStatus} while reading characters. (${lastBody || 'Check Account Name with #tag and POESESSID'})`
          }),
          { status: lastStatus || 400, headers: corsHeaders }
        );
      }

      const leagues = Array.from(new Set(chars.map((c: any) => String(c?.league || '').trim()).filter(Boolean)));
      return new Response(
        JSON.stringify({ status: 'ok', matchedAccount, characterCount: chars.length, leagues }),
        { headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Failed to detect leagues.' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  // POST /api/farming/stash-tabs (Stateless GGG stash tab discovery; never stores POESESSID)
  if (url.pathname === '/api/farming/stash-tabs' && request.method === 'POST') {
    try {
      const body: any = await request.json();
      const rawAccountName = String(body.accountName || '').trim();
      const rawLeague = String(body.league || '').trim();
      const realm = String(body.realm || 'pc').trim().toLowerCase();
      const poesessid = String(body.poesessid || '').trim();

      if (!rawAccountName || !rawLeague || !poesessid) {
        return new Response(
          JSON.stringify({ error: 'Account Name, League Name, and POESESSID are required.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const league =
        rawLeague.toUpperCase() === 'PL87651'
          ? 'Ravenwatch Covens of Umbra GSF (PL87651)'
          : resolveOfficialLadderName(rawLeague);

      const gggHeaders = {
        Cookie: `POESESSID=${poesessid}`,
        'User-Agent': 'OAuth exile-ssf/1.0 (contact: exilessf.app)',
        Accept: 'application/json'
      };

      const accountCandidates = [rawAccountName];
      if (rawAccountName.includes('#')) accountCandidates.push(rawAccountName.replace('#', '-'));

      let data: any = null;
      let lastStatus = 0;
      let lastRawError = '';
      let matchedAccount = rawAccountName;

      for (const acct of accountCandidates) {
        const endpoint = `https://www.pathofexile.com/character-window/get-stash-items?accountName=${encodeURIComponent(acct)}&realm=${encodeURIComponent(realm)}&league=${encodeURIComponent(league)}&tabs=1&tabIndex=0`;
        const gggRes = await fetch(endpoint, { headers: gggHeaders });
        lastStatus = gggRes.status;
        const rawText = await gggRes.text();
        if (gggRes.ok) {
          try {
            const parsed = JSON.parse(rawText);
            if (!parsed?.error) {
              data = parsed;
              matchedAccount = acct;
              break;
            }
            lastRawError = parsed.error.message || JSON.stringify(parsed.error);
          } catch {
            lastRawError = rawText.slice(0, 180);
          }
        } else {
          try {
            const parsedErr = JSON.parse(rawText);
            lastRawError = parsedErr?.error?.message || rawText.slice(0, 180);
          } catch {
            lastRawError =
              rawText.includes('Just a moment') || rawText.includes('cf-browser-verification')
                ? 'Cloudflare bot check blocked edge fetch to pathofexile.com'
                : rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
          }
        }
      }

      if (!data) {
        const errMsg =
          lastStatus === 429
            ? 'GGG rate limit reached (429). Wait 30 seconds and try again.'
            : `GGG Stash API HTTP ${lastStatus} for "${league}": ${lastRawError || 'Verify Account Name (with #tag), full League Name, and POESESSID.'}`;
        return new Response(JSON.stringify({ error: errMsg }), { status: lastStatus || 400, headers: corsHeaders });
      }

      const tabs = Array.isArray(data?.tabs)
        ? data.tabs.map((t: any) => ({
            index: Number(t.i),
            id: String(t.id || t.i),
            name: String(t.n || `Tab ${Number(t.i) + 1}`),
            type: String(t.type || 'NormalStash'),
            colour: t.colour || { r: 99, g: 102, b: 241 }
          }))
        : [];

      return new Response(
        JSON.stringify({ status: 'ok', matchedAccount, resolvedLeague: league, numTabs: Number(data?.numTabs || tabs.length), tabs }),
        { headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Failed to fetch stash tabs.' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  // POST /api/farming/stash-snapshot (Stateless 1 to 15 tab snapshot & Gem/Equipment bracket classifier)
  if (url.pathname === '/api/farming/stash-snapshot' && request.method === 'POST') {
    try {
      const body: any = await request.json();
      const accountName = String(body.accountName || '').trim();
      const rawLeague = String(body.league || '').trim();
      const league =
        rawLeague.toUpperCase() === 'PL87651'
          ? 'Ravenwatch Covens of Umbra GSF (PL87651)'
          : resolveOfficialLadderName(rawLeague);
      const realm = String(body.realm || 'pc').trim().toLowerCase();
      const poesessid = String(body.poesessid || '').trim();
      const tabIndices: number[] = Array.isArray(body.tabIndices)
        ? body.tabIndices.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n) && n >= 0).slice(0, 15)
        : [0];
      const tabNamesMap: Record<number, string> = body.tabNames && typeof body.tabNames === 'object' ? body.tabNames : {};

      if (!accountName || !league || !poesessid) {
        return new Response(
          JSON.stringify({ error: 'Account Name, League Name, and POESESSID are required.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const parsePropNumber = (it: any, propName: string): number => {
        if (!Array.isArray(it?.properties)) return 0;
        const found = it.properties.find((p: any) => String(p?.name || '').toLowerCase() === propName.toLowerCase());
        if (!found || !Array.isArray(found.values) || !found.values[0]) return 0;
        const match = String(found.values[0][0] || '').match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };

      const detectEquipmentBracket = (it: any, baseLow: string, iconLow: string): string => {
        if (iconLow.includes('/jewels/') || baseLow.includes('jewel')) return 'Jewels & Clusters';
        if (iconLow.includes('/flasks/') || baseLow.includes('flask') || baseLow.includes('tincture')) return 'Flasks & Tinctures';
        if (
          iconLow.includes('/rings/') ||
          iconLow.includes('/amulets/') ||
          iconLow.includes('/belts/') ||
          /(ring|amulet|talisman|belt|stygian vise|sash)$/i.test(baseLow)
        ) {
          return 'Jewellery';
        }
        if (
          iconLow.includes('/weapons/') ||
          iconLow.includes('/quivers/') ||
          /(sword|axe|mace|sceptre|wand|staff|staves|bow|claw|dagger|quiver|foil|maul|rapier|quarterstaff|crossbow|spear|flail)/i.test(baseLow)
        ) {
          return 'Weapons';
        }
        const hasArmour = parsePropNumber(it, 'Armour') > 0;
        const hasEvasion = parsePropNumber(it, 'Evasion Rating') > 0;
        const hasES = parsePropNumber(it, 'Energy Shield') > 0;
        const hasWard = parsePropNumber(it, 'Ward') > 0;
        if (hasWard) return 'Ward';
        if (hasArmour && hasEvasion && hasES) return 'Hybrid (AR/EV/ES)';
        if (hasArmour && hasES) return 'Hybrid (AR/ES)';
        if (hasArmour && hasEvasion) return 'Hybrid (AR/EV)';
        if (hasEvasion && hasES) return 'Hybrid (EV/ES)';
        if (hasArmour) return 'Armour';
        if (hasEvasion) return 'Evasion';
        if (hasES) return 'Energy Shield';
        if (iconLow.includes('/armours/')) return 'Armour & Shields';
        return 'Other Equipment';
      };

      const classifyStashItem = (it: any) => {
        const ft = Number(it.frameType ?? 0);
        const baseRaw = String(it.baseType || it.typeLine || '').replace(/<<[^>]+>>/g, '').trim();
        const nameRaw = String(it.name || '').replace(/<<[^>]+>>/g, '').trim();
        const base = baseRaw.toLowerCase();
        const name = nameRaw.toLowerCase();
        const iconLow = String(it.icon || '').toLowerCase();
        const full = `${name} ${base}`;
        const corrupted = Boolean(it.corrupted);

        if (ft === 4) {
          const gemLevel = parsePropNumber(it, 'Level');
          const gemQuality = parsePropNumber(it, 'Quality');
          const isVaal = Boolean(it?.hybrid?.isVaalGem) || base.startsWith('vaal ') || name.startsWith('vaal ');
          const isAwakened = base.startsWith('awakened ') || name.startsWith('awakened ');
          const isTransfigured =
            /\bof\s+[a-z]/i.test(baseRaw) &&
            !/(herald of|purity of|aura of|aspect of|seal of|orb of|brand of|banner)/i.test(baseRaw);

          let subCategory = 'Standard Gems';
          if (isAwakened) subCategory = 'Awakened Gems';
          else if (isVaal) subCategory = 'Vaal Gems';
          else if (isTransfigured) subCategory = 'Transfigured Gems';
          else if (gemLevel >= 20 || gemQuality >= 15) subCategory = 'High Level / Quality Gems';

          return { category: 'Gems', subCategory, gemLevel, gemQuality, isVaal, isTransfigured, isAwakened, corrupted };
        }
        if (ft === 3) {
          const eqBracket = detectEquipmentBracket(it, base, iconLow);
          const subCategory =
            eqBracket === 'Weapons'
              ? 'Unique Weapons'
              : eqBracket === 'Jewellery'
              ? 'Unique Jewellery'
              : eqBracket === 'Jewels & Clusters' || eqBracket === 'Flasks & Tinctures'
              ? 'Unique Jewels & Flasks'
              : `Unique ${eqBracket}`;
          return { category: 'Uniques', subCategory, gemLevel: 0, gemQuality: 0, isVaal: false, isTransfigured: false, isAwakened: false, corrupted };
        }
        if (ft === 6) {
          return { category: 'Div Cards', subCategory: 'Divination Cards', gemLevel: 0, gemQuality: 0, isVaal: false, isTransfigured: false, isAwakened: false, corrupted };
        }
        if (/(scarab|fragment|splinter|breachstone|emblem|invitation|mortal |sacrifice at|vessel|simulacrum|allflame)/i.test(full)) {
          const subCategory = full.includes('scarab')
            ? 'Scarabs'
            : /(splinter|breachstone|emblem|simulacrum)/i.test(full)
            ? 'Breach & Timeless'
            : 'Boss Fragments & Invitations';
          return { category: 'Scarabs & Fragments', subCategory, gemLevel: 0, gemQuality: 0, isVaal: false, isTransfigured: false, isAwakened: false, corrupted };
        }
        if (/(essence|fossil|resonator|catalyst|oil|tattoo|runegraft|omen|delirium orb|tainted)/i.test(full)) {
          const subCategory = full.includes('essence')
            ? 'Essences'
            : /(fossil|resonator)/i.test(full)
            ? 'Fossils & Resonators'
            : /(tattoo|runegraft)/i.test(full)
            ? 'Tattoos & Runegrafts'
            : 'Oils, Catalysts & Omens';
          return { category: 'Essences & Crafting', subCategory, gemLevel: 0, gemQuality: 0, isVaal: false, isTransfigured: false, isAwakened: false, corrupted };
        }
        if (/(map|waystone|logbook|blueprint|contract|inscribed ultimatum|djinn barya|chronicle)/i.test(base)) {
          const subCategory = /(blueprint|contract|logbook)/i.test(base)
            ? 'Heist & Expedition'
            : /(ultimatum|barya|chronicle)/i.test(base)
            ? 'League Keys'
            : 'Maps & Waystones';
          return { category: 'Maps & League Keys', subCategory, gemLevel: 0, gemQuality: 0, isVaal: false, isTransfigured: false, isAwakened: false, corrupted };
        }
        if (ft === 5 || /(orb|shard|scroll|chisel|bauble|whetstone|scrap|prism|mirror|sextant|vaals|marker|lifeforce)/i.test(full)) {
          const isHighTier = /(divine|mirror|exalted|fracturing|hinekora|sacred|annulment|veiled|awakener|chaos orb)/i.test(full);
          return {
            category: 'Currency',
            subCategory: isHighTier ? 'High Tier Currency' : 'Standard Currency',
            gemLevel: 0,
            gemQuality: 0,
            isVaal: false,
            isTransfigured: false,
            isAwakened: false,
            corrupted
          };
        }
        const eqBracket = detectEquipmentBracket(it, base, iconLow);
        return { category: 'Gear & Jewels', subCategory: eqBracket, gemLevel: 0, gemQuality: 0, isVaal: false, isTransfigured: false, isAwakened: false, corrupted };
      };

      const aggregated = new Map<string, any>();
      const fetchedTabs: number[] = [];

      for (let i = 0; i < tabIndices.length; i++) {
        const tabIdx = tabIndices[i];
        if (i > 0) await new Promise((r) => setTimeout(r, 320));
        const endpoint = `https://www.pathofexile.com/character-window/get-stash-items?accountName=${encodeURIComponent(accountName)}&realm=${encodeURIComponent(realm)}&league=${encodeURIComponent(league)}&tabs=0&tabIndex=${tabIdx}`;
        const gggRes = await fetch(endpoint, {
          headers: {
            Cookie: `POESESSID=${poesessid}`,
            'User-Agent': 'OAuth exile-ssf/1.0 (contact: exilessf.app)',
            Accept: 'application/json'
          }
        });
        if (!gggRes.ok) {
          if (gggRes.status === 429) {
            return new Response(
              JSON.stringify({ error: `GGG rate limited at tab ${tabIdx} (429). Wait 30s and retry.` }),
              { status: 429, headers: corsHeaders }
            );
          }
          continue;
        }
        const data: any = await gggRes.json();
        fetchedTabs.push(tabIdx);
        const rawItems = Array.isArray(data?.items) ? data.items : [];
        const tabLabel = tabNamesMap[tabIdx] || `Tab ${tabIdx + 1}`;

        for (const it of rawItems) {
          const cleanName = String(it.name || '').replace(/<<[^>]+>>/g, '').trim();
          const cleanBase = String(it.baseType || it.typeLine || '').replace(/<<[^>]+>>/g, '').trim();
          const displayName = cleanName && cleanName !== cleanBase ? `${cleanName} (${cleanBase})` : cleanName || cleanBase || 'Unknown Item';
          const shortName = cleanName || cleanBase || 'Unknown Item';
          const meta = classifyStashItem(it);
          const qty = Math.max(1, Number(it.stackSize || 1));
          const frameType = Number(it.frameType ?? 0);
          const key =
            meta.category === 'Gems'
              ? `${meta.category}::${displayName.toLowerCase()}::l${meta.gemLevel}::q${meta.gemQuality}::c${meta.corrupted ? 1 : 0}`
              : `${meta.category}::${meta.subCategory}::${displayName.toLowerCase()}`;

          const existing = aggregated.get(key);
          if (existing) {
            existing.quantity += qty;
          } else {
            aggregated.set(key, {
              key,
              name: displayName,
              shortName,
              baseType: cleanBase,
              category: meta.category,
              subCategory: meta.subCategory,
              gemLevel: meta.gemLevel,
              gemQuality: meta.gemQuality,
              isVaal: meta.isVaal,
              isTransfigured: meta.isTransfigured,
              isAwakened: meta.isAwakened,
              corrupted: meta.corrupted,
              quantity: qty,
              icon: typeof it.icon === 'string' ? it.icon : '',
              frameType,
              ilvl: Number(it.ilvl || 0),
              tabName: tabLabel
            });
          }
        }
      }

      const items = Array.from(aggregated.values()).sort((a, b) => b.quantity - a.quantity);
      return new Response(
        JSON.stringify({
          status: 'ok',
          snapshotAtIso: now,
          fetchedTabs,
          totalUniqueEntries: items.length,
          totalItemCount: items.reduce((sum, x) => sum + x.quantity, 0),
          items
        }),
        { headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Stash snapshot failed.' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  // GET /api/farming/ninja-prices?league=auto|Standard|Hardcore (60 min KV cache)
  if (url.pathname === '/api/farming/ninja-prices' && request.method === 'GET') {
    try {
      const requestedLeague = String(url.searchParams.get('league') || 'auto').trim();
      const forceRefresh = url.searchParams.get('refresh') === '1';

      let targetLeague = requestedLeague;
      if (!targetLeague || targetLeague.toLowerCase() === 'auto') {
        try {
          const idxRes = await fetch('https://poe.ninja/api/data/getindexstate', {
            headers: { 'User-Agent': 'OAuth exile-ssf/1.0 (contact: exilessf.app)', Accept: 'application/json' }
          });
          if (idxRes.ok) {
            const idxData: any = await idxRes.json();
            const leagues = Array.isArray(idxData?.economyLeagues) ? idxData.economyLeagues : [];
            const activeSoftcore = leagues.find(
              (l: any) => l?.name && !/^(standard|hardcore|ruthless)/i.test(String(l.name)) && !/hardcore/i.test(String(l.name))
            );
            targetLeague = activeSoftcore?.name || leagues[0]?.name || 'Standard';
          } else {
            targetLeague = 'Standard';
          }
        } catch {
          targetLeague = 'Standard';
        }
      }

      const cacheKey = `farming:ninja_prices:v1:${targetLeague.toLowerCase()}`;
      if (!forceRefresh && env.EXILE_KV) {
        const cached = await env.EXILE_KV.get(cacheKey);
        if (cached) return new Response(cached, { headers: corsHeaders });
      }

      const ninjaHeaders = { 'User-Agent': 'OAuth exile-ssf/1.0 (contact: exilessf.app)', Accept: 'application/json' };
      const currencyTypes = ['Currency', 'Fragment'];
      const itemTypes = [
        'Scarab', 'UniqueWeapon', 'UniqueArmour', 'UniqueAccessory', 'UniqueFlask', 'UniqueJewel',
        'DivinationCard', 'Essence', 'Fossil', 'Oil', 'SkillGem', 'Tattoo', 'Omen', 'UniqueMap'
      ];

      const fetches: Promise<{ kind: 'currency' | 'item'; type: string; data: any }>[] = [
        ...currencyTypes.map(async (type) => {
          const r = await fetch(`https://poe.ninja/api/data/currencyoverview?league=${encodeURIComponent(targetLeague)}&type=${encodeURIComponent(type)}`, { headers: ninjaHeaders });
          return { kind: 'currency' as const, type, data: r.ok ? await r.json() : null };
        }),
        ...itemTypes.map(async (type) => {
          const r = await fetch(`https://poe.ninja/api/data/itemoverview?league=${encodeURIComponent(targetLeague)}&type=${encodeURIComponent(type)}`, { headers: ninjaHeaders });
          return { kind: 'item' as const, type, data: r.ok ? await r.json() : null };
        })
      ];

      const results = await Promise.allSettled(fetches);
      const prices: Record<string, number> = { 'chaos orb': 1 };
      let divineChaos = 150;

      for (const settled of results) {
        if (settled.status !== 'fulfilled' || !settled.value?.data) continue;
        const { kind, type, data } = settled.value;
        const lines = Array.isArray(data?.lines) ? data.lines : [];

        if (kind === 'currency') {
          for (const line of lines) {
            const name = String(line?.currencyTypeName || '').trim().toLowerCase();
            const val = Number(line?.chaosEquivalent || 0);
            if (!name || val <= 0) continue;
            prices[name] = Math.round(val * 100) / 100;
            if (name === 'divine orb') divineChaos = Math.max(10, Math.round(val));
          }
        } else if (type === 'SkillGem') {
          for (const line of lines) {
            const name = String(line?.name || '').trim().toLowerCase();
            const val = Number(line?.chaosValue || 0);
            if (!name || val <= 0) continue;
            const lvl = Number(line?.gemLevel || 1);
            const qual = Number(line?.gemQuality || 0);
            const corr = line?.corrupted ? 1 : 0;
            const exactKey = `gem::${name}::l${lvl}::q${qual}::c${corr}`;
            if (!prices[exactKey] || val > prices[exactKey]) prices[exactKey] = Math.round(val * 100) / 100;
            if (!prices[name] || (lvl <= 1 && qual === 0 && corr === 0)) prices[name] = Math.round(val * 100) / 100;
          }
        } else {
          for (const line of lines) {
            const name = String(line?.name || '').trim().toLowerCase();
            const val = Number(line?.chaosValue || 0);
            if (!name || val <= 0) continue;
            const links = Number(line?.links || 0);
            if (links >= 5 && prices[name]) continue;
            if (!prices[name] || links < 5) prices[name] = Math.round(val * 100) / 100;
          }
        }
      }

      const payloadStr = JSON.stringify({ status: 'ok', league: targetLeague, divineChaos, itemCount: Object.keys(prices).length, syncedAtIso: now, prices });
      if (env.EXILE_KV && Object.keys(prices).length > 20) {
        await env.EXILE_KV.put(cacheKey, payloadStr, { expirationTtl: 3600 });
      }
      return new Response(payloadStr, { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Failed to fetch poe.ninja prices.' }), { status: 500, headers: corsHeaders });
    }
  }

  // GET /api/farming/stash-state?handle=... (Verified owner or admin only)
  if (url.pathname === '/api/farming/stash-state' && request.method === 'GET') {
    try {
      const session = await readVerifiedSession(request, env);
      const handle = String(url.searchParams.get('handle') || session?.handle || '').trim().replace(/^@/, '').toLowerCase();
      if (!session || (!session.isAdmin && session.handle.toLowerCase() !== handle)) {
        return new Response(JSON.stringify({ error: 'Sign in as the account owner to load private cloud stash state.' }), { status: 401, headers: corsHeaders });
      }
      if (!handle || !env.EXILE_DB) return new Response(JSON.stringify({ state: null }), { headers: corsHeaders });
      await initD1Schema(env.EXILE_DB);
      const row = await env.EXILE_DB.prepare(`SELECT data, updated_at FROM farming_stash_state WHERE handle_lower = ?`).bind(handle).first();
      return new Response(JSON.stringify({ state: row?.data ? JSON.parse(row.data) : null, updatedAtIso: row?.updated_at || null }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // POST /api/farming/stash-state (Requires verified exile_session matching handle or admin)
  if (url.pathname === '/api/farming/stash-state' && request.method === 'POST') {
    try {
      const session = await readVerifiedSession(request, env);
      const body: any = await request.json();
      const handle = String(body.handle || session?.handle || '').trim().replace(/^@/, '').toLowerCase();
      if (!session || (!session.isAdmin && session.handle.toLowerCase() !== handle)) {
        return new Response(JSON.stringify({ error: 'Unauthorized: sign in to save your cloud stash.' }), { status: 401, headers: corsHeaders });
      }
      const state = body.state;
      if (!handle || !state || typeof state !== 'object') {
        return new Response(JSON.stringify({ error: 'Missing handle or state payload' }), { status: 400, headers: corsHeaders });
      }
      const { poesessid: _omit, ...cleanState } = state;
      if (env.EXILE_DB) {
        await initD1Schema(env.EXILE_DB);
        await env.EXILE_DB.prepare(
          `INSERT INTO farming_stash_state (handle_lower, data, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(handle_lower) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
        ).bind(handle, JSON.stringify(cleanState), now).run();
      }
      return new Response(JSON.stringify({ status: 'ok', updatedAtIso: now }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // GET /api/farming/sessions?handle=...
  if (url.pathname === '/api/farming/sessions' && request.method === 'GET') {
    try {
      const handle = String(url.searchParams.get('handle') || '').trim().replace(/^@/, '').toLowerCase();
      if (!handle || !env.EXILE_DB) return new Response(JSON.stringify({ sessions: [] }), { headers: corsHeaders });
      await initD1Schema(env.EXILE_DB);
      const rows = await env.EXILE_DB.prepare(`SELECT data FROM farming_sessions WHERE handle_lower = ? ORDER BY created_at DESC LIMIT 30`).bind(handle).all();
      const sessions = (rows?.results || []).map((r: any) => JSON.parse(r.data));
      return new Response(JSON.stringify({ sessions }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // POST /api/farming/sessions (Requires verified exile_session matching handle or admin)
  if (url.pathname === '/api/farming/sessions' && request.method === 'POST') {
    try {
      const session = await readVerifiedSession(request, env);
      const body: any = await request.json();
      const entry = body.session;
      const handle = String(body.handle || entry?.handle || session?.handle || '').trim().replace(/^@/, '').toLowerCase();
      if (!session || (!session.isAdmin && session.handle.toLowerCase() !== handle)) {
        return new Response(JSON.stringify({ error: 'Unauthorized: sign in to save farming sessions.' }), { status: 401, headers: corsHeaders });
      }
      if (!handle || !entry?.id) {
        return new Response(JSON.stringify({ error: 'Missing handle or session id' }), { status: 400, headers: corsHeaders });
      }
      if (env.EXILE_DB) {
        await initD1Schema(env.EXILE_DB);
        await env.EXILE_DB.prepare(
          `INSERT INTO farming_sessions (id, handle_lower, data, created_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET data = excluded.data`
        ).bind(String(entry.id), handle, JSON.stringify(entry), String(entry.createdAtIso || now)).run();
      }
      return new Response(JSON.stringify({ status: 'ok', id: entry.id }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // DELETE /api/farming/sessions?id=... (Requires verified exile_session owning that session or admin)
  if (url.pathname === '/api/farming/sessions' && request.method === 'DELETE') {
    try {
      const session = await readVerifiedSession(request, env);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized: sign in to delete sessions.' }), { status: 401, headers: corsHeaders });
      }
      const id = String(url.searchParams.get('id') || '').trim();
      if (id && env.EXILE_DB) {
        await initD1Schema(env.EXILE_DB);
        if (session.isAdmin) {
          await env.EXILE_DB.prepare(`DELETE FROM farming_sessions WHERE id = ?`).bind(id).run();
        } else {
          await env.EXILE_DB.prepare(`DELETE FROM farming_sessions WHERE id = ? AND handle_lower = ?`)
            .bind(id, session.handle.toLowerCase())
            .run();
        }
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  return null;
}
