import { deflateRaw, inflateRaw } from 'pako';
import type {
  LeagueRosterMember,
  LookingForItem,
  LeagueFirstMilestone,
  WishlistItemCategory
} from '../types';
import { getMemberCharacters } from '../components/league/tabs/RosterTab';

// ============================================================================
// Pure TypeScript Styled Multi Tab .xlsx Builder & Reader (Zero External Deps)
// Opens natively in Google Sheets & Microsoft Excel with styled dark/gold headers
// ============================================================================

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function escapeXml(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colIndexToLetter(colIdx: number): string {
  let s = '';
  let n = colIdx + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export interface SheetDefinition {
  name: string;
  headers: string[];
  rows: (string | number)[][];
  colWidths?: number[];
}

function buildWorksheetXml(sheet: SheetDefinition): string {
  const colWidths = sheet.colWidths || sheet.headers.map((h) => Math.max(16, Math.min(42, h.length + 8)));
  const colsXml = colWidths
    .map((w, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  const headerCells = sheet.headers
    .map((h, cIdx) => {
      const ref = `${colIndexToLetter(cIdx)}1`;
      return `<c r="${ref}" t="inlineStr" s="1"><is><t>${escapeXml(h)}</t></is></c>`;
    })
    .join('');

  const dataRowsXml = sheet.rows
    .map((row, rIdx) => {
      const excelRow = rIdx + 2;
      const cells = row
        .map((val, cIdx) => {
          const ref = `${colIndexToLetter(cIdx)}${excelRow}`;
          if (typeof val === 'number' && !Number.isNaN(val)) {
            return `<c r="${ref}" s="2"><v>${val}</v></c>`;
          }
          const strVal = String(val ?? '');
          const isUrl = strVal.startsWith('http://') || strVal.startsWith('https://');
          const styleId = isUrl ? '3' : '2';
          return `<c r="${ref}" t="inlineStr" s="${styleId}"><is><t>${escapeXml(strVal)}</t></is></c>`;
        })
        .join('');
      return `<row r="${excelRow}" ht="20" customHeight="1">${cells}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  <cols>${colsXml}</cols>
  <sheetData>
    <row r="1" ht="26" customHeight="1">${headerCells}</row>
    ${dataRowsXml}
  </sheetData>
</worksheet>`;
}

function buildStylesXml(): string {
  // s=0 default, s=1 dark obsidian/gold bold header, s=2 clean body cell, s=3 indigo hyperlink text
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><color rgb="FF1E293B"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFBBF24"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><u/><sz val="10"/><color rgb="FF4F46E5"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" horizontal="left"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;
}

function createZipBlob(files: { path: string; content: string }[]): Blob {
  const enc = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.path);
    const rawBytes = enc.encode(f.content);
    const compBytes = deflateRaw(rawBytes);
    const crc = crc32(rawBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 8, true); // deflate
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, compBytes.length, true);
    lv.setUint32(22, rawBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, compBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 8, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, compBytes.length, true);
    cv.setUint32(24, rawBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + compBytes.length;
  }

  const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, eocd] as BlobPart[], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

export function buildXlsxBlob(sheets: SheetDefinition[]): Blob {
  const safeSheets = sheets.map((s, idx) => ({
    ...s,
    safeName: s.name.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || `Sheet${idx + 1}`
  }));

  const contentTypesSheets = safeSheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('');

  const workbookSheets = safeSheets
    .map((s, i) => `<sheet name="${escapeXml(s.safeName)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('');

  const workbookRels = safeSheets
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    )
    .join('');

  const files: { path: string; content: string }[] = [
    {
      path: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${contentTypesSheets}
</Types>`
    },
    {
      path: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
    },
    {
      path: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${workbookSheets}</sheets>
</workbook>`
    },
    {
      path: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${workbookRels}
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
    },
    {
      path: 'xl/styles.xml',
      content: buildStylesXml()
    },
    ...safeSheets.map((s, i) => ({
      path: `xl/worksheets/sheet${i + 1}.xml`,
      content: buildWorksheetXml(s)
    }))
  ];

  return createZipBlob(files);
}

export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ============================================================================
// High Level Exporters: Full League Export & Blank Starter Sheet Template
// ============================================================================

export function exportLeagueToXlsx(params: {
  leagueId: string;
  leagueName: string;
  patchVersion: string;
  officialLeagueUrl?: string;
  globalChannel?: string;
  roster: LeagueRosterMember[];
  wishlist: LookingForItem[];
  leagueFirsts?: LeagueFirstMilestone[];
}): void {
  const { leagueId, leagueName, patchVersion, officialLeagueUrl, globalChannel, roster, wishlist, leagueFirsts = [] } = params;

  const overviewSheet: SheetDefinition = {
    name: 'League Overview',
    headers: ['Field', 'Value'],
    colWidths: [28, 62],
    rows: [
      ['League Name', leagueName],
      ['League ID', leagueId],
      ['Patch Version', patchVersion],
      ['Private League Link (GGG)', officialLeagueUrl || 'https://www.pathofexile.com/private-leagues'],
      ['Exile SSF Hub Link', `https://exilessf.app/league/${leagueId}`],
      ['Live Feed Link', `https://exilessf.app/league/${leagueId}/feed`],
      ['In Game Global Channel', globalChannel || '/global 5712'],
      ['Active Roster Slots', roster.length],
      ['Total Tracked Characters', roster.reduce((sum, m) => sum + getMemberCharacters(m).length, 0)],
      ['Open Squad Wishes', wishlist.filter((w) => w.status !== 'HAVE').length],
      ['Fulfilled Squad Drops', wishlist.filter((w) => w.status === 'HAVE').length],
      ['Exported Timestamp', new Date().toLocaleString()]
    ]
  };

  const rosterSheet: SheetDefinition = {
    name: 'Roster & Interest',
    headers: [
      'Slot',
      'Display Tag',
      'PoE Account',
      'Interest / Launch',
      'Invite Status',
      'Main Character',
      'Ascendancy',
      'Level',
      'Build Name',
      'PoB Link',
      'Planned Mechanics',
      'Discord / Contact',
      'Notes',
      'Exile SSF Profile'
    ],
    colWidths: [8, 18, 22, 18, 15, 20, 16, 8, 28, 34, 28, 18, 30, 34],
    rows: roster.map((m, idx) => [
      m.slotNumber || idx + 1,
      m.displayName,
      m.poeAccountName || '',
      m.availableAtLaunch || 'Yes',
      m.inviteStatus || 'Accepted',
      m.characterName || '',
      m.ascendancy || '',
      Number(m.level) || 1,
      m.buildName || '',
      m.pobUrl || '',
      (m.atlasContent || []).join(', '),
      m.discordName || m.displayName,
      m.notes || '',
      `https://exilessf.app/exile/${encodeURIComponent(m.displayName)}`
    ])
  };

  const charRows: (string | number)[][] = [];
  for (const m of roster) {
    for (const ch of getMemberCharacters(m)) {
      charRows.push([
        m.displayName,
        m.poeAccountName || '',
        ch.characterName,
        ch.isMain ? 'Main' : 'Alt',
        ch.ascendancy,
        Number(ch.level) || 1,
        ch.buildName || '',
        ch.pobUrl || ''
      ]);
    }
  }

  const charsSheet: SheetDefinition = {
    name: 'Characters (Main + Alts)',
    headers: ['Owner Tag', 'PoE Account', 'Character IGN', 'Role', 'Ascendancy', 'Level', 'Build Name', 'PoB Link'],
    colWidths: [18, 22, 22, 10, 18, 8, 30, 36],
    rows: charRows
  };

  const wishSheet: SheetDefinition = {
    name: 'Wishlists & Bounties',
    headers: ['Item Name', 'Category', 'Requested By', 'For Character', 'Status', 'Bounty Offer', 'Found By', 'Receipt Confirmed', 'Notes'],
    colWidths: [28, 18, 18, 20, 14, 18, 18, 18, 36],
    rows: wishlist.map((w) => [
      w.itemName,
      w.category,
      w.displayName || w.characterName,
      w.characterName,
      w.status,
      w.bountyOffer || '',
      w.fulfilledBy || '',
      w.receiptConfirmed || w.bountyStatus === 'PAID' ? 'Yes' : 'No',
      w.notes || ''
    ])
  };

  const firstsSheet: SheetDefinition = {
    name: 'League Firsts',
    headers: ['Milestone', 'Winner Tag', 'Character IGN', 'Date Achieved', 'Notes'],
    colWidths: [28, 18, 22, 22, 36],
    rows: leagueFirsts.map((f) => [
      f.title,
      f.winnerDisplayName,
      f.winnerCharacterName || '',
      f.achievedAtIso ? new Date(f.achievedAtIso).toLocaleDateString() : '',
      f.proofNote || ''
    ])
  };

  const blob = buildXlsxBlob([overviewSheet, rosterSheet, charsSheet, wishSheet, firstsSheet]);
  const safeSlug = leagueName.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'Exile SSF League';
  triggerFileDownload(blob, `${safeSlug} Export.xlsx`);
}

export function downloadStarterSheetTemplate(): void {
  const overviewSheet: SheetDefinition = {
    name: 'League Overview',
    headers: ['Field', 'Value'],
    colWidths: [28, 60],
    rows: [
      ['League Name', 'Ravenwatch Private League GSF'],
      ['Patch Version', '3.30'],
      ['Private League Link (GGG)', 'https://www.pathofexile.com/private-leagues/league/...'],
      ['Community Server Link', 'https://rootapp.gg/...'],
      ['In Game Global Channel', '/global 5712']
    ]
  };

  const rosterSheet: SheetDefinition = {
    name: 'Roster & Interest',
    headers: [
      'Display Tag',
      'PoE Account',
      'Interest / Launch',
      'Main Character',
      'Ascendancy',
      'Level',
      'Build Name',
      'PoB Link',
      'Planned Mechanics',
      'Discord / Contact',
      'Notes'
    ],
    colWidths: [18, 22, 18, 20, 16, 8, 28, 36, 28, 18, 32],
    rows: [
      [
        'ExampleExile',
        'ExampleAccount#1234',
        'Yes',
        'MyStarterIGN',
        'Slayer',
        1,
        'Lightning Strike Slayer',
        'https://pobb.in/example',
        'Betrayal, Essences, Harvest',
        '@ExampleExile',
        'Delete this example row or replace with your squad signups!'
      ]
    ]
  };

  const wishSheet: SheetDefinition = {
    name: 'Wishlists & Bounties',
    headers: ['Item Name', 'Category', 'Requested By', 'For Character', 'Status', 'Bounty Offer', 'Notes'],
    colWidths: [26, 18, 18, 20, 12, 18, 34],
    rows: [
      ['Aegis Aurora', 'Unique', 'ExampleExile', 'MyStarterIGN', 'NEED', '5 Divines', 'Any roll acceptable']
    ]
  };

  const blob = buildXlsxBlob([overviewSheet, rosterSheet, wishSheet]);
  triggerFileDownload(blob, 'Exile SSF Private League Starter Sheet.xlsx');
}

// ============================================================================
// CSV & .xlsx Ingestion Parser + Fuzzy Auto Mapper
// ============================================================================

export function parseCsvText(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    const next = csv[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field.trim());
      field = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(field.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      field = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      row.push(field.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }
  return rows;
}

export async function parseXlsxFile(file: File): Promise<{ sheetName: string; rows: string[][] }[]> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(buf.buffer);
  const dec = new TextDecoder('utf-8');
  const entries = new Map<string, string>();

  // Walk ZIP local file headers
  let pos = 0;
  while (pos + 30 < buf.length) {
    const sig = view.getUint32(pos, true);
    if (sig !== 0x04034b50) break;
    const method = view.getUint16(pos + 8, true);
    const compSize = view.getUint32(pos + 18, true);
    const nameLen = view.getUint16(pos + 26, true);
    const extraLen = view.getUint16(pos + 28, true);
    const nameStart = pos + 30;
    const name = dec.decode(buf.slice(nameStart, nameStart + nameLen));
    const dataStart = nameStart + nameLen + extraLen;
    const dataSlice = buf.slice(dataStart, dataStart + compSize);

    if (name.endsWith('.xml')) {
      try {
        const raw = method === 8 ? inflateRaw(dataSlice) : dataSlice;
        entries.set(name, dec.decode(raw));
      } catch {}
    }
    pos = dataStart + compSize;
  }

  // Parse sharedStrings.xml if present
  const sharedStrings: string[] = [];
  const ssXml = entries.get('xl/sharedStrings.xml');
  if (ssXml) {
    const doc = new DOMParser().parseFromString(ssXml, 'application/xml');
    doc.querySelectorAll('si').forEach((si) => {
      sharedStrings.push(si.textContent || '');
    });
  }

  // Parse workbook sheet names
  const sheetNames: string[] = [];
  const wbXml = entries.get('xl/workbook.xml');
  if (wbXml) {
    const doc = new DOMParser().parseFromString(wbXml, 'application/xml');
    doc.querySelectorAll('sheet').forEach((sh) => {
      sheetNames.push(sh.getAttribute('name') || 'Sheet');
    });
  }

  const parsedSheets: { sheetName: string; rows: string[][] }[] = [];
  const sheetPaths = Array.from(entries.keys())
    .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || '0', 10);
      const nb = parseInt(b.match(/\d+/)?.[0] || '0', 10);
      return na - nb;
    });

  sheetPaths.forEach((sp, idx) => {
    const xml = entries.get(sp);
    if (!xml) return;
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const rows: string[][] = [];
    doc.querySelectorAll('sheetData > row').forEach((rowEl) => {
      const cells: string[] = [];
      rowEl.querySelectorAll('c').forEach((cEl) => {
        const ref = cEl.getAttribute('r') || '';
        const colMatch = ref.match(/^[A-Z]+/i);
        let colIdx = cells.length;
        if (colMatch) {
          colIdx = 0;
          const letters = colMatch[0].toUpperCase();
          for (let i = 0; i < letters.length; i++) {
            colIdx = colIdx * 26 + (letters.charCodeAt(i) - 64);
          }
          colIdx -= 1;
        }
        const type = cEl.getAttribute('t');
        let val = '';
        if (type === 's') {
          const sIdx = parseInt(cEl.querySelector('v')?.textContent || '0', 10);
          val = sharedStrings[sIdx] || '';
        } else if (type === 'inlineStr') {
          val = cEl.querySelector('is')?.textContent || '';
        } else {
          val = cEl.querySelector('v')?.textContent || '';
        }
        while (cells.length < colIdx) cells.push('');
        cells[colIdx] = val.trim();
      });
      if (cells.some((c) => c.length > 0)) rows.push(cells);
    });
    parsedSheets.push({ sheetName: sheetNames[idx] || `Sheet ${idx + 1}`, rows });
  });

  return parsedSheets;
}

