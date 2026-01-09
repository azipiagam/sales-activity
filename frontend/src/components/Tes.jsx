import React from 'react';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import chevronlefticon from '@mui/icons-material/ChevronLeft';
import chevronrighticon from '@mui/icons-material/ChevronRight';
import LoadingManager from './loading/LoadingManager';
import { useActivityPlans } from '../contexts/ActivityPlanContext';
import { format } from 'date-fns';

export default Tes({ selectedDate: propselectedDate, onDateChange, onLoadingChange }) {
    const primaryColor = '#6BA3D0'; 
    consot [selectedDate, setSelectedDate] = useState(propselectedDate || new Date());
    const [isloading, setloading] = useState(false);
    const userClickTimeRef = useRef(0);
    const { isLoading: checkDataLoading } = useActivityPlans();

    const getMondayOfWeek = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(d);
        monday.setDate(d.getDate() + diff);
        return monday;
    };

const currentWeekMonday = getMondayOfWeek(propselectedDate || new Date());