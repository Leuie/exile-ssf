// Dynamic 1200x630 Open Graph SVG Preview Card generator for Exile SSF
// Supports:
//   /api/og/card?type=exile&handle=<handle>
//   /api/og/card?type=armory&handle=<handle>&char=<charName>
//   /api/og/card?type=hof&league=<leagueId>
//   /api/og/card?type=atlas&name=<treeName>&pts=<points>

function escXml(val: string): string {
  return String(val || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(val: string, max: number): string {
  const s = String(val || '').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function renderCardSvg(opts: {
  eyebrow: string;
  title: string;
  subtitle: string;
  accentHex: string;
  stats: { label: string; value: string }[];
  footerRight: string;
}): string {
  const { eyebrow, title, subtitle, accentHex, stats, footerRight } = opts;
  const statBoxes = stats.slice(0, 4).map((st, idx) => {
    const x = 72 + idx * 268;
    return `
      <g transform="translate(${x}, 365)">
        <rect width="248" height="122" rx="16" fill="#0f172a" fill-opacity="0.92" stroke="#1e293b" stroke-width="2" />
        <text x="22" y="42" fill="#94a3b8" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="1.4">${escXml(st.label.toUpperCase())}</text>
        <text x="22" y="92" fill="#f8fafc" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="34" font-weight="800">${escXml(truncate(st.value, 14))}</text>
      </g>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#070a10" />
      <stop offset="55%" stop-color="#0d1322" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="15%" r="55%">
      <stop offset="0%" stop-color="${escXml(accentHex)}" stop-opacity="0.28" />
      <stop offset="100%" stop-color="${escXml(accentHex)}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${escXml(accentHex)}" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect x="28" y="28" width="1144" height="574" rx="28" fill="none" stroke="#1e293b" stroke-width="2" />
  <rect x="72" y="72" width="1056" height="6" rx="3" fill="url(#bar)" />

  <!-- Eyebrow Pill -->
  <rect x="72" y="106" width="380" height="40" rx="20" fill="${escXml(accentHex)}" fill-opacity="0.16" stroke="${escXml(accentHex)}" stroke-opacity="0.55" stroke-width="1.5" />
  <text x="94" y="132" fill="#fde68a" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="1.5">${escXml(truncate(eyebrow.toUpperCase(), 32))}</text>

  <!-- Main Title & Subtitle -->
  <text x="72" y="232" fill="#ffffff" font-family="Georgia, Cinzel, serif" font-size="60" font-weight="800">${escXml(truncate(title, 30))}</text>
  <text x="72" y="294" fill="#cbd5e1" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="26" font-weight="500">${escXml(truncate(subtitle, 74))}</text>

  <!-- Live Stat Cards -->
  ${statBoxes}

  <!-- Footer -->
  <line x1="72" y1="534" x2="1128" y2="534" stroke="#1e293b" stroke-width="1.5" />
  <text x="72" y="574" fill="#f59e0b" font-family="Georgia, Cinzel, serif" font-size="24" font-weight="800">EXILE SSF</text>
  <text x="228" y="574" fill="#64748b" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="20" font-weight="600">exilessf.app  •  PoE 1 &amp; PoE 2 Compendium &amp; GSF Portal</text>
  <text x="1128" y="574" text-anchor="end" fill="#94a3b8" font-family="monospace" font-size="18" font-weight="700">${escXml(truncate(footerRight, 34))}</text>
</svg>`;
}

export async function handleOgCardRoute(ctx: {
  url: URL;
  db: any;
  corsHeaders: Record<string, string>;
}): Promise<Response> {
  const { url, db } = ctx;
  const type = (url.searchParams.get('type') || 'exile').toLowerCase().trim();
  const handle = (url.searchParams.get('handle') || '').replace(/^@/, '').trim();
  const charName = (url.searchParams.get('char') || '').trim();
  const leagueId = (url.searchParams.get('league') || 'poe1-330-umbra').trim();

  let svg = '';

  if (type === 'hof') {
    let rosterCount = 0;
    let firstsCount = 0;
    let wishesFulfilled = 0;
    try {
      const r1 = await db.prepare('SELECT COUNT(*) as c FROM roster WHERE league_id = ?').bind(leagueId).first();
      const r2 = await db.prepare('SELECT COUNT(*) as c FROM league_firsts WHERE league_id = ?').bind(leagueId).first();
      const r3 = await db.prepare('SELECT data FROM wishlists WHERE league_id = ?').bind(leagueId).all();
      rosterCount = Number(r1?.c || 0);
      firstsCount = Number(r2?.c || 0);
      for (const row of r3?.results || []) {
        try {
          if (JSON.parse(row.data || '{}').status === 'HAVE') wishesFulfilled += 1;
        } catch {}
      }
    } catch {}
    const leagueLabel =
      leagueId === 'poe1-330-umbra'
        ? 'Covens of Umbra GSF'
        : leagueId === 'poe2-05-ancients'
        ? 'PoE 2 Ancients GSF'
        : leagueId;
    svg = renderCardSvg({
      eyebrow: 'PRIVATE LEAGUE HALL OF FAME',
      title: leagueLabel,
      subtitle: 'Live League Firsts, Opt In Wealth Ladder & Private League Records',
      accentHex: '#f59e0b',
      stats: [
        { label: 'Active Roster', value: `${rosterCount} Exiles` },
        { label: 'League Firsts', value: `${firstsCount}` },
        { label: 'Wishes Filled', value: `${wishesFulfilled}` },
        { label: 'League Code', value: leagueId }
      ],
      footerRight: `league/${leagueId}/hall-of-fame`
    });
  } else if (type === 'armory') {
    let charLevel = '';
    let charClass = '';
    try {
      if (handle) {
        const row = await db
          .prepare('SELECT data FROM roster WHERE display_name_lower = lower(?) LIMIT 1')
          .bind(handle)
          .first();
        if (row?.data) {
          const parsed = JSON.parse(row.data);
          const chars = Array.isArray(parsed.characters) ? parsed.characters : [];
          const hit = chars.find((c: any) => !charName || String(c.characterName || '').toLowerCase() === charName.toLowerCase()) || chars[0];
          if (hit) {
            charLevel = hit.level ? `Lv ${hit.level}` : '';
            charClass = String(hit.ascendancy || hit.class || '');
          }
        }
      }
    } catch {}
    svg = renderCardSvg({
      eyebrow: 'CHARACTER ARMORY SNAPSHOT',
      title: charName || (handle ? `@${handle}` : 'Character Armory'),
      subtitle: handle ? `Synced Path of Exile Build & Passive Tree for @${handle}` : 'Live Equipment Paperdoll, Gem Audit, Upgrade Advisor & PoB Export',
      accentHex: '#6366f1',
      stats: [
        { label: 'Exile Handle', value: handle ? `@${handle}` : 'Public' },
        { label: 'Level', value: charLevel || 'Synced' },
        { label: 'Ascendancy', value: charClass || 'PoE Armory' },
        { label: 'Tools', value: 'PoB + Diff' }
      ],
      footerRight: handle ? `armory/${handle}` : 'armory'
    });
  } else if (type === 'atlas') {
    const treeName = url.searchParams.get('name') || 'Shared Atlas Strategy';
    const pts = url.searchParams.get('pts') || '132';
    svg = renderCardSvg({
      eyebrow: 'SHAREABLE ATLAS SKILL TREE',
      title: treeName,
      subtitle: 'Interactive Path of Exile Atlas Tree with Show Stats Modifier Totalizer',
      accentHex: '#10b981',
      stats: [
        { label: 'Allocated', value: `${pts} / 150` },
        { label: 'Mode', value: 'SSF / GSF' },
        { label: 'Planner', value: 'BFS Pathing' },
        { label: 'Import', value: '1 Click' }
      ],
      footerRight: 'maps?atlas=shared'
    });
  } else {
    // Default: Exile Profile Card
    let honorPts = 0;
    let achCount = 0;
    let charCount = 0;
    let topChar = 'Exile';
    try {
      if (handle) {
        const achRow = await db
          .prepare('SELECT data FROM achievements WHERE lower(player_key) = lower(?) LIMIT 1')
          .bind(handle)
          .first();
        if (achRow?.data) {
          const parsed = JSON.parse(achRow.data);
          honorPts = Number(parsed.honorPoints || 0);
          achCount = Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds.length : 0;
        }
        const rosterRow = await db
          .prepare('SELECT data FROM roster WHERE display_name_lower = lower(?) LIMIT 1')
          .bind(handle)
          .first();
        if (rosterRow?.data) {
          const parsed = JSON.parse(rosterRow.data);
          const chars = Array.isArray(parsed.characters) ? parsed.characters : [];
          charCount = chars.length || (parsed.characterName ? 1 : 0);
          topChar = chars[0]?.characterName || parsed.characterName || handle;
        }
      }
    } catch {}
    svg = renderCardSvg({
      eyebrow: 'EXILE CAREER PASSPORT',
      title: handle ? `@${handle}` : 'Exile SSF Profile',
      subtitle: 'Multi League Career Stats, Character Roster, Wishlists & Squad Honors',
      accentHex: '#f59e0b',
      stats: [
        { label: 'Primary Exile', value: topChar },
        { label: 'Characters', value: `${charCount || 1}` },
        { label: 'Honor Points', value: `${honorPts}` },
        { label: 'Achievements', value: `${achCount}` }
      ],
      footerRight: handle ? `exile/${handle}` : 'exilessf.app'
    });
  }

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
