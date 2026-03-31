export const DEFAULT_DASHBOARD_PERIOD = 'Bulan ini';

export const DASHBOARD_PERIOD_OPTIONS = [
  'Semua',
  'Hari Ini',
  '7 Hari Terakhir',
  '30 Hari Terakhir',
  'Bulan ini',
  'Bulan lalu',
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
    description: 'Akumulasi 12 bulan terakhir sampai hari ini.',
  },
];

const PERIOD_KEY_BY_LABEL = {
  Semua: 'all_time',
  'Hari Ini': 'daily',
  '7 Hari Terakhir': 'weekly',
  '30 Hari Terakhir': 'last_30_days',
  'Bulan ini': 'monthly',
  'Bulan Kemarin': 'previous_month',
  'Bulan lalu': 'previous_month',
  'Satu Tahun': 'yearly',
  Mingguan: 'weekly',
  Bulanan: 'monthly',
};

export function getDashboardPeriodKey(periodLabel) {
  return PERIOD_KEY_BY_LABEL[periodLabel] || PERIOD_KEY_BY_LABEL[DEFAULT_DASHBOARD_PERIOD];
}
