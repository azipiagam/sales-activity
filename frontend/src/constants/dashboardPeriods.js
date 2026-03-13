export const DEFAULT_DASHBOARD_PERIOD = 'Bulan ini';

export const DASHBOARD_PERIOD_OPTIONS = [
  'Semua',
  'Hari Ini',
  '7 Hari Terakhir',
  '30 Hari Terakhir',
  'Bulan ini',
  'Bulan lalu',
];

const PERIOD_KEY_BY_LABEL = {
  Semua: 'all_time',
  'Hari Ini': 'daily',
  '7 Hari Terakhir': 'weekly',
  '30 Hari Terakhir': 'last_30_days',
  'Bulan ini': 'monthly',
  'Bulan lalu': 'previous_month',
  Mingguan: 'weekly',
  Bulanan: 'monthly',
};

export function getDashboardPeriodKey(periodLabel) {
  return PERIOD_KEY_BY_LABEL[periodLabel] || PERIOD_KEY_BY_LABEL[DEFAULT_DASHBOARD_PERIOD];
}
