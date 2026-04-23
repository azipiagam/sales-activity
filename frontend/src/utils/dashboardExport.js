import { getDashboardPeriodKey } from '../constants/dashboardPeriods';

const WEEK_KEYS = ['week1', 'week2', 'week3', 'week4'];
const PDF_PAGE_WIDTH = 841.89;
const PDF_PAGE_HEIGHT = 595.28;
const PDF_MARGIN_X = 28;
const PDF_TITLE_Y = 562;
const PDF_BODY_START_Y = 540;
const PDF_LINE_HEIGHT = 9;
const PDF_BODY_FONT_SIZE = 7;
const MONTHS_PER_PAGE = 4;
const ROWS_PER_PAGE = 30;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isAllStatesLabel = (provinsiLabel) =>
  provinsiLabel === 'Semua Provinsi' || provinsiLabel === 'Provinsi';

const getPeriodDataFromStats = (stats, periodLabel) => {
  if (!stats) {
    return null;
  }

  const periodKey = getDashboardPeriodKey(periodLabel);
  const periodData = stats?.[periodKey];

  if (!periodData || typeof periodData !== 'object') {
    return null;
  }

  return periodData;
};

export const buildDashboardTaskData = (stats, periodLabel, provinsiLabel) => {
  const periodData = getPeriodDataFromStats(stats, periodLabel);

  if (!periodData) {
    return null;
  }

  if (isAllStatesLabel(provinsiLabel)) {
    const aggregated = Object.values(periodData).reduce(
      (acc, stateValue) => ({
        in_progress: acc.in_progress + toNumber(stateValue?.in_progress),
        missed: acc.missed + toNumber(stateValue?.missed),
        done: acc.done + toNumber(stateValue?.done),
      }),
      { in_progress: 0, missed: 0, done: 0 }
    );

    return {
      plan: aggregated.in_progress,
      missed: aggregated.missed,
      done: aggregated.done,
    };
  }

  const selectedStateData = periodData?.[provinsiLabel];
  if (!selectedStateData) {
    return null;
  }

  return {
    plan: toNumber(selectedStateData.in_progress),
    missed: toNumber(selectedStateData.missed),
    done: toNumber(selectedStateData.done),
  };
};

const sanitizeFileNameSegment = (value) =>
  String(value ?? '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_');

const formatExportTimestamp = (value = new Date()) => {
  const date = value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date();

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getExportMonths = (exportData) =>
  Array.isArray(exportData?.months) ? exportData.months : [];

const getExportRows = (exportData) =>
  Array.isArray(exportData?.rows) ? exportData.rows : [];

const formatWeeklyCellValue = (value) => {
  const numericValue = toNumber(value);
  return numericValue > 0 ? numericValue : '';
};

const buildWeeklyTotals = (rows, months) => {
  const totals = {};

  months.forEach((month) => {
    totals[month.key] = WEEK_KEYS.reduce((accumulator, weekKey) => {
      accumulator[weekKey] = 0;
      return accumulator;
    }, {});
  });

  rows.forEach((row) => {
    months.forEach((month) => {
      WEEK_KEYS.forEach((weekKey) => {
        totals[month.key][weekKey] += toNumber(row?.weeks?.[month.key]?.[weekKey]);
      });
    });
  });

  return totals;
};

const sanitizePdfText = (value) => {
  const text = String(value ?? '');
  const normalized = typeof text.normalize === 'function' ? text.normalize('NFKD') : text;

  return normalized
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\x20-\x7E\n]/g, '?');
};

const escapePdfString = (value) =>
  sanitizePdfText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const padCellText = (value, width, align = 'left') => {
  const safeValue = sanitizePdfText(value).replace(/\s+/g, ' ').trim();

  if (width <= 0) {
    return '';
  }

  const normalizedValue = safeValue || '';
  const trimmedValue = normalizedValue.length > width
    ? `${normalizedValue.slice(0, Math.max(width - 3, 0))}${width > 3 ? '...' : ''}`
    : normalizedValue;

  if (align === 'right') {
    return trimmedValue.padStart(width, ' ');
  }

  if (align === 'center') {
    const remaining = width - trimmedValue.length;
    const left = Math.floor(remaining / 2);
    const right = remaining - left;
    return `${' '.repeat(Math.max(left, 0))}${trimmedValue}${' '.repeat(Math.max(right, 0))}`;
  }

  return trimmedValue.padEnd(width, ' ');
};

