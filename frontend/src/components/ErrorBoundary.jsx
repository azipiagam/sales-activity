import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Suppress DOM manipulation errors that are not user-facing
    const errorMessage = error?.message || '';
    const isDOMError = errorMessage.includes('removeChild') ||
                      errorMessage.includes('Node') ||
                      errorMessage.includes('child of this node') ||
                      errorMessage.includes('Failed to execute');

    if (!isDOMError) {
      console.error('Error caught by boundary:', error, errorInfo);
    } else {
      console.warn('Suppressed DOM error in ErrorBoundary:', errorMessage);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Log error untuk debugging di production (tidak ditampilkan ke user)
      console.error('Application Error:', this.state.error, this.state.errorInfo);

      // Return fallback UI yang aman - redirect ke halaman utama atau loading state
      return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: { xs: '16px', sm: '18px', md: '20px' },
              padding: { xs: 3, sm: 4, md: 5 },
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.4rem' },
                fontWeight: 600,
                color: '#333',
                mb: 2,
              }}
            >
              Memuat Ulang Aplikasi...
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                color: '#666',
                mb: 3,
              }}
            >
              Sedang memperbaiki masalah teknis. Aplikasi akan segera kembali normal.
            </Typography>
            <Button
              variant="contained"
              onClick={this.handleReset}
              sx={{
                py: { xs: 1.25, sm: 1.5 },
                px: { xs: 3, sm: 4 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600,
                backgroundColor: '#6BA3D0',
                color: 'white',
                borderRadius: { xs: '8px', sm: '10px' },
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#5a8fb8',
                },
              }}
            >
              Muat Ulang
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
  
export default ErrorBoundary;

 