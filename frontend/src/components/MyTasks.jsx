import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
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

export default function MyTasks() {
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
          mb: 2,
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
          My Activity Plan
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
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {/* In Progress Card */}
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: { xs: '12px', sm: '14px', md: '16px' },
            padding: { xs: 2, sm: 2.5, md: 3 },
            minHeight: { xs: '100px', sm: '110px', md: '120px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
              fontWeight: 500,
              mb: 1,
            }}
          >
            Plan
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: '#6BA3D0',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            5
          </Typography>
        </Box>

        {/* Task Completed Card */}
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: { xs: '12px', sm: '14px', md: '16px' },
            padding: { xs: 2, sm: 2.5, md: 3 },
            minHeight: { xs: '100px', sm: '110px', md: '120px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
              fontWeight: 500,
              mb: 1,
            }}
          >
            Done
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: '#6BA3D0',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            35
          </Typography>
        </Box>

        {/* On Review Card */}
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: { xs: '12px', sm: '14px', md: '16px' },
            padding: { xs: 2, sm: 2.5, md: 3 },
            minHeight: { xs: '100px', sm: '110px', md: '120px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
              fontWeight: 500,
              mb: 1,
            }}
          >
            More To Go
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: '#6BA3D0',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            7
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

