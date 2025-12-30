import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import salesmanAnimation from '../media/salesman.json';
import { getApiUrl } from '../config/api';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        throw new Error(data.message || 'Login gagal');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('sales', JSON.stringify(data.sales));

      navigate('/');
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const patternSvg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="geometric-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="2" fill="rgba(255,255,255,0.08)"/>
          <rect x="15" y="5" width="8" height="8" fill="rgba(255,255,255,0.06)" rx="1"/>
          <path d="M 30 5 L 35 10 L 30 10 Z" fill="rgba(255,255,255,0.07)"/>
          <circle cx="25" cy="25" r="3" fill="rgba(255,255,255,0.05)"/>
          <rect x="5" y="20" width="6" height="6" fill="rgba(255,255,255,0.06)" rx="1"/>
          <path d="M 20 30 L 25 35 L 20 35 Z" fill="rgba(255,255,255,0.07)"/>
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#geometric-pattern)"/>
    </svg>
  `;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F5F7FA',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header Section dengan Pattern - ~30% dari layar */}
      <Box
        sx={{
          height: { xs: '35vh', sm: '32vh', md: '30vh' },
          minHeight: { xs: '280px', sm: '300px' },
          backgroundColor: 'primary.main',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(patternSvg)}")`,
            backgroundRepeat: 'repeat',
            opacity: 0.4,
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          },
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <Box
            sx={{
              width: { xs: 80, sm: 100 },
              height: { xs: 80, sm: 100 },
              backgroundColor: 'white',
              borderRadius: { xs: '18px', sm: '22px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: { xs: 70, sm: 90 },
                height: { xs: 70, sm: 90 },
              }}
            >
              <Lottie
                animationData={salesmanAnimation}
                loop={true}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* White Card Section dengan Rounded Top - ~70% dari layar */}
      <Box
        sx={{
          flex: 1,
          backgroundColor: 'white',
          borderTopLeftRadius: { xs: '40px', sm: '48px', md: '56px' },
          borderTopRightRadius: { xs: '40px', sm: '48px', md: '56px' },
          mt: { xs: '-30px', sm: '-40px' },
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
          px: { xs: 3, sm: 4, md: 5 },
          pt: { xs: 5, sm: 6, md: 7 },
          pb: { xs: 4, sm: 5 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Typography
            variant="h4"
            component="h1"
            align="center"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              fontSize: { xs: '1.75rem', sm: '2rem' },
              mb: 4,
            }}
          >
            Login
          </Typography>

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
                  borderRadius: 2,
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#F9FAFB',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
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
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                autoComplete="current-password"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#F9FAFB',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
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
                color="primary"
                sx={{
                  mt: 4,
                  mb: 2,
                  py: 1.75,
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(107, 163, 208, 0.4)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(107, 163, 208, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Login'
                )}
              </Button>
            </motion.div>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
}

