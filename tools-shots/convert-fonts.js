/* Convertisseur WOFF1 -> TTF (parsing du conteneur + inflateRaw des tables) */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ -1) >>> 0;
}

function woff1ToTtf(woff) {
  if (woff.toString('ascii', 0, 4) !== 'wOFF') throw new Error('signature wOFF absente');
  const flavor = woff.readUInt32BE(4);
  const numTables = woff.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const tag = woff.toString('ascii', o, o + 4);
    const off = woff.readUInt32BE(o + 4);
    const compLen = woff.readUInt32BE(o + 8);
    const origLen = woff.readUInt32BE(o + 12);
    let data;
    if (compLen === origLen) data = woff.subarray(off, off + origLen);
    else {
      const chunk = woff.subarray(off, off + compLen);
      try { data = zlib.inflateSync(chunk); } catch { data = zlib.inflateRawSync(chunk); }
    }
    if (data.length !== origLen) throw new Error(`table ${tag}: ${data.length} != ${origLen}`);
    tables.push({ tag, data, sum: crc32(data) });
  }
  tables.sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const n = tables.length;
  const entrySelector = Math.floor(Math.log2(n));
  const searchRange = 16 << entrySelector;
  const rangeShift = n * 16 - searchRange;
  let pos = 12 + n * 16;
  const dir = [];
  for (const t of tables) {
    pos = (pos + 3) & ~3;
    dir.push({ ...t, offset: pos });
    pos += t.data.length;
  }
  const out = Buffer.alloc(pos);
  out.writeUInt32BE(flavor === 0x74746366 ? 0x74746366 : 0x00010000, 0);
  out.writeUInt16BE(n, 4);
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(entrySelector, 8);
  out.writeUInt16BE(rangeShift, 10);
  dir.forEach((t, i) => {
    const o = 12 + i * 16;
    out.write(t.tag, o, 'ascii');
    out.writeUInt32BE(t.sum, o + 4);
    out.writeUInt32BE(t.offset, o + 8);
    out.writeUInt32BE(t.data.length, o + 12);
    t.data.copy(out, t.offset);
  });
  return out;
}

const SRC = path.join(__dirname, 'fonts');
const DST = path.join(__dirname, 'fonts-ttf');
fs.mkdirSync(DST, { recursive: true });
let ok = 0;
for (const f of fs.readdirSync(SRC).filter(f => f.endsWith('.woff'))) {
  const ttf = woff1ToTtf(fs.readFileSync(path.join(SRC, f)));
  fs.writeFileSync(path.join(DST, f.replace(/\.woff$/, '.ttf')), ttf);
  ok++;
}
console.log(`${ok} polices converties vers fonts-ttf/`);
