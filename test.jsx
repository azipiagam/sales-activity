import react, { useState, useEffect, useRef } from 'react';
import { alpha } from '@mui/material/styles';
import box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import paper from '@mui/material/Paper';
import icon Button from '@mui/material/Button';
import chevronlefticon from '@mui/icons-material/ChevronLeft';
import chevronrighticon from '@mui/icons-material/ChevronRight';
import loadingManager from './loading/LoadingManager';
import useActivityPlans from '../contexts/ActivityPlanContext';
import { format } from 'date-fns';

export default function Test({ selectedDate: propselectedDate, onDateChange, onLoadingChange }) {
    const primaryColor = '#6BA3D0';
    const [selectedDate, setSelectedDate] = useState(propselectedDate || new Date());
    const [isloading, setloading] = useState(false);
    const userClickTimeRef = useRef(0);
    const { isLoading: checkDataLoading } = useActivityPlans();

    const getMondayOfWeek = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(d);
        const