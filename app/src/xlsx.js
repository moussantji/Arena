import JSZip from 'jszip';

/* ============================================================
   DIALLO — générateur XLSX minimaliste
   Produit un classeur Excel réel (ZIP + OpenXML) avec styles,
   bordures, largeurs de colonnes et fusions. Aucune dépendance
   UI : JSZip sert uniquement à empaqueter les feuilles XML.
   ============================================================ */

const STYLE = {
  default: 0,
  title: 1,
  subtitle: 2,
  section: 3,
  header: 4,
  cell: 5,
  number: 6,
  average: 7,
  muted: 8,
  total: 9,
  center: 10,
  date: 11,
  money: 12,
  empty: 13,
};

const escapeXml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const columnName = (index) => {
  let value = index + 1;
  let name = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
};

const sheetName = (value, used) => {
  const base = String(value || 'Feuille')
    .replace(/[\\/?*[\]:]/g, ' ')
    .trim()
    .slice(0, 31) || 'Feuille';
  let name = base;
  let suffix = 2;
  while (used.has(name.toLowerCase())) {
    const tail = ` (${suffix})`;
    name = `${base.slice(0, 31 - tail.length)}${tail}`;
    suffix += 1;
  }
  used.add(name.toLowerCase());
  return name;
};

const normalizeCell = (cell) => {
  if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
    return { value: cell.v ?? cell.value, style: cell.s ?? cell.style };
  }
  return { value: cell, style: undefined };
};

const styleId = (style) => (typeof style === 'number' ? style : STYLE[style] ?? STYLE.cell);

const cellXml = (reference, rawCell) => {
  const { value, style } = normalizeCell(rawCell);
  const index = styleId(style);
  if (value === null || value === undefined || value === '') {
    return `<c r="${reference}" s="${index}"/>`;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${reference}" s="${index}"><v>${value}</v></c>`;
  }
  return `<c r="${reference}" s="${index}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
};

function sheetXml(sheet) {
  const columns = sheet.columns || [];
  const rows = sheet.rows || [];
  const merges = sheet.merges || [];
  const lastColumn = columnName(Math.max(0, columns.length - 1));
  const dimension = `A1:${lastColumn}${Math.max(1, rows.length)}`;

  const colsXml = columns.length
    ? `<cols>${columns.map((column, index) => {
      const width = typeof column === 'number' ? column : column.width;
      return `<col min="${index + 1}" max="${index + 1}" width="${Number(width) || 12}" customWidth="1"/>`;
    }).join('')}</cols>`
    : '';

  const rowsXml = rows.map((row, index) => {
    const rowNumber = index + 1;
    const cells = row?.cells || [];
    const height = row?.height ? ` ht="${Number(row.height)}" customHeight="1"` : '';
    const cellsXml = cells.map((cell, cellIndex) => cellXml(`${columnName(cellIndex)}${rowNumber}`, cell)).join('');
    return `<row r="${rowNumber}"${height}>${cellsXml}</row>`;
  }).join('');

  const freeze = Number(sheet.freeze || 0);
  const pane = freeze > 0
    ? `<pane ySplit="${freeze}" topLeftCell="A${freeze + 1}" activePane="bottomLeft" state="frozen"/>`
    : '';

  const mergesXml = merges.length
    ? `<mergeCells count="${merges.length}">${merges.map((range) => `<mergeCell ref="${range}"/>`).join('')}</mergeCells>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<dimension ref="${dimension}"/>
<sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
${colsXml}
<sheetData>${rowsXml}</sheetData>
${mergesXml}
<pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>
<pageSetup paperSize="9" orientation="${sheet.portrait ? 'portrait' : 'landscape'}" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2">
  <numFmt numFmtId="164" formatCode="0.00"/>
  <numFmt numFmtId="165" formatCode="#,##0"/>
</numFmts>
<fonts count="6">
  <font><sz val="11"/><name val="Calibri"/><color rgb="FF1F2A5A"/></font>
  <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font>
  <font><b/><sz val="15"/><name val="Calibri"/><color rgb="FF1B2A6B"/></font>
  <font><b/><sz val="12"/><name val="Calibri"/><color rgb="FF1B2A6B"/></font>
  <font><i/><sz val="10"/><name val="Calibri"/><color rgb="FF6B78A8"/></font>
  <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FF1B2A6B"/></font>
</fonts>
<fills count="5">
  <fill><patternFill patternType="none"/></fill>
  <fill><patternFill patternType="gray125"/></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FF5B7CFA"/><bgColor indexed="64"/></patternFill></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FFE8EDFF"/><bgColor indexed="64"/></patternFill></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FFF7F9FF"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
  <border><left/><right/><top/><bottom/><diagonal/></border>
  <border>
    <left style="thin"><color rgb="FF8A9AC8"/></left>
    <right style="thin"><color rgb="FF8A9AC8"/></right>
    <top style="thin"><color rgb="FF8A9AC8"/></top>
    <bottom style="thin"><color rgb="FF8A9AC8"/></bottom>
    <diagonal/>
  </border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="14">
  <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1" indent="1"/></xf>
  <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top" indent="1"/></xf>
  <xf numFmtId="164" fontId="5" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top" indent="1"/></xf>
  <xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1" indent="1"/></xf>
  <xf numFmtId="0" fontId="5" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1" indent="1"/></xf>
  <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>
  <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top" indent="1"/></xf>
  <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function workbookXml(sheets) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000"/></bookViews>
<sheets>${sheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}</sheets>
<calcPr calcId="191029"/>
</workbook>`;
}

function workbookRels(sheets) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((sheet, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('')}
<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function contentTypes(sheets) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheets.map((sheet, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;
}

export async function buildXlsx(sheetsInput) {
  const used = new Set();
  const sheets = (sheetsInput || []).map((sheet) => ({
    ...sheet,
    name: sheetName(sheet.name, used),
  }));

  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypes(sheets));
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
  zip.file('xl/workbook.xml', workbookXml(sheets));
  zip.file('xl/_rels/workbook.xml.rels', workbookRels(sheets));
  zip.file('xl/styles.xml', stylesXml());
  sheets.forEach((sheet, index) => {
    zip.file(`xl/worksheets/sheet${index + 1}.xml`, sheetXml(sheet));
  });

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE',
  });
}

export async function exportXlsx(filename, sheets) {
  const blob = await buildXlsx(sheets);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = String(filename).endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export { STYLE };
