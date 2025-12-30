import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { keyframes } from '@mui/system';
import { parse, format } from 'date-fns';
import { useActivityPlans } from '../contexts/ActivityPlanContext';

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

export default function HistoryList() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const { fetchAllPlans, allPlans, isLoading, getError } = useActivityPlans();
  
  const loading = isLoading('all');
  const error = getError('all');

  // Fetch history data using shared context
  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      try {
        let data = allPlans;
        
        if (!data) {
          data = await fetchAllPlans();
        }

        if (!isMounted || !data) {
          return;
        }

        const completedTasks = Array.isArray(data)
          ? data.filter(task => task.status === 'done')
          : [];

        const processedHistory = completedTasks.map((task, index) => {
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

        processedHistory.sort((a, b) => {
          const dateA = parse(a.date, 'dd-MM-yyyy', new Date());
          const dateB = parse(b.date, 'dd-MM-yyyy', new Date());
          return dateB - dateA;
        });

        if (isMounted) {
          setHistoryData(processedHistory);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching history:', err);
          setHistoryData([]);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [fetchAllPlans, allPlans]);

  useEffect(() => {
    if (allPlans) {
      const completedTasks = Array.isArray(allPlans)
        ? allPlans.filter(task => task.status === 'done')
        : [];

      const processedHistory = completedTasks.map((task, index) => {
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

      processedHistory.sort((a, b) => {
        const dateA = parse(a.date, 'dd-MM-yyyy', new Date());
        const dateB = parse(b.date, 'dd-MM-yyyy', new Date());
        return dateB - dateA;
      });

      setHistoryData(processedHistory);
    }
  }, [allPlans]);

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

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        mt: { xs: 2, sm: 2.5, md: 3 },
        mb: 1,
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.4rem' },
            fontWeight: 700,
            color: '#333',
          }}
        >
          History Activity
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

      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}
        >
          <CircularProgress />
        </Box>
      ) : historyData.length === 0 ? (
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: { xs: '16px', sm: '18px', md: '20px' },
            padding: { xs: 2, sm: 2.5, md: 3 },
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
          }}
        >
          <Typography color="text.secondary">
            Tidak ada history activity
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {historyData.map((item) => (
          <Box
            key={item.id}
            sx={{
              backgroundColor: 'white',
              borderRadius: { xs: '16px', sm: '18px', md: '20px' },
              padding: { xs: 2, sm: 2.5, md: 3 },
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              position: 'relative',
            }}
          >
            {/* Status Badge */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 16, sm: 20 },
                right: { xs: 16, sm: 20 },
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  color: '#81c784',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  color: '#81c784',
                  fontWeight: 600,
                }}
              >
                Done
              </Typography>
            </Box>

            {/* Task Title */}
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.4rem' },
                fontWeight: 700,
                color: '#333',
                mb: 2,
                pr: { xs: 8, sm: 10 },
              }}
            >
              {item.title}
            </Typography>

            {/* Date and Time */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
                gap: 1,
              }}
            >
              <AccessTimeIcon
                sx={{
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  color: '#999',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
                  color: '#999',
                }}
              >
                {item.date} {item.time}
              </Typography>
            </Box>

            {/* Plan No */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
                  color: '#999',
                  mb: 0.5,
                }}
              >
                Plan No
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  color: '#333',
                  fontWeight: 600,
                }}
              >
                {item.planNo}
              </Typography>
            </Box>

            {/* Tujuan */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
                  color: '#999',
                  mb: 0.5,
                }}
              >
                Tujuan
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  color: '#333',
                  fontWeight: 600,
                }}
              >
                {item.tujuan}
              </Typography>
            </Box>

            {/* Tambahan */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
                  color: '#999',
                  mb: 0.5,
                }}
              >
                Tambahan
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  color: '#666',
                  lineHeight: 1.6,
                }}
              >
                {item.tambahan}
              </Typography>
            </Box>
          </Box>
          ))}
        </Box>
      )}
    </Container>
  );
}

