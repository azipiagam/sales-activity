import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddPlan from './addPlan';
import CheckIn from './checkIn';
import { Fade } from '@mui/material';

export default function NavBottom({ value, onChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openAddPlan, setOpenAddPlan] = useState(false);
  const [openCheckIn, setOpenCheckIn] = useState(false);

  const handleFabClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddPlan = () => {
    setIsExpanded(false);
    setOpenAddPlan(true);
  };  

  const handleCheckIn = () => {
    setIsExpanded(false);
    setOpenCheckIn(true);
  };

  return (
    <>
      {/* No overlay - keep background normal */}

      <Box
        sx={{
          width: '100%',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: { xs: 'block', md: 'none' },
        }}
      >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BottomNavigation
          showLabels
          value={value === 0 ? 0 : 2}
          onChange={(event, newValue) => {
            if (onChange && newValue !== 1) { 
              onChange(newValue === 0 ? 0 : 1);
            }
          }}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            opacity: 0,
            animation: 'slideUp 0.6s ease-out 0.5s forwards',
            width: '100%',
            '& .MuiBottomNavigationAction-root': {
              color: 'rgba(0, 0, 0, 0.54)',
              minWidth: 'auto',
              padding: '6px 12px',
              '&.Mui-selected': {
                color: '#4e8ec2',
                backgroundColor: 'rgba(107, 163, 208, 0.1)',
                borderRadius: '12px',
              },
            },
          }}
        >
          <BottomNavigationAction 
            label="Dashboard" 
            icon={<DashboardIcon />}
            sx={{
              '&.Mui-selected': {
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.75rem',
                },
              },
            }}
          />
          <BottomNavigationAction 
            label="" 
            icon={<Box />}
            disabled
            sx={{ minWidth: '60px', maxWidth: '60px' }}
          />
          <BottomNavigationAction 
            label="Plan" 
            icon={<LocationOnIcon />} 
            sx={{
              '&.Mui-selected': {
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.75rem',
                },
              },
            }}
          />
        </BottomNavigation>
        
        {/* Expandable FAB with Popup */}
        <Fade in={isExpanded} timeout={150}>
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 88, sm: 92 }, // Position above the FAB
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            {/* Check In Menu Item */}
            <Box
              onClick={handleCheckIn}
              tabIndex={0}
              role="button"
              aria-label="Check In"
              sx={{
                // background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                backgroundColor: '#6BA3D0',
                borderRadius: '50%',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8)',
                border: '2px solid',
                borderColor: 'rgba(76, 175, 202, 0.3)',
                width: { xs: 60, sm: 64 },
                height: { xs: 60, sm: 64 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                animation: isExpanded ? 'slideInUp 0.3s ease-out 0.05s both' : 'none',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 0,
                  height: 0,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(76, 175, 202, 0.3)',
                  transform: 'translate(-50%, -50%)',
                  transition: 'width 0.6s, height 0.6s',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(76, 175, 202, 0.1) 0%, rgba(107, 163, 208, 0.15) 100%)',
                  transform: 'scale(1.08) translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(76, 175, 202, 0.2), 0 0 0 2px rgba(76, 175, 202, 0.5)',
                  '&::before': {
                    width: '120%',
                    height: '120%',
                  },
                },
                '&:active': {
                  // No scale effect on click
                },
                '&:focus': {
                  outline: 'none',
                  boxShadow: '0 0 0 3px rgba(76, 175, 202, 0.4)',
                },
                '@keyframes slideInUp': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(20px) scale(0.8)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0) scale(1)',
                  },
                },
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: { xs: '1.75rem', sm: '2rem' },
                  color: 'white',
                  transition: 'color 0.3s ease',
                  position: 'relative',
                  zIndex: 1,
                }}
              />
            </Box>

            {/* Add Plan Menu Item */}
            <Box
              onClick={handleAddPlan}
              tabIndex={0}
              role="button"
              aria-label="Add Plan"
              sx={{
                // background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                backgroundColor: '#6BA3D0',
                borderRadius: '50%',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8)',
                border: '2px solid',
                borderColor: 'rgba(76, 175, 202, 0.3)',
                width: { xs: 60, sm: 64 },
                height: { xs: 60, sm: 64 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                animation: isExpanded ? 'slideInUp 0.3s ease-out 0.1s both' : 'none',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 0,
                  height: 0,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(76, 175, 202, 0.3)',
                  transform: 'translate(-50%, -50%)',
                  transition: 'width 0.6s, height 0.6s',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(76, 175, 202, 0.1) 0%, rgba(107, 163, 208, 0.15) 100%)',
                  transform: 'scale(1.08) translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(76, 175, 202, 0.2), 0 0 0 2px rgba(76, 175, 202, 0.5)',
                  '&::before': {
                    width: '120%',
                    height: '120%',
                  },
                },
                '&:active': {
                  // No scale effect on click
                },
                '&:focus': {
                  outline: 'none',
                  boxShadow: '0 0 0 3px rgba(76, 175, 202, 0.4)',
                },
              }}
            >
              <AddLocationIcon
                sx={{
                  fontSize: { xs: '1.75rem', sm: '2rem' },
                  color: 'white',
                  transition: 'color 0.3s ease',
                  position: 'relative',
                  zIndex: 1,
                }}
              />
            </Box>
          </Box>
        </Fade>

        {/* Main FAB Button */}
        <Fab
          color="primary"
          aria-label="expand actions"
          sx={{
            position: 'absolute',
            bottom: 20,
            left: { xs: 'calc(50% - 28px)', sm: 'calc(50% - 30px)' },
            backgroundColor: '#4e8ec2',
            color: 'white',
            width: { xs: 56, sm: 60 },
            height: { xs: 56, sm: 60 },
            opacity: 0,
            animation: 'slideUp 0.6s ease-out 0.7s forwards',
            transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: '#5a8fb8',
              color: 'white',
            },
            boxShadow: '0 4px 12px rgba(107, 163, 208, 0.4)',
            zIndex: 1002,
          }}
          onClick={handleFabClick}
        >
          {isExpanded ? (
            <CloseIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, color: 'white' }} />
          ) : (
            <AddIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, color: 'white' }} />
          )}
        </Fab>
      </Box>

      {/* Add Plan Bottom Sheet */}
      <AddPlan open={openAddPlan} onClose={() => setOpenAddPlan(false)} />

      {/* Check In Bottom Sheet */}
      <CheckIn open={openCheckIn} onClose={() => setOpenCheckIn(false)} />
    </Box>
    </>
  );
}

