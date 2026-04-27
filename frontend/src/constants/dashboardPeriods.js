export const DEFAULT_DASHBOARD_PERIOD = 'This Month';

export const DASHBOARD_PERIOD_OPTIONS = [
  'All Periods',
  'Today',
  '7 Days Ago',
  '30 Days Ago',
  'This Month',
  'Last Month',
];

export const DASHBOARD_EXPORT_PERIOD_OPTIONS = [
  {
    value: 'Bulan ini',
    description: 'Data dari awal bulan sampai hari ini.',
  },
  {
    value: 'Bulan Kemarin',
    description: 'Data satu bulan penuh sebelumnya.',
  },
  {
    value: 'Satu Tahun',
    description: 'Data tahun berjalan dari Januari sampai Desember.',
  },
];

const normalizePeriodLabel = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const PERIOD_ALIASES = {
  all_time: ['All Periods', 'All Time', 'Semua'],
  daily: ['Today', 'Hari Ini'],
  weekly: ['7 Days Ago', 'Last 7 Days', '7 Hari Terakhir', 'Mingguan'],
  last_30_days: ['30 Days Ago', 'Last 30 Days', '30 Hari Terakhir'],
  monthly: ['This Month', 'Bulan ini', 'Bulanan'],
  previous_month: ['Last Month', 'Bulan Kemarin', 'Bulan lalu'],
  yearly: ['One Year', 'Satu Tahun'],
};

const PERIOD_KEY_BY_LABEL = Object.entries(PERIOD_ALIASES).reduce(
  (accumulator, [periodKey, labels]) => {
    labels.forEach((label) => {
      accumulator[normalizePeriodLabel(label)] = periodKey;
    });
    return accumulator;
  },
  {}
);

export function getDashboardPeriodKey(periodLabel) {
  return (
    PERIOD_KEY_BY_LABEL[normalizePeriodLabel(periodLabel)] ||
    PERIOD_KEY_BY_LABEL[normalizePeriodLabel(DEFAULT_DASHBOARD_PERIOD)] ||
    'monthly'
  );
}