const chunkArray = (items, size) => {
  if (!Array.isArray(items) || size <= 0) {
    return [];
  }

  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const getMonthAbbreviation = (label) =>
  sanitizePdfText(label).slice(0, 3).toUpperCase();

const buildTableColumns = (monthGroup) => [
  { key: 'province', label: 'Provinsi', width: 14, align: 'left' },
  { key: 'customer', label: 'Customer', width: 28, align: 'left' },
  ...monthGroup.flatMap((month) =>
    WEEK_KEYS.map((weekKey, index) => ({
      key: `${month.key}:${weekKey}`,
      label: `${getMonthAbbreviation(month.label)}${index + 1}`,
      width: 5,
      align: 'center',
    }))
  ),
];

const buildTableSeparator = (columns) =>
  `+-${columns.map((column) => '-'.repeat(column.width)).join('-+-')}-+`;

const buildTableLine = (columns, values) =>
  `| ${columns.map((column) => padCellText(values[column.key], column.width, column.align)).join(' | ')} |`;

const buildMonthGroupLabel = (monthGroup) =>
  monthGroup.map((month) => `${sanitizePdfText(month.label)} ${month.year}`).join(', ');

const buildInfoLine = (label, value) =>
  `${padCellText(label, 18, 'left')} : ${sanitizePdfText(value ?? '-')}`;

const buildPdfTableRows = ({ columns, monthGroup, rowChunk, weeklyTotals, showTotal }) => {
  const lines = [];

  const dataRows = rowChunk.length > 0
    ? rowChunk
    : [{ province: '-', customer: 'Tidak ada data untuk periode ini.', weeks: {} }];

  dataRows.forEach((row) => {
    const values = {
      province: row.province || '-',
      customer: row.customer || '-',
    };

    monthGroup.forEach((month) => {
      WEEK_KEYS.forEach((weekKey) => {
        values[`${month.key}:${weekKey}`] = formatWeeklyCellValue(row?.weeks?.[month.key]?.[weekKey]);
      });
    });

    lines.push(buildTableLine(columns, values));
  });

  if (showTotal) {
    const totalValues = {
      province: 'TOTAL',
      customer: '',
    };

    monthGroup.forEach((month) => {
      WEEK_KEYS.forEach((weekKey) => {
        totalValues[`${month.key}:${weekKey}`] = formatWeeklyCellValue(weeklyTotals?.[month.key]?.[weekKey]);
      });
    });

    lines.push(buildTableSeparator(columns));
    lines.push(buildTableLine(columns, totalValues));
  }

  return lines;
};

const buildPageDefinitions = ({ months, rows, weeklyTotals }) => {
  const monthGroups = chunkArray(months, MONTHS_PER_PAGE);
  const rowChunks = chunkArray(rows, ROWS_PER_PAGE);
  const safeRowChunks = rowChunks.length > 0 ? rowChunks : [[]];
  const safeMonthGroups = monthGroups.length > 0 ? monthGroups : [[]];
  const pages = [];

  safeMonthGroups.forEach((monthGroup) => {
    safeRowChunks.forEach((rowChunk, chunkIndex) => {
      pages.push({
        monthGroup,
        rowChunk,
        showTotal: rows.length > 0 && chunkIndex === safeRowChunks.length - 1,
        weeklyTotals,
      });
    });
  });

  return pages;
};

const buildPageLines = ({
  generatedAt,
  periodLabel,
  provinceLabel,
  userName,
  totalCustomers,
  totalVisits,
  monthGroup,
  rowChunk,
  showTotal,
  weeklyTotals,
  pageNumber,
  totalPages,
}) => {
  const columns = buildTableColumns(monthGroup);
  const separator = buildTableSeparator(columns);
  const headerLine = buildTableLine(
    columns,
    Object.fromEntries(columns.map((column) => [column.key, column.label]))
  );

  return [
    buildInfoLine('Sales', userName || '-'),
    buildInfoLine('Generated At', generatedAt),
    buildInfoLine('Periode', periodLabel),
    buildInfoLine('Provinsi', provinceLabel),
    buildInfoLine('Total Customer', totalCustomers),
    buildInfoLine('Total Aktivitas', totalVisits),
    buildInfoLine('Bulan Halaman', buildMonthGroupLabel(monthGroup) || '-'),
    buildInfoLine('Halaman', `${pageNumber}/${totalPages}`),
    '',
    separator,
    headerLine,
    separator,
    ...buildPdfTableRows({
      columns,
      monthGroup,
      rowChunk,
      weeklyTotals,
      showTotal,
    }),
    separator,
  ];
};

const formatPdfNumber = (value) => Number(value.toFixed(2)).toString();

const buildPdfTextBlock = ({ fontName, fontSize, x, y, lineHeight, lines }) => {
  if (!Array.isArray(lines) || lines.length === 0) {
    return '';
  }

  const [firstLine, ...otherLines] = lines.map((line) => escapePdfString(line));
  const commands = [
    `BT /${fontName} ${formatPdfNumber(fontSize)} Tf ${formatPdfNumber(lineHeight)} TL ${formatPdfNumber(x)} ${formatPdfNumber(y)} Td (${firstLine}) Tj`,
  ];

  otherLines.forEach((line) => {
    commands.push(`T* (${line}) Tj`);
  });

  commands.push('ET');

  return commands.join('\n');
};

const buildPdfPageContent = ({ title, lines }) => {
  const commands = [];

  commands.push(buildPdfTextBlock({
    fontName: 'F2',
    fontSize: 13,
    x: PDF_MARGIN_X,
    y: PDF_TITLE_Y,
    lineHeight: 14,
    lines: [title],
  }));

  commands.push(buildPdfTextBlock({
    fontName: 'F1',
    fontSize: PDF_BODY_FONT_SIZE,
    x: PDF_MARGIN_X,
    y: PDF_BODY_START_Y,
    lineHeight: PDF_LINE_HEIGHT,
    lines,
  }));

  return commands.filter(Boolean).join('\n');
};

const encodePdfString = (value) => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value);
  }

  const bytes = new Uint8Array(value.length);

  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }

  return bytes;
};

