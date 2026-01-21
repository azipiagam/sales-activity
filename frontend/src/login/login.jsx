import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { motion } from 'framer-motion';
import { getApiUrl } from '../config/api';
import backgroundHeaderSvg from '../media/backgroundLogin.svg';
// import backgroundBody from '../media/background.svg';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi field kosong
    if (!username.trim()) {
      setError('Username tidak boleh kosong');
      return;
    }

    if (!password.trim()) {
      setError('Password tidak boleh kosong');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(getApiUrl('login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Username atau password salah');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('sales', JSON.stringify(data.sales));

      // Pastikan user selalu diarahkan ke Home setelah login pertama kali
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Warna biru dari backgroundHeader.svg
  const blueGradient = `linear-gradient(135deg, #6ba3d0 0%, #72a8d4 20%, #79add7 40%, #7fb2db 60%, #86b7de 80%, #8dbce2 100%)`;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8FAFC',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header Section dengan Background SVG - Text Only */}
      <Box
        sx={{
          height: { xs: '22vh', sm: '20vh', md: '18vh' },
          minHeight: { xs: '160px', sm: '180px', md: '200px' },
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `url(${backgroundHeaderSvg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          px: { xs: 3, sm: 4 },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 60%)',
            pointerEvents: 'none',
          },
        }}
      >
        {/* App Name - Centered and Prominent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 100 }}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%' }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 800,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)',
              letterSpacing: { xs: '0.5px', sm: '1px', md: '1.5px' },
              mb: { xs: 1, sm: 1.5 },
              lineHeight: 1.2,
            }}
          >
            Sales Activity
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 400,
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              letterSpacing: { xs: '0.3px', sm: '0.5px' },
              lineHeight: 1.4,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Silakan login untuk melanjutkan aktivitas Anda
          </Typography>
        </motion.div>
      </Box>

      {/* White Card Section dengan Rounded Top */}
      <Box
        sx={{
          flex: 1,
          backgroundColor: 'white',
          borderTopLeftRadius: { xs: '44px', sm: '52px', md: '60px' },
          borderTopRightRadius: { xs: '44px', sm: '52px', md: '60px' },
          mt: { xs: '-25px', sm: '-30px', md: '-35px' },
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 -8px 32px rgba(107, 163, 208, 0.12), 0 -2px 8px rgba(0, 0, 0, 0.06)',
          px: { xs: 3, sm: 4, md: 5 },
          pt: { xs: 5, sm: 6, md: 7 },
          pb: { xs: 5, sm: 6 },
          background: 'linear-gradient(to bottom, #FFFFFF 0%, #FAFBFC 100%)',
          minHeight: { xs: 'calc(100vh - 160px)', sm: 'calc(100vh - 180px)', md: 'calc(100vh - 200px)' },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Typography
            variant="h4"
            align="center"
            sx={{
              fontWeight: 700,
              background: blueGradient,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.875rem', sm: '2.25rem', md: '2.5rem' },
              mb: 1,
              letterSpacing: '-0.5px',
            }}
          >
            Login
          </Typography>
          {/* <Typography
            variant="body2"
            align="center"
            sx={{
              color: '#64748B',
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              mb: 4,
            }}
          >
            Silakan login untuk melanjutkan aktivitas Anda
          </Typography> */}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  '& .MuiAlert-icon': {
                    color: 'error.main',
                  },
                }}
              >
                {error}
              </Alert>
            </motion.div>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                autoComplete="username"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: '#F8FAFC',
                    transition: 'all 0.3s ease',
                    '& input': {
                      color: '#1E293B',
                      fontWeight: 400,
                      fontSize: '0.9375rem',
                    },
                    '&:hover': {
                      backgroundColor: '#F1F5F9',
                      '& fieldset': {
                        borderColor: '#6ba3d0',
                        borderWidth: 2,
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 4px rgba(107, 163, 208, 0.1)',
                      '& fieldset': {
                        borderColor: '#6ba3d0',
                        borderWidth: 2.5,
                      },
                    },
                    '& fieldset': {
                      borderColor: '#E2E8F0',
                      borderWidth: 1.5,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#64748B',
                    '&.Mui-focused': {
                      color: '#6ba3d0',
                      fontWeight: 500,
                    },
                  },
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                        disabled={loading}
                        sx={{
                          color: '#64748B',
                          '&:hover': {
                            color: '#6ba3d0',
                            backgroundColor: 'rgba(107, 163, 208, 0.08)',
                          },
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: '#F8FAFC',
                    transition: 'all 0.3s ease',
                    '& input': {
                      color: '#1E293B',
                      fontWeight: 400,
                      fontSize: '0.9375rem',
                    },
                    '&:hover': {
                      backgroundColor: '#F1F5F9',
                      '& fieldset': {
                        borderColor: '#6ba3d0',
                        borderWidth: 2,
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 4px rgba(107, 163, 208, 0.1)',
                      '& fieldset': {
                        borderColor: '#6ba3d0',
                        borderWidth: 2.5,
                      },
                    },
                    '& fieldset': {
                      borderColor: '#E2E8F0',
                      borderWidth: 1.5,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#64748B',
                    '&.Mui-focused': {
                      color: '#6ba3d0',
                      fontWeight: 500,
                    },
                  },
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 4,
                  mb: 2,
                  py: { xs: 1.75, sm: 2 },
                  borderRadius: 3,
                  fontSize: { xs: '1rem', sm: '1.0625rem' },
                  fontWeight: 600,
                  textTransform: 'none',
                  background: blueGradient,
                  boxShadow: '0 8px 20px rgba(107, 163, 208, 0.35), 0 4px 8px rgba(107, 163, 208, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transition: 'left 0.5s',
                  },
                  '&:hover': {
                    boxShadow: '0 12px 28px rgba(107, 163, 208, 0.45), 0 6px 12px rgba(107, 163, 208, 0.25)',
                    transform: 'translateY(-2px) scale(1.01)',
                    '&::before': {
                      left: '100%',
                    },
                  },
                  '&:active': {
                    transform: 'translateY(0px) scale(0.98)',
                    boxShadow: '0 4px 12px rgba(107, 163, 208, 0.3), 0 2px 4px rgba(107, 163, 208, 0.15)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #94a3b8 0%, #9ca8bb 100%)',
                    boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
                    cursor: 'not-allowed',
                    transform: 'none',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={26} sx={{ color: 'white' }} />
                ) : (
                  'Masuk'
                )}
              </Button>
            </motion.div>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
}

