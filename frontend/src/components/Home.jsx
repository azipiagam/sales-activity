import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { keyframes } from '@mui/system';
import { parse, format } from 'date-fns';
import { useActivityPlans } from '../contexts/ActivityPlanContext';
import { getSales } from '../utils/auth';
import TaskDashboard from './TaskDashboard';
import LatestCustomers from './LatestCustomers';

const fadeOut = keyframes`
  from {
    opacity: 2;
  }
  to {
    opacity: 0.6;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0.6;
  }
  to {
    opacity: 2;
  }
`;

export default function Home() {
  const { fetchAllPlans, allPlans, isLoading, getError } = useActivityPlans();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const loading = isLoading('all');
  const error = getError('all');

  // Fetch home data using shared context
  useEffect(() => {
    let isMounted = true;

    const fetchHome = async () => {
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
          console.error('Error fetching home data:', err);
        }
      }
    };

    fetchHome();

    return () => {
      isMounted = false;
    };
  }, [fetchAllPlans, allPlans]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTime(new Date());
        setTimeout(() => {
          setIsAnimating(false);
        }, 800);
      }, 2400);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const day = String(currentTime.getDate()).padStart(2, '0');
  const month = String(currentTime.getMonth() + 1).padStart(2, '0');
  const year = currentTime.getFullYear();
  const dateString = `${day}-${month}-${year}`;
  
  const hours = currentTime.getHours();
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeString = `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;

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
        mt: 0,
        mb: 1,
        px: { xs: 2, sm: 3 },
      }}
    >
      {/* Clean Header with Date Navigation */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: { xs: 4.1, sm: 4, md: 4.5 },
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            fontWeight: 700,
            color: '#1F2937',
          }}
        >
          Dashboard
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            animation: `${fadeIn} 1.2s ease-out`,
          }}
        >
          <AccessTimeIcon
            sx={{
              fontSize: { xs: '1rem', sm: '1.1rem' },
              color: '#81c784', // Light green color
              animation: isAnimating 
                ? `${fadeOut} 1.2s ease-in-out forwards` 
                : `${fadeIn} 1.2s ease-in-out forwards`,
              alignSelf: 'center',
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
              color: '#999', // Light grey color
              animation: isAnimating 
                ? `${fadeOut} 1.2s ease-in-out forwards` 
                : `${fadeIn} 1.2s ease-in-out forwards`,
              display: 'inline-flex',
              alignItems: 'center',
              lineHeight: 1,
            }}
          >
            {dateString} {timeString}
          </Typography>
        </Box>
      </Box>

      {/* Task Dashboard */}
      <TaskDashboard selectedDate={selectedDate} />

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

