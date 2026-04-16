import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import MyLocationIcon from '@mui/icons-material/MyLocation';

const menuButtonSx = {
  justifyContent: 'flex-start',
  textTransform: 'none',
  textAlign: 'left',
  borderRadius: { xs: '12px', sm: '14px' },
  py: { xs: 1.5, sm: 1.75 },
  px: { xs: 1.75, sm: 2.25 },
  columnGap: 0,
  borderColor: 'rgba(31, 78, 140, 0.26)',
  color: '#1f4e8c',
  backgroundColor: '#fff',
  '& .MuiButton-startIcon': {
    marginRight: 2,
  },
  '& .MuiButton-endIcon': {
    marginLeft: 'auto',
  },
  '&:hover': {
    borderColor: 'var(--theme-blue-primary)',
    backgroundColor: 'rgba(31, 78, 140, 0.06)',
  },
};

const menuTextSx = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  minWidth: 0,
  flex: 1,
};

export default function NavigationPage({
  open,
  onClose,
  onSelectVisit,
  onSelectFollowUp,
  onSelectCheckIn,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      PaperProps={{
        sx: {
          borderTopLeftRadius: fullScreen ? 0 : '18px',
          borderTopRightRadius: fullScreen ? 0 : '18px',
          maxHeight: fullScreen ? '100%' : '75vh',
          width: '100%',
        },
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: fullScreen ? 'center' : 'flex-end',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            maxWidth: { xs: '100%', sm: '560px' },
            mx: 'auto',
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 2.25,
              pb: 1.75,
              borderBottom: '1px solid rgba(31, 78, 140, 0.15)',
              position: 'relative',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'var(--theme-blue-primary)',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                textAlign: 'center',
              }}
            >
              Select Activity Menu
            </Typography>
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 0,
                color: '#4a5568',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: 'grid', gap: 1.25 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={onSelectVisit}
              sx={menuButtonSx}
              startIcon={<AddLocationIcon />}
              endIcon={<ChevronRightIcon />}
            >
              <Box sx={menuTextSx}>
                <Typography sx={{ fontWeight: 700, color: '#1f4e8c', lineHeight: 1.2, textAlign: 'left' }}>
                  Plan
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#667085', lineHeight: 1.2, textAlign: 'left' }}>
                  Create Customer Visit Activity Plan
                </Typography>
              </Box>
            </Button>

            <Button
              variant="outlined"
              fullWidth
              onClick={onSelectFollowUp}
              sx={menuButtonSx}
              startIcon={<PlaylistAddCheckIcon />}
              endIcon={<ChevronRightIcon />}
            >
              <Box sx={menuTextSx}>
                <Typography sx={{ fontWeight: 700, color: '#1f4e8c', lineHeight: 1.2, textAlign: 'left' }}>
                  Follow Up
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#667085', lineHeight: 1.2, textAlign: 'left' }}>
                  Create Customer Follow up Activity Plan
                </Typography>
              </Box>
            </Button>

            <Button
              variant="outlined"
              fullWidth
              onClick={onSelectCheckIn}
              sx={menuButtonSx}
              startIcon={<MyLocationIcon />}
              endIcon={<ChevronRightIcon />}
            >
              <Box sx={menuTextSx}>
                <Typography sx={{ fontWeight: 700, color: '#1f4e8c', lineHeight: 1.2, textAlign: 'left' }}>
                  Check In
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#667085', lineHeight: 1.2, textAlign: 'left' }}>
                  Record Presence At Current Location
                </Typography>
              </Box>
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
