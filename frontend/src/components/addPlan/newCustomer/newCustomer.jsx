// React
import React, { useState, useCallback, useEffect } from 'react';

// Material-UI Components
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';

// Background import
import backgroundSvg from '../../../media/2.svg';
import bgh1Svg from '../../../media/bgh1.svg';

// Material-UI Icons
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// Custom imports
import { apiRequest } from '../../../config/api';
import { useActivityPlans } from '../../../contexts/ActivityPlanContext';

// Transition Component
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function NewCustomer({
  open,
  onClose,
  onCustomerCreated
}) {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state - Customer ID/Name is now manual input
  const [formData, setFormData] = useState({
    customerIdName: '', // Manual input for Customer ID/Name
    company_name: '',
    phone: '',
    email: '',
    address1: '',
    city: '',
    province: '',
  });

  // Default date is today
  const [date] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const { invalidateCache, fetchPlansByDate } = useActivityPlans();

  const handleInputChange = useCallback((field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  }, []);

  const validateForm = () => {
    if (!formData.customerIdName.trim()) {
      setError('Customer ID/Name is required');
      return false;
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      setError('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setError('');
    setLoading(true);

    try {
      // First, create the customer
      const customerRequestBody = {
        customer_name: formData.customerIdName.trim(),
        company_name: formData.company_name.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address1.trim() || null,
        city: formData.city.trim() || null,
        state: formData.province.trim() || null,
      };

      const customerResponse = await apiRequest('customers', {
        method: 'POST',
        body: JSON.stringify(customerRequestBody),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create customer');
      }

      const customerResult = await customerResponse.json();
      const newCustomer = customerResult.data || customerResult;

      // Then, create activity plan with default date (today) and purpose "visit"
      const planRequestBody = {
        customer_id: newCustomer.customer_id || newCustomer.id,
        customer_name: formData.customerIdName.trim(),
        plan_date: date,
        tujuan: 'Visit',
        keterangan_tambahan: '',
        customer_location_lat: null,
        customer_location_lng: null,
      };

      const planResponse = await apiRequest('activity-plans', {
        method: 'POST',
        body: JSON.stringify(planRequestBody),
      });

      if (!planResponse.ok) {
        const errorData = await planResponse.json().catch(() => ({}));
        console.error('Failed to create activity plan:', errorData);
        // Don't throw error here, customer was created successfully
      } else {
        // Invalidate cache and refresh data for the plan date
        try {
          const planDate = new Date(date);
          invalidateCache(planDate);
          await fetchPlansByDate(planDate, true);
        } catch (err) {
          console.error('Error refreshing cache:', err);
        }

        // Dispatch custom event to trigger refresh in other components
        window.dispatchEvent(new CustomEvent('activityPlanCreated', {
          detail: { planData: await planResponse.json() }
        }));
      }

      setSuccess(true);

      // Call callback with new customer data
      if (onCustomerCreated) {
        onCustomerCreated(newCustomer);
      }

      // Reset form after success
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (error) {
      console.error('Error creating customer:', error);
      setError(error.message || 'Failed to create customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customerIdName: '',
      company_name: '',
      phone: '',
      email: '',
      address1: '',
      city: '',
      province: '',
    });
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          backgroundImage: `url(${backgroundSvg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#ffffff', // fallback color
        },
      }}
    >
      {/* Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundImage: `url(${bgh1Svg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '0 0 24px 24px',
          boxShadow: `
            0 12px 40px rgba(107, 163, 208, 0.3),
            0 6px 20px rgba(107, 163, 208, 0.2),
            0 3px 12px rgba(0, 0, 0, 0.12),
            0 1px 4px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          `,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(1.5px)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(107, 163, 208, 0.15) 0%, rgba(74, 144, 226, 0.1) 50%, rgba(107, 163, 208, 0.15) 100%)',
          },
        }}
      >
        <Toolbar
          sx={{
            position: 'relative',
            zIndex: 2,
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: { xs: '76px', sm: '84px' },
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontSize: { xs: '1rem', sm: '1.15rem' },
              fontWeight: 700,
              color: 'white',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
              letterSpacing: '0.5px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12))',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -4,
                left: 0,
                width: '50px',
                height: '3px',
                background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3))',
                borderRadius: '2px',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            New Customer & Activity Plan
          </Typography>

          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 16,
              color: 'rgba(255, 255, 255, 0.9)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '8px',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: '1.25rem' }} />
          </IconButton>
        </Toolbar>
      </AppBar>
      {/* Content */}
      <Container
        maxWidth="md"
        sx={{
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3 },
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Form */}
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: { xs: 3, sm: 4 },
            border: '1px solid rgba(107, 163, 208, 0.1)',
            boxShadow: '0 12px 32px rgba(107, 163, 208, 0.18), 0 4px 16px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.08)',
            p: { xs: 2, sm: 2.5 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #6BA3D0, #4A90E2, #6BA3D0)',
              borderRadius: '12px 12px 0 0',
            },
          }}
        >
          {/* Success Message */}
          {success && (
            <Alert
              severity="success"
              sx={{
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  color: '#059669',
                },
                mb: 3,
              }}
            >
              Customer and activity plan created successfully!
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert
              severity="error"
              onClose={() => setError('')}
              sx={{
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  color: '#dc2626',
                },
                mb: 3,
              }}
            >
              {error}
            </Alert>
          )}

          {/* Date Info */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: '#374151',
                mb: 1,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&::before': {
                  content: '""',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: '#6BA3D0',
                },
              }}
            >
              Date (Default: Today)
            </Typography>
            <Box
              sx={{
                p: 2,
                backgroundColor: 'rgba(107, 163, 208, 0.08)',
                borderRadius: 2,
                border: '1px solid rgba(107, 163, 208, 0.2)',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: '#6BA3D0',
                  fontWeight: 600,
                }}
              >
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Box>
          </Box>

          {/* Customer ID/Name - Manual Input */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: '#374151',
                mb: 1,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&::before': {
                  content: '""',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: '#6BA3D0',
                },
              }}
            >
              Customer ID/Name
            </Typography>
            <TextField
              fullWidth
              label="Customer ID/Name *"
              value={formData.customerIdName}
              onChange={handleInputChange('customerIdName')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    '& fieldset': {
                      borderColor: '#6BA3D0',
                      borderWidth: '2px',
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: '#6BA3D0',
                      borderWidth: '2px',
                    },
                  },
                },
              }}
            />
          </Box>

          {/* Purpose Info */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: '#374151',
                mb: 1,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&::before': {
                  content: '""',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: '#6BA3D0',
                },
              }}
            >
              Purpose (Default: Visit)
            </Typography>
            <Box
              sx={{
                p: 2,
                backgroundColor: 'rgba(107, 163, 208, 0.08)',
                borderRadius: 2,
                border: '1px solid rgba(107, 163, 208, 0.2)',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: '#6BA3D0',
                  fontWeight: 600,
                }}
              >
                Visit
              </Typography>
            </Box>
          </Box>

          {/* Company Name */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: '#374151',
                mb: 1,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&::before': {
                  content: '""',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: '#6BA3D0',
                },
              }}
            >
              Company Name
            </Typography>
            <TextField
              fullWidth
              label="Company Name"
              value={formData.company_name}
              onChange={handleInputChange('company_name')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    '& fieldset': {
                      borderColor: '#6BA3D0',
                      borderWidth: '2px',
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: '#6BA3D0',
                      borderWidth: '2px',
                    },
                  },
                },
              }}
            />
          </Box>

          <Grid container spacing={3}>
            {/* Phone */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                  },
                }}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                  },
                }}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.address1}
                onChange={handleInputChange('address1')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                  },
                }}
              />
            </Grid>

            {/* City */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={handleInputChange('city')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                  },
                }}
              />
            </Grid>

            {/* Province */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Province/State"
                value={formData.province}
                onChange={handleInputChange('province')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mt: 3,
            pt: 3,
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Button
            variant="outlined"
            fullWidth
            onClick={handleClose}
            disabled={loading}
            sx={{
              py: 1.5,
              borderColor: '#10B981',
              color: '#10B981',
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#059669',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={loading || !formData.customerIdName.trim()}
            sx={{
              py: 1.5,
              backgroundColor: '#10B981',
              color: 'white',
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              '&:hover': {
                backgroundColor: '#059669',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
              },
              '&:disabled': {
                backgroundColor: '#10B981',
                opacity: 0.6,
                boxShadow: 'none',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
            ) : (
              <PersonAddIcon sx={{ mr: 1 }} />
            )}
            {loading ? 'Creating...' : 'Create Customer & Plan'}
          </Button>
        </Box>
      </Container>
    </Dialog>
  );
}
