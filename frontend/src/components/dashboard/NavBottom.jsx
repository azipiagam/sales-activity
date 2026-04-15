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
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { AddAddress, AddPlan, CheckIn } from '../plan/add';

export default function NavBottom({ value, onChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openAddPlan, setOpenAddPlan] = useState(false);
  const [openAddAddress, setOpenAddAddress] = useState(false);
  const [openCheckIn, setOpenCheckIn] = useState(false);
  const [addressSelection, setAddressSelection] = useState(null);

  const themeBlueDark = 'var(--theme-blue-overlay)';
  const themeBlue = 'var(--theme-blue-primary)';
  const themeBlueDarkRgb = '22, 58, 107';
  const themeBlueRgb = '31, 78, 140';
  const themeBlueLight = `rgba(${themeBlueRgb}, 0.92)`;
  const themeGold = '#E9C46A';
  const themeWhite = '#FFFFFF';

  const handleFabClick = () => {
    setIsExpanded(false);
    setAddressSelection(null);
    setOpenAddPlan(true);
  };

  const handleAddPlan = () => {
    setIsExpanded(false);
    setAddressSelection(null);
    setOpenAddPlan(true);
  };

  const handleCheckIn = () => {
    setIsExpanded(false);
    setOpenCheckIn(true);
  };

  const handleCloseAddPlan = () => {
    setOpenAddPlan(false);
    setAddressSelection(null);
  };

  const handleOpenAddAddress = (payload) => {
    setAddressSelection({
      customerId: payload?.customerId || '',
      addressId: payload?.addressId || 'master',
      address: payload?.address || '',
      originalAddress: payload?.originalAddress || '',
      latitude: Number.isFinite(payload?.latitude) ? payload.latitude : null,
      longitude: Number.isFinite(payload?.longitude) ? payload.longitude : null,
    });
    setOpenAddPlan(false);
    setOpenAddAddress(true);
  };

  const handleBackToAddPlanFromAddress = () => {
    setOpenAddAddress(false);
    setOpenAddPlan(true);
  };

  const handleApplyAddress = (payload) => {
    setAddressSelection({
      customerId: payload?.customerId || addressSelection?.customerId || '',
      addressId: payload?.addressId || 'master',
      address: payload?.address || '',
      originalAddress: payload?.originalAddress || addressSelection?.originalAddress || '',
      latitude: Number.isFinite(payload?.latitude) ? payload.latitude : null,
      longitude: Number.isFinite(payload?.longitude) ? payload.longitude : null,
    });
    setOpenAddAddress(false);
    setOpenAddPlan(true);
  };

  const handleOverlayClick = () => {
    setIsExpanded(false);
  };

  return (
    <>
      {/* Overlay when expanded */}
      {isExpanded && (
        <Box
          onClick={handleOverlayClick}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 999,
          }}
        />
      )}

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
              borderColor: 'rgba(255, 255, 255, 0.24)',
              background: `linear-gradient(135deg, ${themeBlueDark} 0%, ${themeBlue} 62%, ${themeBlueLight} 100%)`,
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              boxShadow: `0 -10px 24px rgba(${themeBlueDarkRgb}, 0.35)`,
              width: '100%',
              '& .MuiBottomNavigationAction-root': {
                color: 'rgba(255, 255, 255, 0.9)',
                minWidth: 'auto',
                padding: '6px 12px',
                '& .MuiBottomNavigationAction-label': {
                  color: 'inherit',
                  fontWeight: 600,
                },
                '& .MuiSvgIcon-root': {
                  color: 'inherit',
                },
                '&.Mui-selected': {
                  color: themeGold,
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
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
          {isExpanded && (
            <Box
              sx={{
                position: 'absolute',
                bottom: { xs: 88, sm: 92 },
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
                  background: `linear-gradient(135deg, ${themeBlueDark} 0%, ${themeBlue} 100%)`,
                  borderRadius: '50%',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8)',
                  border: '2px solid',
                  borderColor: 'rgba(233, 196, 106, 0.55)',
                  width: { xs: 60, sm: 64 },
                  height: { xs: 60, sm: 64 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 0,
                    height: 0,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(31, 78, 140, 0.3)',
                    transform: 'translate(-50%, -50%)',
                  },
                  '&:hover': {
                    background: `linear-gradient(135deg, ${themeBlue} 0%, ${themeBlueLight} 100%)`,
                    boxShadow: `0 6px 16px rgba(${themeBlueDarkRgb}, 0.3), 0 0 0 2px rgba(233, 196, 106, 0.65)`,
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
                    boxShadow: '0 0 0 3px rgba(233, 196, 106, 0.4)',
                  },
                }}
              >
                <MyLocationIcon
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2rem' },
                    color: 'white',
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
                  background: `linear-gradient(135deg, ${themeBlueDark} 0%, ${themeBlue} 100%)`,
                  borderRadius: '50%',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8)',
                  border: '2px solid',
                  borderColor: 'rgba(233, 196, 106, 0.55)',
                  width: { xs: 60, sm: 64 },
                  height: { xs: 60, sm: 64 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 0,
                    height: 0,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(31, 78, 140, 0.3)',
                    transform: 'translate(-50%, -50%)',
                  },
                  '&:hover': {
                    background: `linear-gradient(135deg, ${themeBlue} 0%, ${themeBlueLight} 100%)`,
                    boxShadow: `0 6px 16px rgba(${themeBlueDarkRgb}, 0.3), 0 0 0 2px rgba(233, 196, 106, 0.65)`,
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
                    boxShadow: '0 0 0 3px rgba(233, 196, 106, 0.4)',
                  },
                }}
              >
                <AddLocationIcon
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2rem' },
                    color: 'white',
                    position: 'relative',
                    zIndex: 1,
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Main FAB Button */}
          <Fab
            color="primary"
            aria-label="expand actions"
            sx={{
              position: 'absolute',
              bottom: 20,
              left: { xs: 'calc(50% - 28px)', sm: 'calc(50% - 30px)' },
              background: `linear-gradient(135deg, ${themeBlueDark} 0%, ${themeBlue} 100%)`,
              color: themeWhite,
              border: '2px solid',
              borderColor: 'rgba(233, 196, 106, 0.6)',
              width: { xs: 56, sm: 60 },
              height: { xs: 56, sm: 60 },
              transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
              '&:hover': {
                background: `linear-gradient(135deg, ${themeBlue} 0%, ${themeBlueLight} 100%)`,
                color: themeGold,
              },
              boxShadow: `0 4px 12px rgba(${themeBlueDarkRgb}, 0.35)`,
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

        {/* Add Plan Dialog */}
        <AddPlan
          open={openAddPlan}
          onClose={handleCloseAddPlan}
          onOpenCheckIn={() => setOpenCheckIn(true)}
          onOpenAddAddress={handleOpenAddAddress}
          addressSelection={addressSelection}
        />

        {/* Add Address Dialog */}
        <AddAddress
          open={openAddAddress}
          onClose={handleBackToAddPlanFromAddress}
          onBackToAddPlan={handleBackToAddPlanFromAddress}
          onApplyAddress={handleApplyAddress}
          customerId={addressSelection?.customerId || ''}
          initialAddressId={addressSelection?.addressId || 'master'}
          initialAddress={addressSelection?.address || ''}
          initialOriginalAddress={addressSelection?.originalAddress || ''}
          initialLatitude={addressSelection?.latitude ?? null}
          initialLongitude={addressSelection?.longitude ?? null}
        />

        {/* Check In Dialog */}
        <CheckIn
          open={openCheckIn}
          onClose={() => setOpenCheckIn(false)}
          onOpenAddPlan={() => {
            setAddressSelection(null);
            setOpenAddPlan(true);
          }}
        />
      </Box>
    </>
  );
}
