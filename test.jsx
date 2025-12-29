import React, { useState } from 'react';
import typography from '@mui/material/Typography';
import autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import renderOption from '@mui/material/Autocomplete';

export default function Test() {
    return (
        <Box>
            <Typography variant="h1">Test</Typography>
            <Autocomplete
                options={[]}
                renderInput={(params) => <TextField {...params} label="Test" />}
            />
        </Box>



    
    );
}
