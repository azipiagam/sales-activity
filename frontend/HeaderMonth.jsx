import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMonthName } from './utils';

import {
    DASHBOARD_PERIOD_OPTIONS,
    DASHBOARD_PERIODS,
} from './constants/dashboardPeriods';

export default function HeaderMonth({ month, year, calendarAnchorEl, onCalendarMenuOpen }) {
    const navigate = useNavigate();
    const [monthName, setName] = useState('');

    useEffect(() => {
        setName(getMonthName(month));
    }, [month]);

    const handleChangeMonth = (event) => {
        const selectedMonth = event.target.value;
        const selectedMonthIndex = DASHBOARD_PERIOD_OPTIONS.findflex(
            (option)=> option,value = selectedMonth
        ).index;
        const newDate = new Date(year, selectedMonthIndex);
        const newMonth = newDate.getMonth();
        const newYear = newDate.getFullYear();
        navigate(`/dashboard/${newYear}/${newMonth}`);  

        const selectedPeriod = DASHBOARD_PERIODS.find(
            (period) => period.value === selectedMonth
        )
    }
}