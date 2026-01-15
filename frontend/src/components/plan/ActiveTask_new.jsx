import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import Tooltip from '@mui/material/Tooltip';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CircularProgress from '@mui/material/CircularProgress';
import WarningIcon from '@mui/icons-material/Warning';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Chip from '@mui/material/Chip';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { parse, format } from 'date-fns';
import { apiRequest } from '../../config/api';
import { useActivityPlans } from '../../contexts/ActivityPlanContext';
import { useNavigate } from 'react-router-dom';
import { getSales } from '../../utils/auth';
import LoadingManager from '../loading/LoadingManager';
import Lottie from 'lottie-react';
import emptyBoxAnimation from '../../media/Empty Box (3).json';

export default function ActiveTask({ selectedDate, isDateCarouselLoading = false }) {
  const navigate = useNavigate();
  const [openRescheduleModal, setOpenRescheduleModal] = useState(false);
  const [activeTasks, setActiveTasks] = useState([]);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [actualVisitDate, setActualVisitDate] = useState(new Date());
  const [newVisitDate, setNewVisitDate] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTaskId, setMenuTaskId] = useState(null);

  // Get context with safe fallback
  const contextValue = useActivityPlans();

  // Early return if context is not ready
  if (!contextValue) {
    return (
      <Container maxWidth="md" sx={{ mt: 2, mb: 2, px: { xs: 2, sm: 3 } }}>
        <Box sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: { xs: '16px', sm: '18px', md: '20px' },
          padding: { xs: 3, sm: 4, md: 5 },
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          textAlign: 'center',
        }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  const {
    fetchPlansByDate = () => {},
    getPlansByDate = () => null,
    isLoading = () => false,
    getError = () => null,
    invalidateCache = () => {},
    updatePlanInCache = () => {},
    dataByDate = new Map(),
    selectedFilter = 'plan'
  } = contextValue;

  const dateToUse = selectedDate && !isNaN(new Date(selectedDate).getTime()) ? new Date(selectedDate) : new Date();
  let dateStr = '1970-01-01'; // fallback date
  try {
    dateStr = format(dateToUse, 'yyyy-MM-dd');
  } catch (err) {
    console.warn('Error formatting date:', err);
  }

  // Safe function calls
  const loadingKey = `date:${dateStr}`;
  const loading = typeof isLoading === 'function' ? isLoading(loadingKey) : false;
  const error = typeof getError === 'function' ? getError(loadingKey) : null;

  // Use refs to prevent infinite loops
  const lastFetchDateRef = useRef(null);
  const lastFetchFilterRef = useRef(null);
  const isFetchingRef = useRef(false);

  const processTasksData = useCallback((data, forceUpdate = false) => {
    try {
      // Get current logged in user
      const currentUser = getSales();
      const currentUserId = currentUser?.internal_id;

      if (!currentUserId) {
        setActiveTasks([]);
        return;
      }

      console.log('[ActiveTask] fetchActiveTask - Raw data:', {
        date: dateStr,
        dataLength: Array.isArray(data) ? data.length : 0,
        data: Array.isArray(data) ? data.map(t => ({
          id: t.id,
          plan_no: t.plan_no,
          status: t.status,
          plan_date: t.plan_date,
          sales_internal_id: t.sales_internal_id
        })) : null
      });

      // Filter tasks berdasarkan user yang login dan status yang valid
      const activeTasksData = Array.isArray(data)
        ? data.filter(task => {
            const normalizedStatus = (task.status || '').toLowerCase().trim();
            const isUserTask = task.sales_internal_id === currentUserId;
            const shouldInclude = normalizedStatus === 'in progress' ||
                   normalizedStatus === 'rescheduled' ||
                   normalizedStatus === 'done' ||
                   normalizedStatus === 'missed' ||
                   normalizedStatus === 'deleted';

            if (normalizedStatus === 'in progress' && isUserTask) {
              console.log('[ActiveTask] In progress task found:', {
                id: task.id,
                plan_no: task.plan_no,
                plan_date: task.plan_date,
                status: normalizedStatus,
                shouldInclude
              });
            }

            return isUserTask && shouldInclude;
          })
        : [];

      console.log('[ActiveTask] Filtered activeTasksData:', {
        count: activeTasksData.length,
        tasks: activeTasksData.map(t => ({
          id: t.id,
          plan_no: t.plan_no,
          status: t.status,
          plan_date: t.plan_date
        }))
      });

      if (activeTasksData.length > 0) {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');

        console.log('[ActiveTask] Date comparison - todayStr:', todayStr);

        const processedTasks = activeTasksData.map(taskData => {
          let visitDate = new Date();
          if (taskData.plan_date) {
            visitDate = parse(taskData.plan_date, 'yyyy-MM-dd', new Date());
            if (isNaN(visitDate.getTime())) {
              visitDate = new Date(taskData.plan_date);
            }
          }

          const taskDateStr = format(visitDate, 'yyyy-MM-dd');

          let status = (taskData.status || 'in progress').toLowerCase().trim();
          const originalStatus = status;

          if ((status === 'in progress' || status === 'rescheduled') && taskDateStr < todayStr) {
            status = 'missed';
            console.log('[ActiveTask] Status changed to missed:', {
              id: taskData.id,
              plan_no: taskData.plan_no,
              originalStatus,
              newStatus: status,
              taskDateStr,
              todayStr
            });
          }

          // Format tujuan
          let formattedTujuan = 'Visit';
          if (taskData.tujuan) {
            formattedTujuan = taskData.tujuan.charAt(0).toUpperCase() + taskData.tujuan.slice(1).toLowerCase();
            if (formattedTujuan.toLowerCase() === 'follow up') {
              formattedTujuan = 'Follow Up';
            }
          }

          return {
            id: taskData.id,
            namaCustomer: taskData.customer_name || 'N/A',
            idPlan: taskData.plan_no || 'N/A',
            tujuan: formattedTujuan,
            tambahan: taskData.keterangan_tambahan || '',
            visitDate: visitDate,
            status: status,
          };
        });

        // Filter tasks based on selectedFilter
        let filteredTasks = processedTasks;
        if (selectedFilter === 'done') {
          filteredTasks = processedTasks.filter(t => t.status === 'done');
        } else if (selectedFilter === 'more') {
          filteredTasks = processedTasks.filter(t =>
            t.status === 'in progress' || t.status === 'rescheduled' || t.status === 'missed'
          );
        } else if (selectedFilter === 'plan') {
          // Show all (done + in progress + rescheduled + missed)
          filteredTasks = processedTasks.filter(t =>
            t.status === 'done' ||
            t.status === 'in progress' ||
            t.status === 'rescheduled' ||
            t.status === 'missed'
          );
        }

        filteredTasks.sort((a, b) => {
          const statusPriority = {
            'deleted': 1,
            'done': 2,
            'missed': 3,
            'rescheduled': 4,
            'in progress': 5
          };
          const aPriority = statusPriority[a.status] || 99;
          const bPriority = statusPriority[b.status] || 99;

          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }

          return b.visitDate - a.visitDate;
        });

        console.log('[ActiveTask] Final processedTasks (fetchActiveTask):', {
          count: filteredTasks.length,
          selectedFilter,
          tasks: filteredTasks.map(t => ({
            id: t.id,
            plan_no: t.idPlan,
            status: t.status,
            visitDate: format(t.visitDate, 'yyyy-MM-dd')
          })),
          todayStr: format(new Date(), 'yyyy-MM-dd')
        });

        // Only update state if the data actually changed
        setActiveTasks(prevTasks => {
          const isEqual = prevTasks.length === filteredTasks.length &&
            prevTasks.every((task, index) => {
              const prevTask = prevTasks[index];
              const newTask = filteredTasks[index];
              return prevTask && newTask &&
                prevTask.id === newTask.id &&
                prevTask.status === newTask.status &&
                prevTask.namaCustomer === newTask.namaCustomer &&
                prevTask.visitDate.getTime() === newTask.visitDate.getTime();
            });

          return isEqual && !forceUpdate ? prevTasks : filteredTasks;
        });
      } else {
        setActiveTasks(prevTasks => forceUpdate || prevTasks.length > 0 ? [] : prevTasks);
      }
    } catch (err) {
      console.error('Error processing active tasks:', err);
      setActiveTasks([]);
    }
  }, [dateStr, selectedFilter]);


  // Main effect for fetching and processing data
  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        // Get current logged in user
        const currentUser = getSales();
        const currentUserId = currentUser?.internal_id;

        if (!currentUserId) {
          setActiveTasks([]);
          return;
        }

        let data = getPlansByDate(dateToUse);

        if (!data) {
          data = await fetchPlansByDate(dateToUse);
        }

        // Process the data
        processTasksData(data, false);

      } catch (err) {
        console.error('Error in main fetch effect:', err);
        setActiveTasks([]);
      }
    };

    fetchAndProcessData();
  }, [dateStr, selectedFilter, getPlansByDate, fetchPlansByDate, processTasksData]); // Include stable functions

  const handlePlanCreated = useCallback(() => {
    // Force refresh when plan is created - trigger main effect by invalidating cache
    invalidateCache(dateToUse);
    // Re-fetch data
    const fetchAndProcessData = async () => {
      try {
        let data = await fetchPlansByDate(dateToUse, true); // Force fetch
        processTasksData(data, true);
      } catch (err) {
        console.error('Error refetching after plan created:', err);
      }
    };
    fetchAndProcessData();
  }, [invalidateCache, dateToUse, fetchPlansByDate, processTasksData]);

  useEffect(() => {
    window.addEventListener('activityPlanCreated', handlePlanCreated);

    return () => {
      window.removeEventListener('activityPlanCreated', handlePlanCreated);
    };
  }, [handlePlanCreated]);


  const handleOpenMenu = (event, taskId) => {
    setMenuAnchor(event.currentTarget);
    setMenuTaskId(taskId);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuTaskId(null);
  };

  const handleMenuCancel = (taskId) => {
    handleCloseMenu();
    handleCancelTask(taskId);
  };

  const handleMenuReschedule = (taskId) => {
    handleCloseMenu();
    handleOpenRescheduleModal(taskId);
  };

  const handleOpenRescheduleModal = (taskId) => {
    const activeTask = activeTasks.find(task => task.id === taskId);
    if (activeTask) {
      setCurrentTaskId(taskId);
      setActualVisitDate(activeTask.visitDate);
      setNewVisitDate(activeTask.visitDate);
      setOpenRescheduleModal(true);
    }
  };

  const handleCloseRescheduleModal = () => {
    setOpenRescheduleModal(false);
    setCurrentTaskId(null);
    if (currentTaskId) {
      const activeTask = activeTasks.find(task => task.id === currentTaskId);
      if (activeTask) {
        setNewVisitDate(activeTask.visitDate);
      }
    }
  };

  const handleConfirmReschedule = async () => {
    if (!currentTaskId || !newVisitDate) {
      alert('Mohon pilih tanggal baru untuk reschedule');
      return;
    }

    const activeTask = activeTasks.find(task => task.id === currentTaskId);
    if (!activeTask) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(newVisitDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert('Tanggal baru harus >= hari ini');
      return;
    }

    try {
      setSaving(true);

      const newDateStr = format(newVisitDate, 'yyyy-MM-dd');

      const response = await apiRequest(`activity-plans/${currentTaskId}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({
          new_date: newDateStr,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reschedule');
      }

      // Update state immediately for better UX, then refresh from server
      setActiveTasks(prevTasks => prevTasks.filter(task => task.id !== currentTaskId));

      handleCloseRescheduleModal();

      // Refresh data from server to ensure consistency
      try {
        invalidateCache(dateToUse);
        const freshData = await fetchPlansByDate(dateToUse, true);
        if (freshData) {
          processTasksData(freshData, true);
        }
      } catch (refreshError) {
        console.warn('Failed to refresh data after reschedule:', refreshError);
      }
    } catch (err) {
      console.error('Error rescheduling:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleNavigateToDonePage = (taskId) => {
    console.log('Navigating to done page with taskId:', taskId);
    // Force full page navigation to ensure immediate transition
    window.location.href = `${window.location.origin}/done/${taskId}`;
  };

  const handleCancelTask = async (taskId) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan task ini?')) {
      return;
    }

    try {
      setSaving(true);

      const response = await apiRequest(`activity-plans/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to cancel task');
      }

      // Update state immediately for better UX, then refresh from server
      setActiveTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

      // Refresh data from server to ensure consistency
      try {
        invalidateCache(dateToUse);
        const freshData = await fetchPlansByDate(dateToUse, true);
        if (freshData) {
          processTasksData(freshData, true);
        }
      } catch (refreshError) {
        console.warn('Failed to refresh data after cancel:', refreshError);
      }
    } catch (err) {
      console.error('Error canceling task:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const dateStr = format(date, 'dd-MM-yyyy');
    return dateStr;
  };

  if (loading && !isDateCarouselLoading) {
    return <LoadingManager type="default" />;
  }

  if (error) {
    return (
      <Container
        maxWidth="md"
        sx={{
          mt: 2,
          mb: 2,
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            backgroundColor: '#FFFFFF',
            borderRadius: { xs: '16px', sm: '18px', md: '20px' },
            padding: { xs: 2, sm: 2.5, md: 3 },
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
          }}
        >
          <Typography color="error">
            Error: {error}
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show no active task state
  if (activeTasks.length === 0) {
    return (
      <Container
        maxWidth="md"
        sx={{
          mt: 2,
          mb: 2,
          px: { xs: 2, sm: 3 },
          minHeight: { xs: 'calc(100vh - 500px)', sm: 'calc(100vh - 450px)', md: 'calc(100vh - 400px)' },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            backgroundColor: '#FFFFFF',
            borderRadius: { xs: '16px', sm: '18px', md: '20px' },
            padding: { xs: 3, sm: 4, md: 5 },
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            flex: 1,
            minHeight: { xs: '200px', sm: '250px', md: '300px' },
          }}
        >
          <Box
            sx={{
              width: { xs: '200px', sm: '250px', md: '300px' },
              height: { xs: '200px', sm: '250px', md: '300px' },
              mb: 2,
            }}
          >
            <Lottie
              animationData={emptyBoxAnimation}
              loop={true}
            />
          </Box>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
            }}
          >
            {selectedFilter === 'done'
              ? 'Tidak ada task yang sudah selesai'
              : selectedFilter === 'more'
              ? 'Tidak ada task yang perlu dikerjakan'
              : 'Tidak ada active task saat ini'}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="md"
      sx={{
        mt: 2,
        mb: 2,
        px: { xs: 2, sm: 3 },
      }}
    >
      {activeTasks.map((activeTask, index) => (
        <Box
          key={`task-${activeTask.id}-${activeTask.status}`}
          sx={{
            backgroundColor: '#FFFFFF',
            borderRadius: { xs: '8px', sm: '10px', md: '12px' },
            padding: { xs: 1.5, sm: 2, md: 2.5 },
            border: '1px solid rgba(107, 163, 208, 0.2)',
            position: 'relative',
            mb: index < activeTasks.length - 1 ? 2 : 0,
            opacity: activeTask.status === 'done' || activeTask.status === 'deleted' ? 0.7 : 1,
            transition: 'border-bottom 0.2s ease',
            '&:hover': {
              borderBottom: '1px solid #6BA3D0',
            },
          }}
        >
          {/* Menu Button */}
          {activeTask.status !== 'done' && activeTask.status !== 'deleted' && (
            <IconButton
              onClick={(e) => handleOpenMenu(e, activeTask.id)}
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: 12 },
                right: { xs: 8, sm: 12 },
                color: '#666',
                zIndex: 10,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  color: '#333',
                },
              }}
            >
              <MoreVertIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
            </IconButton>
          )}

          {/* Task Title */}
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.4rem' },
              fontWeight: 700,
              color: '#333',
              mb: 2,
            }}
          >
            {activeTask.namaCustomer}
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
                color: '#81c784', // Light green color
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
                color: '#999', // Light grey color
              }}
            >
              {formatDateTime(activeTask.visitDate)}
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
              {activeTask.idPlan}
            </Typography>
          </Box>

          {/* Status Badge */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
                color: '#999',
                mb: 0.5,
              }}
            >
              Status
            </Typography>
            {activeTask.status === 'done' ? (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '0.875rem !important' }} />}
                label="Done"
                size="small"
                sx={{
                  backgroundColor: 'rgba(129, 199, 132, 0.15)',
                  color: '#4caf50',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  height: '24px',
                  '& .MuiChip-icon': {
                    color: '#4caf50',
                    fontSize: '0.875rem',
                  },
                }}
              />
            ) : activeTask.status === 'deleted' ? (
              <Chip
                icon={<CancelIcon sx={{ fontSize: '0.875rem !important' }} />}
                label="Cancel"
                size="small"
                sx={{
                  backgroundColor: 'rgba(158, 158, 158, 0.15)',
                  color: '#757575',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  height: '24px',
                  '& .MuiChip-icon': {
                    color: '#757575',
                    fontSize: '0.875rem',
                  },
                }}
              />
            ) : activeTask.status === 'missed' ? (
              <Chip
                icon={<WarningIcon sx={{ fontSize: '0.875rem !important' }} />}
                label="Missed"
                size="small"
                sx={{
                  backgroundColor: 'rgba(244, 67, 54, 0.15)',
                  color: '#d32f2f',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  height: '24px',
                  '& .MuiChip-icon': {
                    color: '#d32f2f',
                    fontSize: '0.875rem',
                  },
                }}
              />
            ) : activeTask.status === 'rescheduled' ? (
              <Chip
                icon={<EventIcon sx={{ fontSize: '0.875rem !important' }} />}
                label="Rescheduled"
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 152, 0, 0.15)',
                  color: '#f57c00',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  height: '24px',
                  '& .MuiChip-icon': {
                    color: '#f57c00',
                    fontSize: '0.875rem',
                  },
                }}
              />
            ) : (
              <Chip
                icon={<PlayCircleIcon sx={{ fontSize: '0.875rem !important' }} />}
                label="In Progress"
                size="small"
                sx={{
                  backgroundColor: 'rgba(107, 163, 208, 0.15)',
                  color: '#5a8fb8',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  height: '24px',
                  '& .MuiChip-icon': {
                    color: '#5a8fb8',
                    fontSize: '0.875rem',
                  },
                }}
              />
            )}
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
              {activeTask.tujuan}
            </Typography>
          </Box>

          {/* Tambahan */}
          {activeTask.tambahan && (
            <Box sx={{ mb: 2 }}>
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
                {activeTask.tambahan}
              </Typography>
            </Box>
          )}

          {/* Action Buttons - Only show if status is not "done" or "deleted" */}
          {activeTask.status !== 'done' && activeTask.status !== 'deleted' && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: { xs: 1, sm: 1.5 },
                mt: 3,
                pt: 2,
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              {/* Done button - only show if status is not "missed" */}
              {activeTask.status !== 'missed' && (
                <Button
                  onClick={() => handleNavigateToDonePage(activeTask.id)}
                  disabled={saving}
                  startIcon={<CheckCircleIcon sx={{ color: 'white' }} />}
                  sx={{
                    color: 'white',
                    backgroundColor: '#6BA3D0',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                    px: { xs: 3, sm: 4, md: 5 },
                    py: { xs: 1, sm: 1.25, md: 1.5 },
                    minWidth: { xs: '120px', sm: '140px', md: '160px' },
                    borderRadius: { xs: '8px', sm: '10px' },
                    '&:hover': {
                      backgroundColor: '#5a8fb8',
                      color: 'white',
                    },
                    '&:disabled': {
                      backgroundColor: '#f5f5f5',
                      color: '#ccc',
                    },
                  }}
                >
                  Done
                </Button>
              )}
            </Box>
          )}
        </Box>
      ))}

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: { xs: '8px', sm: '10px' },
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '160px',
            mt: 0.5,
          },
        }}
      >
        {menuTaskId && (() => {
          const task = activeTasks.find(t => t.id === menuTaskId);
          if (!task) return null;

          return (
            <>
              {task.status !== 'missed' && (
                <MenuItem
                  onClick={() => handleMenuReschedule(menuTaskId)}
                  disabled={saving}
                  sx={{
                    py: 1.5,
                    px: 2,
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                    '&:hover': {
                      backgroundColor: 'rgba(107, 163, 208, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <EventIcon sx={{ fontSize: '1.25rem', color: '#6BA3D0' }} />
                  </ListItemIcon>
                  <ListItemText primary="Reschedule" />
                </MenuItem>
              )}
              <MenuItem
                onClick={() => handleMenuCancel(menuTaskId)}
                disabled={saving}
                sx={{
                  py: 1.5,
                  px: 2,
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CancelIcon sx={{ fontSize: '1.25rem', color: '#f44336' }} />
                </ListItemIcon>
                <ListItemText primary="Cancel" />
              </MenuItem>
            </>
          );
        })()}
      </Menu>

      {/* Reschedule Modal */}
      <Modal
        open={openRescheduleModal}
        onClose={handleCloseRescheduleModal}
        aria-labelledby="reschedule-modal-title"
        aria-describedby="reschedule-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '500px', md: '600px' },
            maxWidth: '90vw',
            bgcolor: 'background.paper',
            borderRadius: { xs: '16px', sm: '18px', md: '20px' },
            boxShadow: 24,
            p: { xs: 3, sm: 4 },
            maxHeight: '90vh',
            overflow: 'auto',
          }}
        >
          {/* Modal Header with Title and Close Button */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography
              id="reschedule-modal-title"
              variant="h6"
              component="h2"
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                fontWeight: 700,
                color: '#333',
              }}
            >
              Reschedule Visit
            </Typography>
            <IconButton
              onClick={handleCloseRescheduleModal}
              sx={{
                color: '#666',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  color: '#333',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Actual Visit Date */}
          {currentTaskId && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  color: '#666',
                  mb: 1.5,
                  fontWeight: 500,
                }}
              >
                Actual Visit Date
              </Typography>
              <TextField
                fullWidth
                value={format(actualVisitDate, 'dd-MM-yyyy')}
                disabled
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: '8px', sm: '10px' },
                    fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    '& fieldset': {
                      borderColor: '#ddd',
                    },
                  },
                }}
              />
            </Box>
          )}

          {/* New Visit Date */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                color: '#666',
                mb: 1.5,
                fontWeight: 500,
              }}
            >
              New Visit Date :
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                value={newVisitDate}
                onChange={(newValue) => setNewVisitDate(newValue)}
                minDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    placeholder: 'Pilih tanggal baru untuk visit',
                    helperText: 'Tanggal harus >= hari ini',
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: { xs: '8px', sm: '10px' },
                        fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                        '& fieldset': {
                          borderColor: '#ddd',
                        },
                        '&:hover fieldset': {
                          borderColor: '#6BA3D0',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#6BA3D0',
                        },
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 1.5, sm: 2 },
              mt: 3,
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={handleCloseRescheduleModal}
              sx={{
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                fontWeight: 600,
                borderColor: '#6BA3D0',
                color: '#6BA3D0',
                borderRadius: { xs: '8px', sm: '10px' },
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#5a8fb8',
                  backgroundColor: 'rgba(107, 163, 208, 0.08)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleConfirmReschedule}
              disabled={saving}
              sx={{
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                fontWeight: 600,
                backgroundColor: '#6BA3D0',
                color: 'white',
                borderRadius: { xs: '8px', sm: '10px' },
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#5a8fb8',
                  color: 'white',
                },
                '&:disabled': {
                  backgroundColor: '#ccc',
                  color: '#666',
                },
              }}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Confirm'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
}
