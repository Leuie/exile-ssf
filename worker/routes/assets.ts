// Modular Asset Tracker, Stash Snapshot, poe.ninja Pricing, and Cloud Stash Routes for Exile SSF

export interface AssetRouteContext {
  url: URL;
  request: Request;
  env: any;
  now: string;
  corsHeaders: Record<string, string>;
  initD1Schema: (db: any) => Promise<void>;
  resolveOfficialLadderName: (leagueId: string, customName?: string | null) => string;
  readVerifiedSession: (request: Request, env: any) => Promise<{ handle: string; isAdmin: boolean } | null>;
}

export async function handleAssetRoutes(ctx: AssetRouteContext): Promise<Response | null> {
  const { url, request, env, now, corsHeaders, initD1Schema, resolveOfficialLadderName, readVerifiedSession } = ctx;

  const parsePropNumber = (it: any, propName: string): number => {
    if (!Array.isArray(it?.properties)) return 0;
    const found = it.properties.find((p: any) => String(p?.name || '').toLowerCase() === propName.toLowerCase());
    if (!found || !Array.isArray(found.values) || !found.values[0]) return 0;
    const match = String(found.values[0][0] || '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

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

  // POST /api/farming/character-xp (Stateless GGG character experience & level reader for Map Tracker XP/hr)
  if (url.pathname === '/api/farming/character-xp' && request.method === 'POST') {
    try {
      const body: any = await request.json();
      const accountName = String(body.accountName || '').trim();
      const realm = String(body.realm || 'pc').trim().toLowerCase();
      const poesessid = String(body.poesessid || '').trim();
      const leagueFilter = String(body.league || '').trim().toLowerCase();

      if (!accountName || !poesessid) {
        return new Response(
          JSON.stringify({ error: 'Account Name and POESESSID are required to read live character XP.' }),
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
      for (const acct of candidates) {
        const res = await fetch(
          `https://www.pathofexile.com/character-window/get-characters?accountName=${encodeURIComponent(acct)}&realm=${encodeURIComponent(realm)}`,
          { headers: gggHeaders }
        );
        lastStatus = res.status;
        if (res.ok) {
          const parsed: any = await res.json();
          if (Array.isArray(parsed)) {
            chars = parsed;
            break;
          }
        }
      }

      if (!chars) {
        return new Response(
          JSON.stringify({ error: `GGG returned HTTP ${lastStatus} while reading characters.` }),
          { status: lastStatus || 400, headers: corsHeaders }
        );
      }

      const mapped = chars
        .map((c: any) => ({
          name: String(c?.name || ''),
          league: String(c?.league || ''),
          className: String(c?.class || ''),
          level: Number(c?.level || 1),
          experience: Number(c?.experience || 0)
        }))
        .filter((c) => c.name && (!leagueFilter || c.league.toLowerCase().includes(leagueFilter)))
        .sort((a, b) => b.experience - a.experience);

      return new Response(
        JSON.stringify({ status: 'ok', polledAtIso: now, characters: mapped }),
        { headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Failed to poll character XP.' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  // POST /api/farming/character-gear (Stateless GGG get-items + get-passive-skills for Paperdoll, PoB Doctor & EHP Calc)
  if (url.pathname === '/api/farming/character-gear' && request.method === 'POST') {
    try {
      const body: any = await request.json();
      const rawAccountName = String(body.accountName || '').trim();
      const characterName = String(body.characterName || '').trim();
      const realm = String(body.realm || 'pc').trim().toLowerCase();
      const poesessid = String(body.poesessid || '').trim();

      if (!rawAccountName || !characterName || !poesessid) {
        return new Response(
          JSON.stringify({ error: 'Account Name, Character Name, and POESESSID are required.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const gggHeaders = {
        Cookie: `POESESSID=${poesessid}`,
        'User-Agent': 'OAuth exile-ssf/1.0 (contact: exilessf.app)',
        Accept: 'application/json'
      };

      const accountCandidates = [rawAccountName];
      if (rawAccountName.includes('#')) accountCandidates.push(rawAccountName.replace('#', '-'));

      let itemsData: any = null;
      let matchedAccount = rawAccountName;
      let lastStatus = 0;

      for (const acct of accountCandidates) {
        const ep = `https://www.pathofexile.com/character-window/get-items?accountName=${encodeURIComponent(acct)}&character=${encodeURIComponent(characterName)}&realm=${encodeURIComponent(realm)}`;
        const r = await fetch(ep, { headers: gggHeaders });
        lastStatus = r.status;
        if (r.ok) {
          const parsed: any = await r.json().catch(() => null);
          if (parsed && !parsed.error && Array.isArray(parsed.items)) {
            itemsData = parsed;
            matchedAccount = acct;
            break;
          }
        }
      }

      if (!itemsData) {
        return new Response(
          JSON.stringify({
            error:
              lastStatus === 429
                ? 'GGG rate limit reached (429). Wait 20 seconds and retry.'
                : `Could not load gear for "${characterName}" (HTTP ${lastStatus}). Verify Account Name, Character Name, and POESESSID.`
          }),
          { status: lastStatus || 400, headers: corsHeaders }
        );
      }

      // Also fetch passive tree & jewels in parallel (best effort)
      let passiveData: any = null;
      try {
        const pEp = `https://www.pathofexile.com/character-window/get-passive-skills?accountName=${encodeURIComponent(matchedAccount)}&character=${encodeURIComponent(characterName)}&realm=${encodeURIComponent(realm)}`;
        const pr = await fetch(pEp, { headers: gggHeaders });
        if (pr.ok) passiveData = await pr.json().catch(() => null);
      } catch {}

      const cleanStr = (s: any) => String(s || '').replace(/<<[^>]+>>/g, '').trim();
      const extractModStrings = (arr: any): string[] => {
        if (!Array.isArray(arr)) return [];
        const out: string[] = [];
        for (const entry of arr) {
          if (typeof entry === 'string') {
            const t = entry.trim();
            if (t) out.push(t);
          } else if (entry && typeof entry === 'object') {
            const t = String(entry.text || entry.mod || entry.name || entry.description || '').trim();
            if (t) out.push(t);
          }
        }
        return out;
      };
      const extractItemProps = (it: any): Array<{ name: string; value: string }> => {
        if (!Array.isArray(it?.properties)) return [];
        const out: Array<{ name: string; value: string }> = [];
        for (const p of it.properties) {
          const name = cleanStr(p?.name).replace(/\{(\d+)\}/g, '').trim();
          if (!name) continue;
          const vals = Array.isArray(p?.values)
            ? p.values.map((v: any) => (Array.isArray(v) ? String(v[0] ?? '') : String(v ?? ''))).filter(Boolean)
            : [];
          if (vals.length > 0) {
            out.push({ name, value: vals.join(', ') });
          } else if (name.length < 48) {
            out.push({ name, value: '' });
          }
        }
        return out.slice(0, 10);
      };
      const resolveSocketColour = (s: any): string => {
        const sc = String(s?.sColour || '').trim().toUpperCase();
        if (['R', 'G', 'B', 'A', 'DV'].includes(sc)) return sc;
        const attr = String(s?.attr || '').trim().toUpperCase();
        if (attr === 'S') return 'R';
        if (attr === 'D') return 'G';
        if (attr === 'I') return 'B';
        if (attr === 'A') return 'A';
        if (sc === 'W' || attr === 'G') return 'W';
        return 'W';
      };

      const rawItems: any[] = Array.isArray(itemsData.items) ? itemsData.items : [];
      const equippedSlots = new Set([
        'Weapon', 'Offhand', 'Weapon2', 'Offhand2', 'Helm', 'BodyArmour',
        'Amulet', 'Ring', 'Ring2', 'Gloves', 'Belt', 'Boots', 'Flask', 'Trinket'
      ]);

      const equipped: any[] = [];
      let voidstoneCount = 0;
      const estimatedVitals = {
        flatLife: 0,
        flatEs: 0,
        fireRes: 0,
        coldRes: 0,
        lightningRes: 0,
        chaosRes: 0,
        suppress: 0
      };

      for (const it of rawItems) {
        const invId = String(it?.inventoryId || '');
        const fullName = `${cleanStr(it?.name)} ${cleanStr(it?.typeLine)}`.toLowerCase();
        if (fullName.includes('voidstone')) voidstoneCount += 1;
        if (!equippedSlots.has(invId)) continue;

        const implicitMods = extractModStrings(it?.implicitMods);
        const explicitMods = extractModStrings(it?.explicitMods);
        const craftedMods = extractModStrings(it?.craftedMods);
        const enchantMods = extractModStrings(it?.enchantMods);
        const fracturedMods = extractModStrings(it?.fracturedMods);
        const utilityMods = extractModStrings(it?.utilityMods);
        const allMods: string[] = [
          ...implicitMods,
          ...explicitMods,
          ...craftedMods,
          ...fracturedMods,
          ...utilityMods
        ];

        if (invId !== 'Weapon2' && invId !== 'Offhand2' && invId !== 'Flask') {
          for (const mod of allMods) {
            const lifeM = mod.match(/\+(\d+) to maximum Life/i);
            if (lifeM) estimatedVitals.flatLife += Number(lifeM[1]);
            const esM = mod.match(/\+(\d+) to maximum Energy Shield/i);
            if (esM) estimatedVitals.flatEs += Number(esM[1]);
            const allResM = mod.match(/\+(\d+)% to all Elemental Resistances/i);
            if (allResM) {
              const v = Number(allResM[1]);
              estimatedVitals.fireRes += v;
              estimatedVitals.coldRes += v;
              estimatedVitals.lightningRes += v;
            }
            const fRes = mod.match(/\+(\d+)% to Fire Resistance/i);
            if (fRes) estimatedVitals.fireRes += Number(fRes[1]);
            const cRes = mod.match(/\+(\d+)% to Cold Resistance/i);
            if (cRes) estimatedVitals.coldRes += Number(cRes[1]);
            const lRes = mod.match(/\+(\d+)% to Lightning Resistance/i);
            if (lRes) estimatedVitals.lightningRes += Number(lRes[1]);
            const twoRes = mod.match(/\+(\d+)% to (Fire|Cold|Lightning) and (Fire|Cold|Lightning) Resistances/i);
            if (twoRes) {
              const v = Number(twoRes[1]);
              const r1 = twoRes[2].toLowerCase();
              const r2 = twoRes[3].toLowerCase();
              if (r1 === 'fire' || r2 === 'fire') estimatedVitals.fireRes += v;
              if (r1 === 'cold' || r2 === 'cold') estimatedVitals.coldRes += v;
              if (r1 === 'lightning' || r2 === 'lightning') estimatedVitals.lightningRes += v;
            }
            const chRes = mod.match(/\+(\d+)% to Chaos Resistance/i);
            if (chRes) estimatedVitals.chaosRes += Number(chRes[1]);
            const supM = mod.match(/\+(\d+)% chance to Suppress Spell Damage/i);
            if (supM) estimatedVitals.suppress += Number(supM[1]);
          }
        }

        const sockets = Array.isArray(it?.sockets)
          ? it.sockets.map((s: any) => ({ group: Number(s?.group ?? 0), sColour: resolveSocketColour(s) }))
          : [];
        const socketedGems = Array.isArray(it?.socketedItems)
          ? it.socketedItems.map((g: any) => ({
              name: cleanStr(g?.typeLine || g?.baseType || g?.name),
              icon: typeof g?.icon === 'string' ? g.icon : '',
              colour: String(g?.colour || 'W').toUpperCase(),
              socket: Number(g?.socket ?? 0),
              level: parsePropNumber(g, 'Level'),
              quality: parsePropNumber(g, 'Quality'),
              support: Boolean(g?.support),
              description: cleanStr(g?.secDescrText || ''),
              mods: extractModStrings(g?.explicitMods).slice(0, 6)
            }))
          : [];

        equipped.push({
          id: String(it?.id || `${invId}-${it?.x ?? 0}`),
          inventoryId: invId,
          x: Number(it?.x ?? 0),
          name: cleanStr(it?.name),
          baseType: cleanStr(it?.baseType || it?.typeLine),
          typeLine: cleanStr(it?.typeLine),
          icon: typeof it?.icon === 'string' ? it.icon : '',
          frameType: Number(it?.frameType ?? 0),
          ilvl: Number(it?.ilvl ?? 0),
          corrupted: Boolean(it?.corrupted),
          properties: extractItemProps(it),
          sockets,
          socketedGems,
          implicitMods,
          explicitMods: [...utilityMods, ...explicitMods],
          craftedMods,
          enchantMods,
          fracturedMods
        });
      }

      const passiveHashes = Array.isArray(passiveData?.hashes) ? passiveData.hashes : [];
      const passiveJewels = Array.isArray(passiveData?.items) ? passiveData.items : [];
      const charInfo = itemsData.character || {};

      return new Response(
        JSON.stringify({
          status: 'ok',
          syncedAtIso: now,
          character: {
            name: String(charInfo.name || characterName),
            league: String(charInfo.league || ''),
            className: String(charInfo.class || ''),
            level: Number(charInfo.level || 1),
            experience: Number(charInfo.experience || 0)
          },
          equipped,
          passives: {
            allocatedCount: passiveHashes.length,
            jewelCount: passiveJewels.length,
            voidstoneCount: Math.min(4, voidstoneCount)
          },
          estimatedVitals
        }),
        { headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Failed to fetch character gear.' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  // POST /api/farming/guild-stash (Stateless GGG Guild Stash tab list & scanner for Private League Wishlist matching)
  if (url.pathname === '/api/farming/guild-stash' && request.method === 'POST') {
    try {
      const body: any = await request.json();
      const rawAccountName = String(body.accountName || '').trim();
      const rawLeague = String(body.league || '').trim();
      const realm = String(body.realm || 'pc').trim().toLowerCase();
      const poesessid = String(body.poesessid || '').trim();
      const tabIndices: number[] = Array.isArray(body.tabIndices)
        ? body.tabIndices.map(Number).filter((n: number) => Number.isFinite(n) && n >= 0).slice(0, 10)
        : [0];

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

      const acct = rawAccountName.includes('#') ? rawAccountName.replace('#', '-') : rawAccountName;
      const items: any[] = [];
      let tabs: any[] = [];

      for (let i = 0; i < tabIndices.length; i++) {
        const idx = tabIndices[i];
        const ep = `https://www.pathofexile.com/character-window/get-guild-stash-items?accountName=${encodeURIComponent(acct)}&realm=${encodeURIComponent(realm)}&league=${encodeURIComponent(league)}&tabs=${i === 0 ? 1 : 0}&tabIndex=${idx}`;
        const r = await fetch(ep, { headers: gggHeaders });
        if (!r.ok) {
          if (i === 0) {
            return new Response(
              JSON.stringify({ error: `GGG Guild Stash API returned HTTP ${r.status}. Make sure you belong to a guild in "${league}".` }),
              { status: r.status, headers: corsHeaders }
            );
          }
          continue;
        }
        const data: any = await r.json().catch(() => null);
        if (i === 0 && Array.isArray(data?.tabs)) {
          tabs = data.tabs.map((t: any) => ({
            index: Number(t.i),
            name: String(t.n || `Guild Tab ${Number(t.i) + 1}`),
            type: String(t.type || 'NormalStash')
          }));
        }
        const tabLabel = tabs.find((t) => t.index === idx)?.name || `Guild Tab ${idx + 1}`;
        for (const it of Array.isArray(data?.items) ? data.items : []) {
          const cleanName = String(it?.name || '').replace(/<<[^>]+>>/g, '').trim();
          const cleanBase = String(it?.baseType || it?.typeLine || '').replace(/<<[^>]+>>/g, '').trim();
          const shortName = cleanName || cleanBase || 'Unknown Item';
          const qty = Math.max(1, Number(it?.stackSize || 1));
          items.push({
            id: String(it?.id || `${idx}-${shortName}-${items.length}`),
            name: cleanName,
            shortName,
            baseType: cleanBase,
            quantity: qty,
            stackSize: qty,
            ilvl: Number(it?.ilvl || 0),
            icon: typeof it?.icon === 'string' ? it.icon : '',
            tabIndex: idx,
            tabName: tabLabel,
            frameType: Number(it?.frameType ?? 0)
          });
        }
      }

      return new Response(
        JSON.stringify({ status: 'ok', league, tabs, items, syncedAtIso: now }),
        { headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Guild stash scan failed.' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  // POST /api/farming/equipped-assets (Stateless GGG scan of all equipped gear & socketed gems for characters in a league)
  if (url.pathname === '/api/farming/equipped-assets' && request.method === 'POST') {
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
      if (rawAccountName.includes('-')) accountCandidates.push(rawAccountName.replace('-', '#'));

      let chars: any[] | null = null;
      let matchedAccount = rawAccountName;
      for (const acct of accountCandidates) {
        const res = await fetch(
          `https://www.pathofexile.com/character-window/get-characters?accountName=${encodeURIComponent(acct)}&realm=${encodeURIComponent(realm)}`,
          { headers: gggHeaders }
        );
        if (res.ok) {
          const parsed: any = await res.json().catch(() => null);
          if (Array.isArray(parsed)) {
            chars = parsed;
            matchedAccount = acct;
            break;
          }
        }
      }

      if (!chars) {
        return new Response(
          JSON.stringify({ status: 'ok', charactersScanned: [], items: [] }),
          { headers: corsHeaders }
        );
      }

      const targetLow = league.toLowerCase();
      const rawLow = rawLeague.toLowerCase();
      const leagueChars = chars
        .filter((c: any) => {
          const cLeague = String(c?.league || '').trim().toLowerCase();
          return (
            cLeague === targetLow ||
            cLeague === rawLow ||
            (rawLow.length >= 4 && cLeague.includes(rawLow)) ||
            (targetLow.length >= 4 && cLeague.includes(targetLow))
          );
        })
        .sort((a: any, b: any) => Number(b?.level || 0) - Number(a?.level || 0))
        .slice(0, 6);

      const equippedSlots = new Set([
        'Weapon', 'Offhand', 'Weapon2', 'Offhand2', 'Helm', 'BodyArmour',
        'Amulet', 'Ring', 'Ring2', 'Gloves', 'Belt', 'Boots', 'Flask', 'Trinket'
      ]);

      const aggregated = new Map<string, any>();
      const charactersScanned: string[] = [];

      const pushAsset = (entry: any) => {
        const existing = aggregated.get(entry.key);
        if (existing) {
          existing.quantity += entry.quantity;
        } else {
          aggregated.set(entry.key, entry);
        }
      };

      for (let i = 0; i < leagueChars.length; i++) {
        const ch = leagueChars[i];
        const charName = String(ch?.name || '').trim();
        if (!charName) continue;
        if (i > 0) await new Promise((r) => setTimeout(r, 260));

        const gRes = await fetch(
          `https://www.pathofexile.com/character-window/get-items?accountName=${encodeURIComponent(matchedAccount)}&character=${encodeURIComponent(charName)}&realm=${encodeURIComponent(realm)}`,
          { headers: gggHeaders }
        );
        if (!gRes.ok) continue;
        const gData: any = await gRes.json().catch(() => null);
        if (!gData || !Array.isArray(gData.items)) continue;
        charactersScanned.push(charName);
        const tabLabel = `Equipped (${charName})`;

        for (const it of gData.items) {
          const invId = String(it?.inventoryId || '');
          if (!equippedSlots.has(invId)) continue;

          const cleanName = String(it?.name || '').replace(/<<[^>]+>>/g, '').trim();
          const cleanBase = String(it?.baseType || it?.typeLine || '').replace(/<<[^>]+>>/g, '').trim();
          const shortName = cleanName || cleanBase || 'Unknown Item';
          const displayName = cleanName && cleanName !== cleanBase ? `${cleanName} (${cleanBase})` : shortName;
          const ft = Number(it?.frameType ?? 0);
          const ilvl = Number(it?.ilvl || 0);
          const quality = parsePropNumber(it, 'Quality');
          const corrupted = Boolean(it?.corrupted);

          const socketGroups = new Map<number, number>();
          if (Array.isArray(it?.sockets)) {
            for (const s of it.sockets) {
              const g = Number(s?.group ?? 0);
              socketGroups.set(g, (socketGroups.get(g) || 0) + 1);
            }
          }
          const links = socketGroups.size > 0 ? Math.max(...Array.from(socketGroups.values())) : 0;
          const isUnique = ft === 3 || ft === 9 || ft === 10;
          const isFlask = invId === 'Flask' || /flask|tincture/i.test(cleanBase);
          const category = isUnique ? 'Uniques' : 'Gear & Jewels';
          const subCategory = isFlask
            ? isUnique ? 'Unique Flasks & Tinctures' : 'Flasks & Tinctures'
            : ['Ring', 'Ring2', 'Amulet', 'Belt'].includes(invId)
            ? isUnique ? 'Unique Jewellery' : 'Jewellery'
            : ['Weapon', 'Weapon2'].includes(invId)
            ? isUnique ? 'Unique Weapons' : 'Weapons'
            : isUnique
            ? 'Unique Armour & Shields'
            : 'Armour & Shields';

          const key = `equipped::${charName.toLowerCase()}::${invId}::${displayName.toLowerCase()}::${links}L`;
          pushAsset({
            key,
            name: displayName,
            shortName,
            baseType: cleanBase,
            category,
            subCategory,
            gemLevel: 0,
            gemQuality: 0,
            quality,
            maxStackSize: 1,
            links,
            mapTier: 0,
            influenced: Boolean(it?.influences || it?.shaper || it?.elder || it?.fractured || it?.synthesised),
            isVaal: false,
            isTransfigured: false,
            isAwakened: false,
            isExceptional: false,
            corrupted,
            quantity: 1,
            icon: typeof it?.icon === 'string' ? it.icon : '',
            frameType: ft,
            ilvl,
            tabName: tabLabel
          });

          // Also count socketed gems worn inside equipped gear
          if (Array.isArray(it?.socketedItems)) {
            for (const g of it.socketedItems) {
              const gName = String(g?.typeLine || g?.baseType || g?.name || '').replace(/<<[^>]+>>/g, '').trim();
              if (!gName) continue;
              const gLvl = parsePropNumber(g, 'Level');
              const gQual = parsePropNumber(g, 'Quality');
              const gCorrupted = Boolean(g?.corrupted);
              const gLow = gName.toLowerCase();
              const isAwakened = gLow.startsWith('awakened ');
              const isVaal = gLow.startsWith('vaal ');
              const isExceptional = /\b(empower|enlighten|enhance)\b/i.test(gLow);
              const isTransfigured = /\bof\s+[a-z]/i.test(gName) && !/(herald of|purity of|aura of|aspect of)/i.test(gLow);
              const gSub = isAwakened
                ? 'Awakened Gems'
                : isExceptional
                ? 'Exceptional Gems'
                : isVaal
                ? 'Vaal Gems'
                : isTransfigured
                ? 'Transfigured Gems'
                : 'Standard Gems';
              const gKey = `equipped::Gems::${gName.toLowerCase()}::l${gLvl}::q${gQual}::c${gCorrupted ? 1 : 0}`;
              pushAsset({
                key: gKey,
                name: gName,
                shortName: gName,
                baseType: gName,
                category: 'Gems',
                subCategory: gSub,
                gemLevel: gLvl,
                gemQuality: gQual,
                quality: gQual,
                maxStackSize: 1,
                links: 0,
                mapTier: 0,
                influenced: false,
                isVaal,
                isTransfigured,
                isAwakened,
                isExceptional,
                corrupted: gCorrupted,
                quantity: 1,
                icon: typeof g?.icon === 'string' ? g.icon : '',
                frameType: 4,
                ilvl: 0,
                tabName: tabLabel
              });
            }
          }
        }
      }

      const items = Array.from(aggregated.values());
      return new Response(
        JSON.stringify({ status: 'ok', charactersScanned, items, syncedAtIso: now }),
        { headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Equipped gear scan failed.' }), {
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
        ? body.tabIndices.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n) && n >= 0).slice(0, 18)
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
          const isExceptional = /\b(empower|enlighten|enhance)\b/i.test(full);
          const isTransfigured =
            /\bof\s+[a-z]/i.test(baseRaw) &&
            !/(herald of|purity of|aura of|aspect of|seal of|orb of|brand of|banner)/i.test(baseRaw);

          let subCategory = 'Standard Gems';
          if (isAwakened) subCategory = 'Awakened Gems';
          else if (isExceptional) subCategory = 'Exceptional Gems';
          else if (isVaal) subCategory = 'Vaal Gems';
          else if (isTransfigured) subCategory = 'Transfigured Gems';
          else if (gemLevel >= 20 || gemQuality >= 15) subCategory = 'High Level / Quality Gems';

          return { category: 'Gems', subCategory, gemLevel, gemQuality, quality: gemQuality, isVaal, isTransfigured, isAwakened, isExceptional, corrupted };
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
          const meta: any = classifyStashItem(it);
          const itemQuality = meta.category === 'Gems' ? meta.gemQuality : parsePropNumber(it, 'Quality');
          const itemIlvl = Number(it.ilvl || 0);
          const mapTier = parsePropNumber(it, 'Map Tier');
          const maxStackSize = Number(it.maxStackSize || 0);
          const socketGroups = new Map<number, number>();
          if (Array.isArray(it?.sockets)) {
            for (const s of it.sockets) {
              const g = Number(s?.group ?? 0);
              socketGroups.set(g, (socketGroups.get(g) || 0) + 1);
            }
          }
          const links = socketGroups.size > 0 ? Math.max(...Array.from(socketGroups.values())) : 0;
          const influenced = Boolean(
            it?.influences || it?.shaper || it?.elder || it?.fractured || it?.synthesised
          );
          const qty = Math.max(1, Number(it.stackSize || 1));
          const frameType = Number(it.frameType ?? 0);
          const isFlaskItem = meta.subCategory === 'Flasks & Tinctures' || /flask|tincture/i.test(cleanBase);
          const key =
            meta.category === 'Gems'
              ? `${meta.category}::${displayName.toLowerCase()}::l${meta.gemLevel}::q${meta.gemQuality}::c${meta.corrupted ? 1 : 0}`
              : isFlaskItem
              ? `${meta.category}::${meta.subCategory}::${displayName.toLowerCase()}::ilvl${itemIlvl}::q${itemQuality}`
              : links >= 5
              ? `${meta.category}::${meta.subCategory}::${displayName.toLowerCase()}::${links}L`
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
              quality: itemQuality,
              maxStackSize,
              links,
              mapTier,
              influenced,
              isVaal: meta.isVaal,
              isTransfigured: meta.isTransfigured,
              isAwakened: meta.isAwakened,
              isExceptional: Boolean(meta.isExceptional),
              corrupted: meta.corrupted,
              quantity: qty,
              icon: typeof it.icon === 'string' ? it.icon : '',
              frameType,
              ilvl: itemIlvl,
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

  // GET /api/farming/ninja-prices?league=auto|Standard|Hardcore&scope=all|icons (60 min KV cache + 30 min browser cache)
  if (url.pathname === '/api/farming/ninja-prices' && request.method === 'GET') {
    try {
      const requestedLeague = String(url.searchParams.get('league') || 'auto').trim();
      const scope = String(url.searchParams.get('scope') || 'all').trim().toLowerCase();
      const forceRefresh = url.searchParams.get('refresh') === '1';
      const ninjaHeaders = { 'User-Agent': 'OAuth exile-ssf/1.0 (contact: exilessf.app)', Accept: 'application/json' };
      const cacheableHeaders = {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600'
      };

      let targetLeague = requestedLeague;
      if (!targetLeague || targetLeague.toLowerCase() === 'auto') {
        try {
          const idxRes = await fetch('https://poe.ninja/poe1/api/data/index-state', { headers: ninjaHeaders });
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

      const cacheKey = `farming:ninja_prices:v3:${targetLeague.toLowerCase()}`;
      const iconsCacheKey = `farming:ninja_icons:v3:${targetLeague.toLowerCase()}`;
      if (!forceRefresh && env.EXILE_KV) {
        if (scope === 'icons') {
          const cachedIcons = await env.EXILE_KV.get(iconsCacheKey);
          if (cachedIcons) return new Response(cachedIcons, { headers: cacheableHeaders });
        }
        const cached = await env.EXILE_KV.get(cacheKey);
        if (cached) {
          if (scope === 'icons') {
            try {
              const parsed = JSON.parse(cached);
              const iconsPayload = JSON.stringify({
                status: 'ok',
                league: parsed.league || targetLeague,
                iconCount: Object.keys(parsed.icons || {}).length,
                syncedAtIso: parsed.syncedAtIso || now,
                icons: parsed.icons || {}
              });
              await env.EXILE_KV.put(iconsCacheKey, iconsPayload, { expirationTtl: 3600 });
              return new Response(iconsPayload, { headers: cacheableHeaders });
            } catch {}
          }
          return new Response(cached, { headers: cacheableHeaders });
        }
      }

      const normalizeIconUrl = (raw: any): string => {
        const s = String(raw || '').trim();
        if (!s) return '';
        if (s.startsWith('http://') || s.startsWith('https://')) return s;
        if (s.startsWith('/')) return `https://web.poecdn.com${s}`;
        return '';
      };

      const exchangeTypes = [
        'Currency', 'Fragment', 'Scarab', 'DivinationCard', 'Essence', 'Fossil', 'Oil', 'Tattoo', 'Omen', 'DeliriumOrb'
      ];
      const stashTypes = [
        'UniqueWeapon', 'UniqueArmour', 'UniqueAccessory', 'UniqueFlask', 'UniqueJewel', 'SkillGem', 'UniqueMap', 'BaseType'
      ];

      const fetches: Promise<{ kind: 'exchange' | 'stash'; type: string; data: any }>[] = [
        ...exchangeTypes.map(async (type) => {
          const r = await fetch(
            `https://poe.ninja/poe1/api/economy/exchange/current/overview?league=${encodeURIComponent(targetLeague)}&type=${encodeURIComponent(type)}`,
            { headers: ninjaHeaders }
          );
          return { kind: 'exchange' as const, type, data: r.ok ? await r.json() : null };
        }),
        ...stashTypes.map(async (type) => {
          const r = await fetch(
            `https://poe.ninja/poe1/api/economy/stash/current/item/overview?league=${encodeURIComponent(targetLeague)}&type=${encodeURIComponent(type)}`,
            { headers: ninjaHeaders }
          );
          return { kind: 'stash' as const, type, data: r.ok ? await r.json() : null };
        })
      ];

      const results = await Promise.allSettled(fetches);
      const prices: Record<string, number> = { 'chaos orb': 1 };
      const icons: Record<string, string> = {};
      let divineChaos = 150;

      for (const settled of results) {
        if (settled.status !== 'fulfilled' || !settled.value?.data) continue;
        const { kind, type, data } = settled.value;
        const lines = Array.isArray(data?.lines) ? data.lines : [];

        if (kind === 'exchange') {
          if (type === 'Currency' && Number(data?.core?.rates?.divine || 0) > 0) {
            divineChaos = Math.max(10, Math.round(1 / Number(data.core.rates.divine)));
          }
          const idToItem = new Map<string, { name: string; icon: string }>();
          const itemsArr = [
            ...(Array.isArray(data?.items) ? data.items : []),
            ...(Array.isArray(data?.core?.items) ? data.core.items : [])
          ];
          for (const item of itemsArr) {
            const id = String(item?.id || '').trim();
            const name = String(item?.name || '').trim().toLowerCase();
            const icon = normalizeIconUrl(item?.image || item?.icon);
            if (id && name) idToItem.set(id, { name, icon });
            if (name && icon && !icons[name]) icons[name] = icon;
          }
          for (const line of lines) {
            const id = String(line?.id || '').trim();
            const meta = idToItem.get(id);
            const name = meta?.name || String(line?.currencyTypeName || line?.name || '').trim().toLowerCase();
            const val = Number(line?.primaryValue ?? line?.chaosEquivalent ?? 0);
            if (!name || val <= 0) continue;
            prices[name] = Math.round(val * 100) / 100;
            if (name === 'divine orb') divineChaos = Math.max(10, Math.round(val));
          }
        } else if (type === 'BaseType') {
          for (const line of lines) {
            const name = String(line?.name || '').trim().toLowerCase();
            const ic = normalizeIconUrl(line?.icon);
            if (name && ic && !icons[name]) icons[name] = ic;
          }
        } else if (type === 'SkillGem') {
          for (const line of lines) {
            const name = String(line?.name || '').trim().toLowerCase();
            const ic = normalizeIconUrl(line?.icon);
            if (name && ic && !icons[name]) icons[name] = ic;
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
            const ic = normalizeIconUrl(line?.icon);
            if (name && ic && !icons[name]) icons[name] = ic;
            const val = Number(line?.chaosValue || 0);
            if (!name || val <= 0) continue;
            const links = Number(line?.links || 0);
            if (links >= 5 && prices[name]) continue;
            if (!prices[name] || links < 5) prices[name] = Math.round(val * 100) / 100;
          }
        }
      }

      const payloadStr = JSON.stringify({ status: 'ok', league: targetLeague, divineChaos, itemCount: Object.keys(prices).length, iconCount: Object.keys(icons).length, syncedAtIso: now, prices, icons });
      const iconsPayloadStr = JSON.stringify({ status: 'ok', league: targetLeague, iconCount: Object.keys(icons).length, syncedAtIso: now, icons });
      if (env.EXILE_KV && Object.keys(prices).length > 20) {
        await env.EXILE_KV.put(cacheKey, payloadStr, { expirationTtl: 3600 });
        await env.EXILE_KV.put(iconsCacheKey, iconsPayloadStr, { expirationTtl: 3600 });
      }
      return new Response(scope === 'icons' ? iconsPayloadStr : payloadStr, { headers: cacheableHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Failed to fetch poe.ninja prices.' }), { status: 500, headers: corsHeaders });
    }
  }

  // GET /api/farming/stash-state?handle=...&league=... (Verified owner or admin only; supports per league D1 snapshots)
  if (url.pathname === '/api/farming/stash-state' && request.method === 'GET') {
    try {
      const session = await readVerifiedSession(request, env);
      const handle = String(url.searchParams.get('handle') || session?.handle || '').trim().replace(/^@/, '').toLowerCase();
      const requestedLeague = String(url.searchParams.get('league') || '').trim();
      if (!session || (!session.isAdmin && session.handle.toLowerCase() !== handle)) {
        return new Response(JSON.stringify({ error: 'Sign in as the account owner to load private cloud stash state.' }), { status: 401, headers: corsHeaders });
      }
      if (!handle || !env.EXILE_DB) return new Response(JSON.stringify({ state: null, leagues: [] }), { headers: corsHeaders });
      await initD1Schema(env.EXILE_DB);
      const row = await env.EXILE_DB.prepare(`SELECT data, updated_at FROM farming_stash_state WHERE handle_lower = ?`).bind(handle).first();
      if (!row?.data) return new Response(JSON.stringify({ state: null, leagues: [], updatedAtIso: null }), { headers: corsHeaders });
      const parsed = JSON.parse(row.data);
      const byLeague: Record<string, any> =
        parsed?.byLeague && typeof parsed.byLeague === 'object' ? parsed.byLeague : {};
      const activeLeagueName = String(parsed?.leagueName || '').trim();
      if (activeLeagueName && !byLeague[activeLeagueName]) {
        const { byLeague: _omitMap, ...topCopy } = parsed;
        byLeague[activeLeagueName] = topCopy;
      }
      const leagues = Object.keys(byLeague);
      let selectedState = parsed;
      if (requestedLeague) {
        const exact = byLeague[requestedLeague];
        const ciKey = leagues.find((k) => k.toLowerCase() === requestedLeague.toLowerCase());
        if (exact) selectedState = exact;
        else if (ciKey) selectedState = byLeague[ciKey];
      }
      const { byLeague: _strip, ...cleanSelected } = selectedState || {};
      return new Response(
        JSON.stringify({
          state: cleanSelected,
          leagues,
          activeLeague: String(cleanSelected?.leagueName || activeLeagueName || ''),
          updatedAtIso: row?.updated_at || null
        }),
        { headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // POST /api/farming/stash-state (Requires verified exile_session matching handle or admin; persists per league in D1)
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
      const { poesessid: _omit, byLeague: _omitIncomingMap, ...cleanState } = state;
      const leagueKey = String(cleanState.leagueName || 'Default League').trim();
      if (env.EXILE_DB) {
        await initD1Schema(env.EXILE_DB);
        let existingByLeague: Record<string, any> = {};
        try {
          const prevRow = await env.EXILE_DB.prepare(`SELECT data FROM farming_stash_state WHERE handle_lower = ?`).bind(handle).first();
          if (prevRow?.data) {
            const prevParsed = JSON.parse(prevRow.data);
            if (prevParsed?.byLeague && typeof prevParsed.byLeague === 'object') {
              existingByLeague = prevParsed.byLeague;
            } else if (prevParsed?.leagueName) {
              existingByLeague[String(prevParsed.leagueName).trim()] = prevParsed;
            }
          }
        } catch {}
        existingByLeague[leagueKey] = { ...cleanState, savedAtIso: now };
        // Cap stored leagues per user to the 8 most recently updated to keep D1 rows lean
        const leagueEntries = Object.entries(existingByLeague)
          .sort((a, b) => String(b[1]?.savedAtIso || '').localeCompare(String(a[1]?.savedAtIso || '')))
          .slice(0, 8);
        const prunedByLeague = Object.fromEntries(leagueEntries);
        const mergedPayload = { ...cleanState, byLeague: prunedByLeague };
        await env.EXILE_DB.prepare(
          `INSERT INTO farming_stash_state (handle_lower, data, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(handle_lower) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
        ).bind(handle, JSON.stringify(mergedPayload), now).run();
      }
      return new Response(JSON.stringify({ status: 'ok', league: leagueKey, updatedAtIso: now }), { headers: corsHeaders });
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

  // GET /api/farming/wealth-ladder?league=...&leagueId=... (Public opt in summary leaderboard from Asset Tracker + Map Tracker)
  if (url.pathname === '/api/farming/wealth-ladder' && request.method === 'GET') {
    try {
      const leagueFilter = String(url.searchParams.get('league') || '').trim().toLowerCase();
      const leagueIdFilter = String(url.searchParams.get('leagueId') || '').trim().toLowerCase();
      if (!env.EXILE_DB) {
        return new Response(JSON.stringify({ status: 'ok', entries: [], squadTotals: { totalDivines: 0, totalMaps: 0, totalSTier: 0, count: 0 } }), { headers: corsHeaders });
      }
      await initD1Schema(env.EXILE_DB);

      const [stashRowsRes, mapRowsRes] = await Promise.all([
        env.EXILE_DB.prepare(`SELECT handle_lower, data, updated_at FROM farming_stash_state ORDER BY updated_at DESC LIMIT 100`).all(),
        env.EXILE_DB.prepare(`SELECT handle_lower, data FROM user_tool_state WHERE tool_key = 'map_tracker_sessions' LIMIT 100`).all().catch(() => ({ results: [] }))
      ]);

      // Aggregate Map Tracker telemetry per handle from user_tool_state (map_tracker_sessions array)
      const mapTelemetryByHandle = new Map<string, { totalMaps: number; totalMapSec: number; bestXpPerHr: number; mapSessions: number }>();
      for (const row of mapRowsRes?.results || []) {
        try {
          const h = String(row.handle_lower || '').toLowerCase();
          const sessionsArr = JSON.parse(row.data);
          if (!Array.isArray(sessionsArr)) continue;
          const cur = mapTelemetryByHandle.get(h) || { totalMaps: 0, totalMapSec: 0, bestXpPerHr: 0, mapSessions: 0 };
          for (const d of sessionsArr) {
            const maps = Number(d?.mapsCompleted || d?.totalMaps || 0);
            const avgSec = Number(d?.avgMapSec || d?.avgMapSeconds || 0);
            const xpHr = Number(d?.xpPerHrM || 0) * 1_000_000;
            cur.totalMaps += maps;
            cur.totalMapSec += maps * avgSec;
            if (xpHr > cur.bestXpPerHr) cur.bestXpPerHr = xpHr;
            cur.mapSessions += 1;
          }
          mapTelemetryByHandle.set(h, cur);
        } catch {}
      }

      const entries: any[] = [];
      for (const row of stashRowsRes?.results || []) {
        try {
          const handleLower = String(row.handle_lower || '').toLowerCase();
          const parsed = JSON.parse(row.data);
          const candidates: any[] = [];
          if (parsed?.byLeague && typeof parsed.byLeague === 'object') {
            for (const val of Object.values(parsed.byLeague)) {
              if (val && typeof val === 'object') candidates.push(val);
            }
          } else if (parsed && typeof parsed === 'object') {
            candidates.push(parsed);
          }

          // Pick matching opted in league snapshot (or latest opted in snapshot if no league filter)
          let chosen: any = null;
          for (const c of candidates) {
            if (!c?.optInWealthLadder) continue;
            const cLeague = String(c.leagueName || '').toLowerCase();
            const cLeagueId = String(c.linkedLeagueId || '').toLowerCase();
            const matchesLeague =
              (!leagueFilter && !leagueIdFilter) ||
              (leagueIdFilter && cLeagueId && cLeagueId === leagueIdFilter) ||
              (leagueFilter && cLeague && (cLeague.includes(leagueFilter) || leagueFilter.includes(cLeague)));
            if (matchesLeague) {
              chosen = c;
              break;
            }
          }
          if (!chosen) continue;

          const summary = chosen.ladderSummary || {};
          const mapTel = mapTelemetryByHandle.get(handleLower);
          const totalMaps = Math.max(Number(chosen.mapsRun || 0), mapTel?.totalMaps || 0);
          const avgMapSeconds =
            mapTel && mapTel.totalMaps > 0 ? Math.round(mapTel.totalMapSec / mapTel.totalMaps) : 0;

          entries.push({
            handle: handleLower,
            leagueName: String(chosen.leagueName || ''),
            totalChaos: Number(summary.totalChaos || 0),
            divineChaos: Number(summary.divineChaos || 200),
            totalDivines: Number(summary.totalDivines || 0),
            chaosPerHour: Number(summary.chaosPerHour || 0),
            divPerHour: Number(summary.divPerHour || 0),
            sTierCount: Number(summary.sTierCount || 0),
            aTierCount: Number(summary.aTierCount || 0),
            totalStacks: Number(summary.totalStacks || (Array.isArray(chosen.activeDrops) ? chosen.activeDrops.length : 0)),
            topTabName: String(summary.topTabName || ''),
            topTabChaos: Number(summary.topTabChaos || 0),
            topItemName: String(summary.topItemName || ''),
            topItemIcon: String(summary.topItemIcon || ''),
            topItemChaos: Number(summary.topItemChaos || 0),
            checkpoints: Array.isArray(summary.checkpoints)
              ? summary.checkpoints.slice(-10)
              : Array.isArray(chosen.checkpoints)
              ? chosen.checkpoints.slice(-10)
              : [],
            mapsLogged: totalMaps,
            avgMapSeconds,
            bestXpPerHour: mapTel?.bestXpPerHr || 0,
            updatedAtIso: String(chosen.savedAtIso || row.updated_at || '')
          });
        } catch {}
      }

      entries.sort((a, b) => b.totalChaos - a.totalChaos);
      const squadTotals = {
        totalDivines: Math.round(entries.reduce((s, e) => s + e.totalDivines, 0) * 10) / 10,
        totalMaps: entries.reduce((s, e) => s + e.mapsLogged, 0),
        totalSTier: entries.reduce((s, e) => s + e.sTierCount, 0),
        count: entries.length
      };

      return new Response(JSON.stringify({ status: 'ok', entries, squadTotals }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // POST /api/farming/wealth-ladder/opt-in (Toggle opt in directly from Hall of Fame or Asset Tracker)
  if (url.pathname === '/api/farming/wealth-ladder/opt-in' && request.method === 'POST') {
    try {
      const session = await readVerifiedSession(request, env);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Sign in to update your Wealth Ladder opt in setting.' }), { status: 401, headers: corsHeaders });
      }
      const body: any = await request.json();
      const handle = session.handle.trim().replace(/^@/, '').toLowerCase();
      const optIn = Boolean(body.optIn);
      if (env.EXILE_DB) {
        await initD1Schema(env.EXILE_DB);
        const row = await env.EXILE_DB.prepare(`SELECT data FROM farming_stash_state WHERE handle_lower = ?`).bind(handle).first();
        if (row?.data) {
          const parsed = JSON.parse(row.data);
          parsed.optInWealthLadder = optIn;
          if (parsed.byLeague && typeof parsed.byLeague === 'object') {
            for (const key of Object.keys(parsed.byLeague)) {
              if (parsed.byLeague[key] && typeof parsed.byLeague[key] === 'object') {
                parsed.byLeague[key].optInWealthLadder = optIn;
              }
            }
          }
          await env.EXILE_DB.prepare(`UPDATE farming_stash_state SET data = ?, updated_at = ? WHERE handle_lower = ?`)
            .bind(JSON.stringify(parsed), now, handle)
            .run();
        }
      }
      return new Response(JSON.stringify({ status: 'ok', optIn }), { headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  return null;
}
