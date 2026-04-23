import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import { parse, format } from 'date-fns';
import { useActivityPlans } from '../../contexts/ActivityPlanContext';
import { getSales } from '../../utils/auth';
import { useAuth } from '../../utils/useAuth';
import TaskDashboard from './TaskDashboard';
import LatestCustomers from './LatestCustomers';

export default function Dashboard({
  refreshKey,
  periodFilter,
  onPeriodFilterChange,
  provinceFilter,
  onProvinceFilterChange,
  onProvinceOptionsChange,
}) {
  const { fetchAllPlans, allPlans, isLoading, getError } = useActivityPlans();
  const { sales } = useAuth(); // ✅ di level komponen
  const currentUserId = sales?.internal_id;
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loading = isLoading('all');
  const error = getError('all');
  const shouldShowError = error && !String(error).toLowerCase().includes('failed to fetch');

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        if (!currentUserId) return; // ✅ pakai dari atas

        let data = allPlans;
        if (!data) {
          data = await fetchAllPlans();
        }

        if (!isMounted || !data) return;

        const completedTasks = Array.isArray(data)
          ? data.filter(task =>
              String(task.sales_internal_id) === String(currentUserId) && task.status === 'done'
            )
          : [];

        const processedData = completedTasks.map((task, index) => {
          let visitDate = new Date();
          if (task.plan_date) {
            visitDate = parse(task.plan_date, 'yyyy-MM-dd', new Date());
            if (isNaN(visitDate.getTime())) visitDate = new Date(task.plan_date);
          }

          let actualDate = visitDate;
          if (task.actual_visit_date) {
            actualDate = parse(task.actual_visit_date, 'yyyy-MM-dd', new Date());
            if (isNaN(actualDate.getTime())) actualDate = new Date(task.actual_visit_date);
          }

          let formattedTujuan = 'Visit';
          if (task.tujuan) {
            formattedTujuan = task.tujuan.charAt(0).toUpperCase() + task.tujuan.slice(1).toLowerCase();
            if (formattedTujuan.toLowerCase() === 'follow up') formattedTujuan = 'Follow Up';
          }

          return {
            id: task.id || index,
            title: task.customer_name || 'N/A',
            date: format(actualDate, 'dd-MM-yyyy'),
            time: task.actual_visit_time || format(actualDate, 'hh:mm a'),
            planNo: task.plan_no || 'N/A',
            tujuan: formattedTujuan,
            tambahan: task.keterangan_tambahan || '',
            status: 'done',
          };
        });

        processedData.sort((a, b) => {
          const dateA = parse(a.date, 'dd-MM-yyyy', new Date());
          const dateB = parse(b.date, 'dd-MM-yyyy', new Date());
          return dateB - dateA;
        });

      } catch (err) {
        if (isMounted) console.error('Error fetching dashboard data:', err);
      }
    };

    fetchDashboard();
    return () => { isMounted = false; };
  }, [fetchAllPlans, allPlans, currentUserId]); // ✅ tambah currentUserId

  useEffect(() => {
    if (!currentUserId || !allPlans) return; // ✅ pakai dari atas

    const completedTasks = Array.isArray(allPlans)
      ? allPlans.filter(task =>
          String(task.sales_internal_id) === String(currentUserId) && task.status === 'done'
        )
      : [];

    const processedData = completedTasks.map((task, index) => {
      let visitDate = new Date();
      if (task.plan_date) {
        visitDate = parse(task.plan_date, 'yyyy-MM-dd', new Date());
        if (isNaN(visitDate.getTime())) visitDate = new Date(task.plan_date);
      }

      let actualDate = visitDate;
      if (task.actual_visit_date) {
        actualDate = parse(task.actual_visit_date, 'yyyy-MM-dd', new Date());
        if (isNaN(actualDate.getTime())) actualDate = new Date(task.actual_visit_date);
      }

      let formattedTujuan = 'Visit';
      if (task.tujuan) {
        formattedTujuan = task.tujuan.charAt(0).toUpperCase() + task.tujuan.slice(1).toLowerCase();
        if (formattedTujuan.toLowerCase() === 'follow up') formattedTujuan = 'Follow Up';
      }

      return {
        id: task.id || index,
        title: task.customer_name || 'N/A',
        date: format(actualDate, 'dd-MM-yyyy'),
        time: task.actual_visit_time || format(actualDate, 'hh:mm a'),
        planNo: task.plan_no || 'N/A',
        tujuan: formattedTujuan,
        tambahan: task.keterangan_tambahan || '',
        status: 'done',
      };
    });

    processedData.sort((a, b) => {
      const dateA = parse(a.date, 'dd-MM-yyyy', new Date());
      const dateB = parse(b.date, 'dd-MM-yyyy', new Date());
      return dateB - dateA;
    });

  }, [allPlans, currentUserId]); // ✅ tambah currentUserId


  return (
    <Container
      maxWidth="md"
      sx={{
        mt: 4,
        mb: 1,
        px: { xs: 2, sm: 3 },
      }}
    >
      {/* Task Dashboard */}
      <TaskDashboard
        selectedDate={selectedDate}
        refreshKey={refreshKey}
        periodFilter={periodFilter}
        onPeriodFilterChange={onPeriodFilterChange}
        provinceFilter={provinceFilter}
        onProvinceFilterChange={onProvinceFilterChange}
        onProvinceOptionsChange={onProvinceOptionsChange}
        hideFilters
      />

      {/* Latest Customers */}
      <LatestCustomers refreshKey={refreshKey} periodFilter={periodFilter} />

      {shouldShowError && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error">
            {error}
          </Alert>
        </Box>
      )}

    </Container>
  );
}

