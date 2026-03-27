import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockResetIcon from '@mui/icons-material/LockReset';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { motion } from 'framer-motion';
import { getSales, getToken, isAuthenticated } from '../utils/auth';
import { performLogout } from './logout';
import backgroundHeaderSvg from '../media/bgh1.svg';
import backgroundSvg from '../media/background.svg';
import { apiRequest } from '../config/api';


const getApiErrorMessage = (payload) => {
  if (payload?.message) {
    return payload.message;
  }

  if (payload?.errors && typeof payload.errors === 'object') {
    const firstError = Object.values(payload.errors).find((value) => Array.isArray(value) && value.length > 0);
    if (firstError) {
      return firstError[0];
    }
  }

  return 'Terjadi kesalahan saat mengubah profil';
};

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const sales = useMemo(() => getSales(), []);
  const authenticated = isAuthenticated();
  const initialUsername = authenticated ? sales?.username || '' : '';
  const [username, setUsername] = useState(initialUsername);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const blueGradient = 'linear-gradient(135deg, #6ba3d0 0%, #72a8d4 20%, #79add7 40%, #7fb2db 60%, #86b7de 80%, #8dbce2 100%)';

  const handleBack = () => {
    const fromPath = typeof location.state?.from === 'string' ? location.state.from : '';

    if (fromPath && fromPath !== location.pathname) {
      navigate(fromPath, { replace: true });
      return;
    }

    navigate(authenticated ? '/' : '/login', { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const trimmedUsername = username.trim();
    const normalizedInitialUsername = initialUsername.trim();
    const nextUsername = trimmedUsername !== normalizedInitialUsername ? trimmedUsername : '';
    const hasNewPassword = Boolean(newPassword.trim());
    const token = getToken();

    if (!trimmedUsername) {
      setError('Username tidak boleh kosong');
      return;
    }

    if (!authenticated || !token) {
      setError('Silakan login terlebih dahulu untuk mengubah username atau password');
      return;
    }

    if (!currentPassword.trim()) {
      setError('Password lama tidak boleh kosong');
      return;
    }

    if (!nextUsername && !hasNewPassword) {
      setError('Ubah username atau isi password baru terlebih dahulu');
      return;
    }

    if (hasNewPassword && newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }

    if (hasNewPassword && newPassword === currentPassword) {
      setError('Password baru harus berbeda dari password lama');
      return;
    }

    setLoading(true);

    try {
      const body = {
        current_password: currentPassword,
      };

      if (nextUsername) {
        body.new_username = nextUsername;
      }

      if (hasNewPassword) {
        body.new_password = newPassword;
      }

      const response = await apiRequest('auth/change-profile', {
          method: 'PUT',
          body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : { message: await response.text() };

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload));
      }

      if (nextUsername && !hasNewPassword) {
        const nextSales = sales ? { ...sales, username: nextUsername } : null;
        if (nextSales) {
          localStorage.setItem('sales', JSON.stringify(nextSales));
        }
      }

      setSuccess(hasNewPassword
        ? 'Profil berhasil diperbarui. Silakan login kembali dengan kredensial baru.'
        : 'Username berhasil diperbarui.'
      );

      setCurrentPassword('');
      setNewPassword('');

      window.setTimeout(() => {
        if (hasNewPassword) {
          performLogout({ navigate });
          return;
        }

        handleBack();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengubah profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 5 },
        backgroundImage: `url(${backgroundSvg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#F5F7FA',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.34)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          pointerEvents: 'none',
        }}
      />

      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        elevation={8}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          borderRadius: { xs: '24px', sm: '28px' },
          overflow: 'hidden',
          boxShadow: '0 18px 50px rgba(16, 24, 40, 0.18)',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            px: { xs: 2.5, sm: 3 },
            py: { xs: 2.5, sm: 3 },
            background: blueGradient,
            color: 'white',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${backgroundHeaderSvg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.35,
              pointerEvents: 'none',
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <IconButton
              onClick={handleBack}
              sx={{
                mb: 2,
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.12)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.18)',
                },
              }}
              aria-label="Kembali"
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <LockResetIcon sx={{ fontSize: 30 }} />
              <Typography sx={{ fontSize: { xs: '1.4rem', sm: '1.6rem' }, fontWeight: 700 }}>
                Ubah Profil
              </Typography>
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.88)', fontSize: { xs: '0.9rem', sm: '0.95rem' } }}>
              Anda bisa mengganti username, password, atau keduanya.
            </Typography>
          </Box>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: { xs: 2.5, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            backgroundColor: '#FFFFFF',
          }}
        >
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <TextField
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={loading}
            autoComplete="username"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#6BA3D0' }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Password Lama"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#6BA3D0' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    edge="end"
                    aria-label="toggle current password visibility"
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Password Baru"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            helperText="Kosongkan jika tidak ingin mengganti password. Minimal 6 karakter jika diisi."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockResetIcon sx={{ color: '#6BA3D0' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    edge="end"
                    aria-label="toggle new password visibility"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? null : <LockResetIcon />}
            sx={{
              mt: 1,
              py: 1.4,
              borderRadius: '14px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#FFFFFF',
              backgroundColor: '#6BA3D0',
              '&:hover': {
                backgroundColor: '#5a8fb8',
              },
              '&.Mui-disabled': {
                color: '#FFFFFF',
              },
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Simpan Perubahan'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
