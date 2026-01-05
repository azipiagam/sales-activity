import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { id } from 'date-fns/locale';
import Home from './Home';
s
export default function Tes({

}) {
    return (
        <Box>
             sx={{
                position: 'fixed',
                backgroundcolor: 'primary.main',
                top: 100,
                left: 0,
                right: 0,
                zIndex: 1000,
                height: '100px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
             }}
             <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
                <DatePicker />
                <Popover
                    open={Boolean(calendarAnchorEl)}
                    anchorEl={calendarAnchorEl}
                    onClose={onCalendarClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Box sx={{ p: 5 }}>
                        <DatePicker
                            value={calender}
                            onChange={oncalenderchange}
                        />
                    </Box>
                </Popover>
             </LocalizationProvider> 
        </Box>
    );
    return (
        <Box>
            {/* This component appears to be unused/test code */}
        </Box>
    );
}