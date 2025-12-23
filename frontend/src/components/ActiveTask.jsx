import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { parse, format } from 'date-fns';
import { apiRequest } from '../config/api';

export default function ActiveTask() {
  const [openModal, setOpenModal] = useState(false);
  const [result, setResult] = useState('');
  const [openRescheduleModal, setOpenRescheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [error, setError] = useState(null);
  const [actualVisitDate, setActualVisitDate] = useState(new Date());
  const [newVisitDate, setNewVisitDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  // Fetch active task data
  useEffect(() => {
    const fetchActiveTask = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiRequest('activity-plans');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Find first task with status "in progress" or "rescheduled"
        const activeTaskData = Array.isArray(data) 
          ? data.find(task => task.status === 'in progress' || task.status === 'rescheduled')
          : null;
        
        if (activeTaskData) {
          // Parse plan_date
          let visitDate = new Date();
          if (activeTaskData.plan_date) {
            visitDate = parse(activeTaskData.plan_date, 'yyyy-MM-dd', new Date());
            if (isNaN(visitDate.getTime())) {
              visitDate = new Date(activeTaskData.plan_date);
            }
          }
          
          // Format tujuan
          let formattedTujuan = 'Visit';
          if (activeTaskData.tujuan) {
            formattedTujuan = activeTaskData.tujuan.charAt(0).toUpperCase() + activeTaskData.tujuan.slice(1).toLowerCase();
            if (formattedTujuan.toLowerCase() === 'follow up') {
              formattedTujuan = 'Follow Up';
            }
          }
          
          setActiveTask({
            id: activeTaskData.id,
            namaCustomer: activeTaskData.customer_name || 'N/A',
            idPlan: activeTaskData.plan_no || 'N/A',
            tujuan: formattedTujuan,
            tambahan: activeTaskData.keterangan_tambahan || '',
            visitDate: visitDate,
          });
          
          setActualVisitDate(visitDate);
          setNewVisitDate(visitDate);
        } else {
          setActiveTask(null);
        }
      } catch (err) {
        console.error('Error fetching active task:', err);
        setError(err.message);
        setActiveTask(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveTask();
  }, []);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setResult('');
  };

  const handleSaveResult = async () => {
    if (!result.trim() || !activeTask) return;
    
    try {
      setSaving(true);
      
      // Get GPS location
      let latitude = 0;
      let longitude = 0;
      let accuracy = null;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          accuracy = position.coords.accuracy;
        } catch (geoError) {
          console.warn('GPS error:', geoError);
        }
      }
      
      const response = await apiRequest(`activity-plans/${activeTask.id}/done`, {
        method: 'PUT',
        body: JSON.stringify({
          result: result.trim(),
          latitude,
          longitude,
          accuracy,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save result');
      }
      
      // Refresh task list
      setActiveTask(null);
      handleCloseModal();
      setResult('');
      
      // Reload to get updated task list
      window.location.reload();
    } catch (err) {
      console.error('Error saving result:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenRescheduleModal = () => {
    setOpenRescheduleModal(true);
    setNewVisitDate(actualVisitDate);
  };

  const handleCloseRescheduleModal = () => {
    setOpenRescheduleModal(false);
    if (activeTask) {
      setNewVisitDate(activeTask.visitDate);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!activeTask || !newVisitDate) return;
    
    try {
      setSaving(true);
      
      const newDateStr = format(newVisitDate, 'yyyy-MM-dd');
      
      const response = await apiRequest(`activity-plans/${activeTask.id}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({
          new_date: newDateStr,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reschedule');
      }
      
      // Update local state
      setActualVisitDate(newVisitDate);
      if (activeTask) {
        setActiveTask({
          ...activeTask,
          visitDate: newVisitDate,
        });
      }
      
      handleCloseRescheduleModal();
      
      // Reload to get updated task list
      window.location.reload();
    } catch (err) {
      console.error('Error rescheduling:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Format date and time for display
  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const dateStr = format(date, 'dd-MM-yyyy');
    const timeStr = format(date, 'hh:mm a');
    return `${dateStr} ${timeStr}`;
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
            backgroundColor: 'white',
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
  if (!activeTask) {
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
            backgroundColor: 'white',
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
      <Box
        sx={{
          backgroundColor: 'white',
          borderRadius: { xs: '16px', sm: '18px', md: '20px' },
          padding: { xs: 2, sm: 2.5, md: 3 },
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          position: 'relative',
        }}
        >
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
            {formatDateTime(actualVisitDate)}
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

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 1.5, sm: 2 },
            mt: 3,
            pt: 2,
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Button
            variant="outlined"
            fullWidth
            onClick={handleOpenRescheduleModal}
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
            Reschedule
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleOpenModal}
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
            }}
          >
            Done
          </Button>
        </Box>
      </Box>

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
          {activeTask && (
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
                slotProps={{
                  textField: {
                    fullWidth: true,
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

