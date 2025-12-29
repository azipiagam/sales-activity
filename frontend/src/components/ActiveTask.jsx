import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import CancelIcon from '@mui/icons-material/Cancel';
import Tooltip from '@mui/material/Tooltip';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CircularProgress from '@mui/material/CircularProgress';
import WarningIcon from '@mui/icons-material/Warning';
import Chip from '@mui/material/Chip';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { parse, format } from 'date-fns';
import { apiRequest } from '../config/api';
import { useActivityPlans } from '../contexts/ActivityPlanContext';

export default function ActiveTask({ selectedDate }) {
  const [openModal, setOpenModal] = useState(false);
  const [result, setResult] = useState('');
  const [openRescheduleModal, setOpenRescheduleModal] = useState(false);
  const [activeTasks, setActiveTasks] = useState([]);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [actualVisitDate, setActualVisitDate] = useState(new Date());
  const [newVisitDate, setNewVisitDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const { fetchPlansByDate, getPlansByDate, isLoading, getError, invalidateCache, updatePlanInCache, dataByDate } = useActivityPlans();
  
  const dateToUse = selectedDate || new Date();
  const dateStr = format(dateToUse, 'yyyy-MM-dd');
  const loading = isLoading(`date:${dateStr}`);
  const error = getError(`date:${dateStr}`);

  const fetchActiveTask = useCallback(async () => {
    try {
      // Try to get from cache first
      let data = getPlansByDate(dateToUse);
      
      // If not in cache, fetch it
      if (!data) {
        data = await fetchPlansByDate(dateToUse);
      }
      
      const activeTasksData = Array.isArray(data) 
        ? data.filter(task => {
            const normalizedStatus = (task.status || '').toLowerCase().trim();
            return normalizedStatus === 'in progress' || 
                   normalizedStatus === 'rescheduled' || 
                   normalizedStatus === 'done' || 
                   normalizedStatus === 'missed' || 
                   normalizedStatus === 'deleted';
          })
        : [];
      
      if (activeTasksData.length > 0) {
        // Process all active tasks
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const processedTasks = activeTasksData.map(taskData => {
          // Parse plan_date
          let visitDate = new Date();
          if (taskData.plan_date) {
            visitDate = parse(taskData.plan_date, 'yyyy-MM-dd', new Date());
            if (isNaN(visitDate.getTime())) {
              visitDate = new Date(taskData.plan_date);
            }
          }
          
          const taskDate = new Date(visitDate);
          taskDate.setHours(0, 0, 0, 0);
          
          let status = (taskData.status || 'in progress').toLowerCase().trim();
          if (status !== 'done' && status !== 'deleted' && taskDate < today) {
            status = 'missed';
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
        
        processedTasks.sort((a, b) => {
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
        
        setActiveTasks(processedTasks);
      } else {
        setActiveTasks([]);
      }
    } catch (err) {
      console.error('Error fetching active task:', err);
      setActiveTasks([]);
    }
  }, [selectedDate, dateToUse, fetchPlansByDate, getPlansByDate]);

  useEffect(() => {
    fetchActiveTask();
  }, [fetchActiveTask]);

  // Also update when data changes in context
  useEffect(() => {
    const data = getPlansByDate(dateToUse);
    if (data) {
      const activeTasksData = Array.isArray(data) 
        ? data.filter(task => {
            const normalizedStatus = (task.status || '').toLowerCase().trim();
            return normalizedStatus === 'in progress' || 
                   normalizedStatus === 'rescheduled' || 
                   normalizedStatus === 'done' || 
                   normalizedStatus === 'missed' || 
                   normalizedStatus === 'deleted';
          })
        : [];
      
      if (activeTasksData.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const processedTasks = activeTasksData.map(taskData => {
          let visitDate = new Date();
          if (taskData.plan_date) {
            visitDate = parse(taskData.plan_date, 'yyyy-MM-dd', new Date());
            if (isNaN(visitDate.getTime())) {
              visitDate = new Date(taskData.plan_date);
            }
          }
          
          const taskDate = new Date(visitDate);
          taskDate.setHours(0, 0, 0, 0);
          
          let status = (taskData.status || 'in progress').toLowerCase().trim();
          if (status !== 'done' && status !== 'deleted' && taskDate < today) {
            status = 'missed';
          }
          
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
        
        processedTasks.sort((a, b) => {
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
        
        setActiveTasks(processedTasks);
      } else {
        setActiveTasks([]);
      }
    }
  }, [getPlansByDate, dateToUse, dataByDate]); // Tambah dataByDate untuk trigger update

  useEffect(() => {
    const handlePlanCreated = () => {
      fetchActiveTask();
    };

    window.addEventListener('activityPlanCreated', handlePlanCreated);

    return () => {
      window.removeEventListener('activityPlanCreated', handlePlanCreated);
    };
  }, [fetchActiveTask]);

  const handleOpenModal = (taskId) => {
    setCurrentTaskId(taskId);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setResult('');
    setCurrentTaskId(null);
  };

  const handleSaveResult = async () => {
    if (!result.trim() || !currentTaskId) return;
    
    const activeTask = activeTasks.find(task => task.id === currentTaskId);
    if (!activeTask) return;
    
    try {
      setSaving(true);
      
      // Get GPS location (required field according to API)
      let latitude = null;
      let longitude = null;
      let accuracy = null;
      
      if (!navigator.geolocation) {
        throw new Error('GPS tidak tersedia di perangkat ini. Silakan gunakan perangkat yang mendukung GPS.');
      }
      
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        accuracy = position.coords.accuracy;
      } catch (geoError) {
        let errorMessage = 'Gagal mendapatkan lokasi GPS. ';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          errorMessage += 'Izin akses lokasi ditolak. Silakan berikan izin akses lokasi di pengaturan browser.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          errorMessage += 'Lokasi tidak tersedia.';
        } else if (geoError.code === geoError.TIMEOUT) {
          errorMessage += 'Waktu tunggu habis. Silakan coba lagi.';
        } else {
          errorMessage += 'Silakan coba lagi.';
        }
        throw new Error(errorMessage);
      }
      
      // Validate GPS coordinates
      if (latitude === null || longitude === null) {
        throw new Error('Koordinat GPS tidak valid. Silakan coba lagi.');
      }
      
      // OPTIMISTIC UPDATE: Langsung update UI sebelum API call
      const resultText = result.trim();
      updatePlanInCache(currentTaskId, {
        status: 'done',
        result: resultText,
        result_location_lat: latitude,
        result_location_lng: longitude,
        result_location_accuracy: accuracy,
        result_saved_at: new Date().toISOString(),
      });
      
      // Update local state juga untuk immediate feedback
      setActiveTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === currentTaskId 
            ? { ...task, status: 'done' }
            : task
        )
      );
      
      // Close modal immediately untuk UX yang lebih baik
      handleCloseModal();
      setResult('');
      
      // API call di background
      const response = await apiRequest(`activity-plans/${currentTaskId}/done`, {
        method: 'PUT',
        body: JSON.stringify({
          result: resultText,
          latitude,
          longitude,
          accuracy,
        }),
      });
      
      if (!response.ok) {
        // Jika API gagal, rollback optimistic update
        const errorData = await response.json().catch(() => ({}));
        invalidateCache(dateToUse);
        await fetchPlansByDate(dateToUse, true);
        throw new Error(errorData.message || 'Failed to save result');
      }
      
      // Refresh data untuk memastikan sync dengan backend (tapi tidak blocking UI)
      invalidateCache(dateToUse);
      fetchPlansByDate(dateToUse, true).catch(err => {
        console.error('Error refreshing after done:', err);
      });
    } catch (err) {
      console.error('Error saving result:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
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
    
    // Validate date >= today
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
      
      setActiveTasks(prevTasks => prevTasks.filter(task => task.id !== currentTaskId));
      
      handleCloseRescheduleModal();
      
      // Invalidate cache and refresh data after reschedule
      invalidateCache(dateToUse);
      await fetchPlansByDate(dateToUse, true);
      fetchActiveTask();
    } catch (err) {
      console.error('Error rescheduling:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
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
      
      // Remove the cancelled task from current list
      setActiveTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      // Invalidate cache and refresh data after delete
      invalidateCache(dateToUse);
      await fetchPlansByDate(dateToUse, true);
      fetchActiveTask();
    } catch (err) {
      console.error('Error canceling task:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Format date for display (without time)
  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const dateStr = format(date, 'dd-MM-yyyy');
    return dateStr;
  };

  // Show loading state
  if (loading) {
    return (
      <Container 
        maxWidth="md" 
        sx={{ 
          mt: 2,
          mb: 2,
          px: { xs: 2, sm: 3 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  // Show error state
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
          <Typography color="text.secondary">
            Tidak ada active task saat ini
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
          key={activeTask.id}
          sx={{
            backgroundColor: '#FFFFFF',
            borderRadius: { xs: '16px', sm: '18px', md: '20px' },
            padding: { xs: 2, sm: 2.5, md: 3 },
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            mb: index < activeTasks.length - 1 ? 2 : 0,
            opacity: activeTask.status === 'done' || activeTask.status === 'deleted' ? 0.7 : 1,
          }}
        >
          {/* Status Badge */}
          {activeTask.status === 'done' ? (
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 16, sm: 20 },
                right: { xs: 16, sm: 20 },
              }}
            >
              <Chip
                icon={<CheckCircleIcon />}
                label="Done"
                sx={{
                  backgroundColor: '#81c784',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  '& .MuiChip-icon': {
                    color: 'white',
                  },
                }}
              />
            </Box>
          ) : activeTask.status === 'deleted' ? (
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 16, sm: 20 },
                right: { xs: 16, sm: 20 },
              }}
            >
              <Chip
                icon={<CancelIcon />}
                label="Cancel"
                sx={{
                  backgroundColor: '#9e9e9e',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  '& .MuiChip-icon': {
                    color: 'white',
                  },
                }}
              />
            </Box>
          ) : activeTask.status === 'missed' ? (
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 16, sm: 20 },
                right: { xs: 16, sm: 20 },
              }}
            >
              <Chip
                icon={<WarningIcon />}
                label="Missed"
                sx={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  '& .MuiChip-icon': {
                    color: 'white',
                  },
                }}
              />
            </Box>
          ) : activeTask.status === 'rescheduled' ? (
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 16, sm: 20 },
                right: { xs: 16, sm: 20 },
              }}
            >
              <Chip
                icon={<EventIcon />}
                label="Rescheduled"
                sx={{
                  backgroundColor: '#ff9800',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  '& .MuiChip-icon': {
                    color: 'white',
                  },
                }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 16, sm: 20 },
                right: { xs: 16, sm: 20 },
              }}
            >
              <Chip
                icon={<PlayCircleIcon />}
                label="In Progress"
                sx={{
                  backgroundColor: '#6BA3D0',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  '& .MuiChip-icon': {
                    color: 'white',
                  },
                }}
              />
            </Box>
          )}

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
              <Tooltip title="Cancel" arrow>
                <IconButton
                  onClick={() => handleCancelTask(activeTask.id)}
                  disabled={saving}
                  sx={{
                    color: '#f44336',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.08)',
                      color: '#d32f2f',
                    },
                    '&:disabled': {
                      color: '#ccc',
                    },
                  }}
                >
                  <CancelIcon />
                </IconButton>
              </Tooltip>
              {/* Reschedule and Done buttons - only show if status is not "missed" */}
              {activeTask.status !== 'missed' && (
                <>
                  <Tooltip title="Reschedule" arrow>
                    <IconButton
                      onClick={() => handleOpenRescheduleModal(activeTask.id)}
                      disabled={saving}
                      sx={{
                        color: '#6BA3D0',
                        '&:hover': {
                          backgroundColor: 'rgba(107, 163, 208, 0.08)',
                          color: '#5a8fb8',
                        },
                        '&:disabled': {
                          color: '#ccc',
                        },
                      }}
                    >
                      <EventIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Done" arrow>
                    <IconButton
                      onClick={() => handleOpenModal(activeTask.id)}
                      disabled={saving}
                      sx={{
                        color: '#6BA3D0',
                        backgroundColor: 'rgba(107, 163, 208, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(107, 163, 208, 0.2)',
                          color: '#5a8fb8',
                        },
                        '&:disabled': {
                          backgroundColor: '#f5f5f5',
                          color: '#ccc',
                        },
                      }}
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          )}
        </Box>
      ))}

      {/* Result Modal */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="result-modal-title"
        aria-describedby="result-modal-description"
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
              id="result-modal-title"
              variant="h6"
              component="h2"
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                fontWeight: 700,
                color: '#333',
              }}
            >
              Result
            </Typography>
            <IconButton
              onClick={handleCloseModal}
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

          {/* Hasil dari aktivitas */}
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
              Hasil dari aktivitas :
            </Typography>
            <TextField
              multiline
              rows={6}
              fullWidth
              placeholder="Masukkan hasil aktivitas..."
              value={result}
              onChange={(e) => setResult(e.target.value)}
              sx={{
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
              }}
            />
          </Box>

          {/* Save Button */}
          <Button
            variant="contained"
            fullWidth
            onClick={handleSaveResult}
            disabled={!result.trim() || saving}
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
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Result'}
          </Button>
        </Box>
      </Modal>

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