const buildPdfDocument = (pageContents) => {
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const regularFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
  const boldFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>');
  const contentIds = pageContents.map((content) =>
    addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
  );
  const pageIds = pageContents.map(() => addObject(''));
  const pagesId = addObject('');
  const catalogId = addObject('');

  pageIds.forEach((pageId, index) => {
    objects[pageId - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Contents ${contentIds[index]} 0 R /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> >>`;
  });

  objects[pagesId - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`;
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return encodePdfString(pdf);
};

const downloadBlob = (blob, fileName) => {
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

export const downloadDashboardPdf = ({ exportData, periodLabel, provinceLabel, userName = '' }) => {
  const generatedAt = formatExportTimestamp();
  const months = getExportMonths(exportData);
  const rows = getExportRows(exportData);
  const weeklyTotals = buildWeeklyTotals(rows, months);
  const totalVisits = toNumber(exportData?.summary?.total_visits)
    || rows.reduce((accumulator, row) => accumulator + toNumber(row?.total), 0);
  const totalCustomers = toNumber(exportData?.summary?.total_rows) || rows.length;
  const pageDefinitions = buildPageDefinitions({ months, rows, weeklyTotals });
  const totalPages = pageDefinitions.length;
  const pageContents = pageDefinitions.map((page, index) =>
    buildPdfPageContent({
      title: 'Dashboard Weekly Export PDF',
      lines: buildPageLines({
        generatedAt,
        periodLabel,
        provinceLabel,
        userName,
        totalCustomers,
        totalVisits,
        monthGroup: page.monthGroup,
        rowChunk: page.rowChunk,
        showTotal: page.showTotal,
        weeklyTotals: page.weeklyTotals,
        pageNumber: index + 1,
        totalPages,
      }),
    })
  );

  const pdfBytes = buildPdfDocument(pageContents);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const userSegment = sanitizeFileNameSegment(userName);
  const timestamp = sanitizeFileNameSegment(generatedAt.replace(',', ''));
  const periodSegment = sanitizeFileNameSegment(periodLabel);
  const provinceSegment = sanitizeFileNameSegment(provinceLabel);
  const fileNameSegments = [
    userSegment,
    'dashboard-weekly',
    periodSegment,
    provinceSegment,
    timestamp,
  ].filter(Boolean);

  downloadBlob(blob, `${fileNameSegments.join('_')}.pdf`);
};
