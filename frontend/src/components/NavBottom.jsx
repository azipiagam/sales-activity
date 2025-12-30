import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import RestoreIcon from '@mui/icons-material/Restore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import AddPlan from './addPlan';

export default function NavBottom({ value, onChange }) {
  const [openAddPlan, setOpenAddPlan] = useState(false);

  return (
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
              // Map: 0 (Plan) -> 0, 2 (History) -> 1
              onChange(newValue > 1 ? 1 : newValue);
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
          <BottomNavigationAction 
            label="" 
            icon={<Box />}
            disabled
            sx={{ minWidth: '60px', maxWidth: '60px' }}
          />
          <BottomNavigationAction 
            label="History" 
            icon={<RestoreIcon />}
            sx={{
              '&.Mui-selected': {
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.75rem',
                },
              },
            }}
          />
        </BottomNavigation>
        
        {/* Add Button in Center */}
        <Fab
          color="primary"
          aria-label="add"
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
            '&:hover': {
              backgroundColor: '#5a8fb8',
              color: 'white',
            },
            boxShadow: '0 4px 12px rgba(107, 163, 208, 0.4)',
          }}
          onClick={() => setOpenAddPlan(true)}
        >
          <AddIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, color: 'white' }} />
        </Fab>
      </Box>
      
      {/* Add Plan Bottom Sheet */}
      <AddPlan open={openAddPlan} onClose={() => setOpenAddPlan(false)} />
    </Box>
  );
}

