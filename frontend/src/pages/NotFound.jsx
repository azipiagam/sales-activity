import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { Dashboard, ArrowBack } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, sm: 4 },
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '4rem', sm: '6rem' },
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 2,
            }}
          >
            404
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Halaman Tidak Ditemukan
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Halaman yang Anda cari tidak ada atau telah dipindahkan.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
            >
              Kembali
            </Button>
            <Button
              variant="outlined"
              startIcon={<Dashboard />}
              onClick={() => navigate('/', { replace: true })}
            >
              Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default NotFound;

