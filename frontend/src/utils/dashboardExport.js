import { getDashboardPeriodKey } from '../constants/dashboardPeriods';

const WEEK_KEYS = ['week1', 'week2', 'week3', 'week4'];

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

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

export const downloadDashboardXls = ({ exportData, periodLabel, provinceLabel }) => {
  const generatedAt = formatExportTimestamp();
  const months = getExportMonths(exportData);
  const rows = getExportRows(exportData);
  const weeklyTotals = buildWeeklyTotals(rows, months);
  const totalVisits = toNumber(exportData?.summary?.total_visits)
    || rows.reduce((accumulator, row) => accumulator + toNumber(row?.total), 0);
  const totalCustomers = toNumber(exportData?.summary?.total_rows) || rows.length;
  const totalColumns = 2 + (months.length * WEEK_KEYS.length);

  const monthHeaderHtml = months
    .map((month) => `<th colspan="${WEEK_KEYS.length}">${escapeHtml(month.label)}</th>`)
    .join('');

  const weekHeaderHtml = months
    .map(() => WEEK_KEYS.map((weekKey) => `<th>${escapeHtml(`Week${weekKey.slice(-1)}`)}</th>`).join(''))
    .join('');

  const detailRowsHtml = rows.length > 0
    ? rows
        .map((row) => {
          const weekCellsHtml = months
            .map((month) =>
              WEEK_KEYS
                .map(
                  (weekKey) =>
                    `<td class="value">${escapeHtml(formatWeeklyCellValue(row?.weeks?.[month.key]?.[weekKey]))}</td>`
                )
                .join('')
            )
            .join('');

          return `
            <tr>
              <td>${escapeHtml(row.province)}</td>
              <td>${escapeHtml(row.customer)}</td>
              ${weekCellsHtml}
            </tr>
          `;
        })
        .join('')
    : `
        <tr>
          <td colspan="${escapeHtml(totalColumns)}" class="empty">Tidak ada data untuk periode ini.</td>
        </tr>
      `;

  const totalRowHtml = rows.length > 0
    ? `
        <tr class="total">
          <td colspan="2">Total</td>
          ${months
            .map((month) =>
              WEEK_KEYS
                .map(
                  (weekKey) =>
                    `<td class="value">${escapeHtml(formatWeeklyCellValue(weeklyTotals?.[month.key]?.[weekKey]))}</td>`
                )
                .join('')
            )
            .join('')}
        </tr>
      `
    : '';

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          table { border-collapse: collapse; margin-bottom: 16px; }
          th, td { border: 1px solid #C7D2E0; padding: 8px 10px; vertical-align: middle; }
          th { background: #EAF3FB; font-weight: 700; text-align: center; }
          td { background: #FFFFFF; }
          .title { background: #6BA3D0; color: #FFFFFF; font-size: 16px; text-align: left; }
          .value { text-align: center; min-width: 62px; }
          .sticky-label { min-width: 180px; }
          .customer { min-width: 320px; }
          .total td { background: #F3F7FB; font-weight: 700; }
          .empty { text-align: center; color: #6B7280; font-style: italic; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <th class="title" colspan="2">Dashboard Weekly Export</th>
          </tr>
          <tr>
            <th>Generated At</th>
            <td>${escapeHtml(generatedAt)}</td>
          </tr>
          <tr>
            <th>Periode</th>
            <td>${escapeHtml(periodLabel)}</td>
          </tr>
          <tr>
            <th>Provinsi</th>
            <td>${escapeHtml(provinceLabel)}</td>
          </tr>
          <tr>
            <th>Total Customer</th>
            <td>${escapeHtml(totalCustomers)}</td>
          </tr>
          <tr>
            <th>Total Aktivitas</th>
            <td>${escapeHtml(totalVisits)}</td>
          </tr>
        </table>

        <table>
          <tr>
            <th rowspan="2" class="sticky-label">Wilayah</th>
            <th rowspan="2" class="customer">Customer</th>
            ${monthHeaderHtml}
          </tr>
          <tr>
            ${weekHeaderHtml}
          </tr>
          ${detailRowsHtml}
          ${totalRowHtml}
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = sanitizeFileNameSegment(generatedAt.replace(',', ''));
  const periodSegment = sanitizeFileNameSegment(periodLabel);
  const provinceSegment = sanitizeFileNameSegment(provinceLabel);

  link.href = downloadUrl;
  link.download = `dashboard-weekly_${periodSegment}_${provinceSegment}_${timestamp}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};