export interface IngestedRosterRow {
  displayName: string;
  poeAccountName: string;
  availableAtLaunch: 'Yes' | 'No' | 'Late Start';
  characterName: string;
  ascendancy: string;
  level: number;
  buildName: string;
  pobUrl: string;
  atlasContent: string[];
  discordName: string;
  notes: string;
  isUpdate: boolean;
}

export interface IngestedWishlistRow {
  itemName: string;
  category: WishlistItemCategory;
  displayName: string;
  characterName: string;
  status: 'NEED' | 'HAVE' | 'SECOND CHAR' | 'LOW PRIO';
  bountyOffer?: string;
  notes: string;
}

export function mapRowsToRosterPreview(
  rawRows: string[][],
  existingRoster: LeagueRosterMember[]
): IngestedRosterRow[] {
  if (rawRows.length < 2) return [];
  const headers = rawRows[0].map((h) => h.toLowerCase().trim());

  const findCol = (patterns: string[]) =>
    headers.findIndex((h) => patterns.some((p) => h.includes(p)));

  const iDisp = findCol(['display', 'tag', 'handle', 'user', 'name', 'player']);
  const iPoe = findCol(['poe account', 'ggg', 'account']);
  const iInterest = findCol(['interest', 'launch', 'avail']);
  const iChar = findCol(['character', 'ign', 'char']);
  const iAsc = findCol(['ascendancy', 'class']);
  const iLvl = findCol(['level', 'lvl']);
  const iBuild = findCol(['build', 'starter', 'skill']);
  const iPob = findCol(['pob', 'path of building']);
  const iAtlas = findCol(['mechanic', 'atlas', 'focus', 'farm']);
  const iDisc = findCol(['discord', 'contact', 'root']);
  const iNotes = findCol(['note', 'comment']);

  const existingHandles = new Set(existingRoster.map((m) => m.displayName.trim().toLowerCase()));
  const existingAccounts = new Set(
    existingRoster.map((m) => (m.poeAccountName || '').trim().toLowerCase()).filter(Boolean)
  );

  const out: IngestedRosterRow[] = [];
  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    const get = (idx: number) => (idx >= 0 ? (row[idx] || '').trim() : '');
    const rawDisp = get(iDisp).replace(/^@/, '');
    const poeAcc = get(iPoe);
    const charName = get(iChar);
    const displayName = rawDisp || (poeAcc ? poeAcc.split('#')[0] : '') || charName;
    if (!displayName || displayName.toLowerCase() === 'exampleexile') continue;

    const interestRaw = get(iInterest).toLowerCase();
    const availableAtLaunch: 'Yes' | 'No' | 'Late Start' = interestRaw.includes('late')
      ? 'Late Start'
      : interestRaw.includes('no')
      ? 'No'
      : 'Yes';

    const atlasRaw = get(iAtlas);
    const atlasContent = atlasRaw
      ? atlasRaw
          .split(/[,;/|]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const isUpdate =
      existingHandles.has(displayName.toLowerCase()) ||
      (Boolean(poeAcc) && existingAccounts.has(poeAcc.toLowerCase()));

    out.push({
      displayName,
      poeAccountName: poeAcc,
      availableAtLaunch,
      characterName: charName || displayName,
      ascendancy: get(iAsc) || 'Unassigned',
      level: Math.max(1, Math.min(100, parseInt(get(iLvl), 10) || 1)),
      buildName: get(iBuild) || 'Undecided Starter',
      pobUrl: get(iPob),
      atlasContent,
      discordName: get(iDisc),
      notes: get(iNotes),
      isUpdate
    });
  }
  return out;
}
