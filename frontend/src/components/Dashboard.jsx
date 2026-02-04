import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import { parse, format } from 'date-fns';
import { useActivityPlans } from '../contexts/ActivityPlanContext';
import { getSales } from '../utils/auth';
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
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loading = isLoading('all');
  const error = getError('all');

  // Fetch dashboard data using shared context
  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        // Get current logged in user
        const currentUser = getSales();
        const currentUserId = currentUser?.internal_id;

        if (!currentUserId) {
          return;
        }

        let data = allPlans;

        if (!data) {
          data = await fetchAllPlans();
        }

        if (!isMounted || !data) {
          return;
        }

        // Filter tasks berdasarkan user yang login dan status done
        const completedTasks = Array.isArray(data)
          ? data.filter(task => {
              const isUserTask = task.sales_internal_id === currentUserId;
              const isDone = task.status === 'done';
              return isUserTask && isDone;
            })
          : [];

        const processedData = completedTasks.map((task, index) => {
          let visitDate = new Date();
          if (task.plan_date) {
            visitDate = parse(task.plan_date, 'yyyy-MM-dd', new Date());
            if (isNaN(visitDate.getTime())) {
              visitDate = new Date(task.plan_date);
            }
          }

          let actualDate = visitDate;
          if (task.actual_visit_date) {
            actualDate = parse(task.actual_visit_date, 'yyyy-MM-dd', new Date());
            if (isNaN(actualDate.getTime())) {
              actualDate = new Date(task.actual_visit_date);
            }
          }

          let formattedTujuan = 'Visit';
          if (task.tujuan) {
            formattedTujuan = task.tujuan.charAt(0).toUpperCase() + task.tujuan.slice(1).toLowerCase();
            if (formattedTujuan.toLowerCase() === 'follow up') {
              formattedTujuan = 'Follow Up';
            }
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

        // Data processing completed
        // TODO: Apply timeFilter to filter processedData if needed
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching dashboard data:', err);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [fetchAllPlans, allPlans]);

  useEffect(() => {
    // Get current logged in user
    const currentUser = getSales();
    const currentUserId = currentUser?.internal_id;

    if (!currentUserId) {
      return;
    }

    if (allPlans) {
      // Filter tasks berdasarkan user yang login dan status done
      const completedTasks = Array.isArray(allPlans)
        ? allPlans.filter(task => {
            const isUserTask = task.sales_internal_id === currentUserId;
            const isDone = task.status === 'done';
            return isUserTask && isDone;
          })
        : [];

      const processedData = completedTasks.map((task, index) => {
        let visitDate = new Date();
        if (task.plan_date) {
          visitDate = parse(task.plan_date, 'yyyy-MM-dd', new Date());
          if (isNaN(visitDate.getTime())) {
            visitDate = new Date(task.plan_date);
          }
        }

        let actualDate = visitDate;
        if (task.actual_visit_date) {
          actualDate = parse(task.actual_visit_date, 'yyyy-MM-dd', new Date());
          if (isNaN(actualDate.getTime())) {
            actualDate = new Date(task.actual_visit_date);
          }
        }

        let formattedTujuan = 'Visit';
        if (task.tujuan) {
          formattedTujuan = task.tujuan.charAt(0).toUpperCase() + task.tujuan.slice(1).toLowerCase();
          if (formattedTujuan.toLowerCase() === 'follow up') {
            formattedTujuan = 'Follow Up';
          }
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

      // Data processing completed
      // TODO: Apply timeFilter to filter processedData if needed
    }
  }, [allPlans]);


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
      <LatestCustomers />

      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error">
            {error}
          </Alert>
        </Box>
      )}

    </Container>
  );
}

