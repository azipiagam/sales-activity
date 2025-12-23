import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

export default function CardPlan() {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: { xs: 2, sm: 3, md: 4 },
        mt: { xs: -7, sm: -8, md: -9 },
        mb: { xs: 3, sm: 4, md: 5 },
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: { xs: 1.5, sm: 2, md: 2.5 },
          width: '100%',
          maxWidth: { xs: '100%', sm: '500px', md: '550px' },
          justifyContent: 'center',
        }}
      >
        {/* Card Plan */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: { xs: '8px', sm: '10px', md: '12px' },
            padding: { xs: 1.5, sm: 2, md: 2.5 },
            minHeight: { xs: '70px', sm: '80px', md: '90px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(107, 163, 208, 0.2)',
            transition: 'border-bottom 0.2s ease',
            '&:hover': {
              borderBottom: '1px solid #6BA3D0',
            },
          }}
        >
          {/* Icon Background */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 10, sm: 12, md: 14 },
              right: { xs: 10, sm: 12, md: 14 },
              width: { xs: '28px', sm: '32px', md: '36px' },
              height: { xs: '28px', sm: '32px', md: '36px' },
              borderRadius: '50%',
              backgroundColor: 'rgba(107, 163, 208, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EventNoteIcon
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                color: '#6BA3D0',
              }}
            />
          </Box>
          
          <Typography
            variant="body1"
            component="div"
            sx={{
              fontWeight: 600,
              color: '#333',
              textAlign: 'left',
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              mb: { xs: 0.75, sm: 1, md: 1.25 },
              width: '100%',
              lineHeight: 1.2,
            }}
          >
            Plan
          </Typography>
          <Typography
            variant="body2"
            component="div"
            sx={{
              fontWeight: 700,
              color: '#6BA3D0',
              textAlign: 'left',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              width: '100%',
              lineHeight: 1,
            }}
          >
            5
          </Typography>
        </Box>

        {/* Card Done */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: { xs: '8px', sm: '10px', md: '12px' },
            padding: { xs: 1.5, sm: 2, md: 2.5 },
            minHeight: { xs: '70px', sm: '80px', md: '90px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(107, 163, 208, 0.2)',
            transition: 'border-bottom 0.2s ease',
            '&:hover': {
              borderBottom: '1px solid #5A9BC8',
            },
          }}
        >
          {/* Icon Background */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 10, sm: 12, md: 14 },
              right: { xs: 10, sm: 12, md: 14 },
              width: { xs: '28px', sm: '32px', md: '36px' },
              height: { xs: '28px', sm: '32px', md: '36px' },
              borderRadius: '50%',
              backgroundColor: 'rgba(107, 163, 208, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                color: '#5A9BC8',
              }}
            />
          </Box>
          
          <Typography
            variant="body1"
            component="div"
            sx={{
              fontWeight: 600,
              color: '#333',
              textAlign: 'left',
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              mb: { xs: 0.75, sm: 1, md: 1.25 },
              width: '100%',
              lineHeight: 1.2,
            }}
          >
            Done
          </Typography>
          <Typography
            variant="body2"
            component="div"
            sx={{
              fontWeight: 700,
              color: '#5A9BC8',
              textAlign: 'left',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              width: '100%',
              lineHeight: 1,
            }}
          >
            12
          </Typography>
        </Box>

        {/* Card More */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: { xs: '8px', sm: '10px', md: '12px' },
            padding: { xs: 1.5, sm: 2, md: 2.5 },
            minHeight: { xs: '70px', sm: '80px', md: '90px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(107, 163, 208, 0.2)',
            transition: 'border-bottom 0.2s ease',
            '&:hover': {
              borderBottom: '1px solid #4A8BC0',
            },
          }}
        >
          {/* Icon Background */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 10, sm: 12, md: 14 },
              right: { xs: 10, sm: 12, md: 14 },
              width: { xs: '28px', sm: '32px', md: '36px' },
              height: { xs: '28px', sm: '32px', md: '36px' },
              borderRadius: '50%',
              backgroundColor: 'rgba(107, 163, 208, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MoreHorizIcon
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                color: '#4A8BC0',
              }}
            />
          </Box>
          
          <Typography
            variant="body1"
            component="div"
            sx={{
              fontWeight: 600,
              color: '#333',
              textAlign: 'left',
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              mb: { xs: 0.75, sm: 1, md: 1.25 },
              width: '100%',
              lineHeight: 1.2,
            }}
          >
            More
          </Typography>
          <Typography
            variant="body2"
            component="div"
            sx={{
              fontWeight: 700,
              color: '#4A8BC0',
              textAlign: 'left',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              width: '100%',
              lineHeight: 1,
            }}
          >
            8
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

