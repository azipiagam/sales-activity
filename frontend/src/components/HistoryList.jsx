import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { keyframes } from '@mui/system';

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
  // Dummy history data
  const historyData = [
    {
      id: 1,
      title: 'GOLDEN INDO TEKNIK',
      date: '18-12-2025',
      time: '06:00 PM',
      planNo: 'P0021',
      tujuan: 'Visit',
      tambahan: 'Berikan Promosi terbaru webbing sling',
      status: 'done',
    },
    {
      id: 2,
      title: 'PT MAKMUR SEJAHTERA',
      date: '17-12-2025',
      time: '02:30 PM',
      planNo: 'P0020',
      tujuan: 'Follow Up',
      tambahan: 'Diskusi kontrak baru untuk Q1 2026',
      status: 'done',
    },
    {
      id: 3,
      title: 'CV BERKAH ABADI',
      date: '16-12-2025',
      time: '10:00 AM',
      planNo: 'P0019',
      tujuan: 'Visit',
      tambahan: 'Presentasi produk chain block terbaru',
      status: 'done',
    },
    {
      id: 4,
      title: 'PT SINAR JAYA',
      date: '15-12-2025',
      time: '03:45 PM',
      planNo: 'P0018',
      tujuan: 'Meeting',
      tambahan: 'Review order bulanan dan diskon khusus',
      status: 'done',
    },
    {
      id: 5,
      title: 'UD MAJU BERSAMA',
      date: '14-12-2025',
      time: '11:15 AM',
      planNo: 'P0017',
      tujuan: 'Visit',
      tambahan: 'Survey kebutuhan produk rigging',
      status: 'done',
    },
  ];

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
    </Container>
  );
}

