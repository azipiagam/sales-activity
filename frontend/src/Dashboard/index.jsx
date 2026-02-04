import React from 'react';
import DashboardComponent from '../components/Dashboard';

export default function Dashboard({
  refreshKey,
  periodFilter,
  onPeriodFilterChange,
  provinceFilter,
  onProvinceFilterChange,
  onProvinceOptionsChange,
}) {
  return (
    <DashboardComponent
      refreshKey={refreshKey}
      periodFilter={periodFilter}
      onPeriodFilterChange={onPeriodFilterChange}
      provinceFilter={provinceFilter}
      onProvinceFilterChange={onProvinceFilterChange}
      onProvinceOptionsChange={onProvinceOptionsChange}
    />
  );
}


