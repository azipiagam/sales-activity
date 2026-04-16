import React, { useState } from 'react';
import NavigationPage from './NavigationPage';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useActivityPlans } from '../../contexts/ActivityPlanContext';
import { progressPercentage } from 'framer-motion';

export default function Template() {
    const [selectedDate, setSelectedDate] = useState(null);
    
    return (
        <div>
            <NavigationPage />
        </div>
    );
}
