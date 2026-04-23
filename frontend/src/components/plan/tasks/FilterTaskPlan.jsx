import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { useActivityPlans } from '../../../contexts/ActivityPlanContext';

const TASK_TYPE_FILTER_OPTIONS = [
  {
    key: 'all',
    label: 'Semua',
    icon: AppsOutlinedIcon,
  },
  {
    key: 'visit',
    label: 'Visit',
    icon: LocationOnOutlinedIcon,
  },
  {
    key: 'follow_up',
    label: 'Follow Up',
    icon: ForumOutlinedIcon,
  },
  {
    key: 'prospek',
    label: 'Prospek',
    icon: PersonSearchIcon,
  },
];

const buttonToneMap = {
  all: {
    activeText: 'var(--theme-blue-overlay)',
    inactiveText: 'rgba(30, 41, 59, 0.72)',
  },
  visit: {
    activeText: 'var(--theme-blue-overlay)',
    inactiveText: 'rgba(30, 41, 59, 0.72)',
  },
  follow_up: {
    activeText: 'var(--theme-blue-overlay)',
    inactiveText: 'rgba(30, 41, 59, 0.72)',
  },
  prospek: {
    activeText: 'var(--theme-blue-overlay)',
    inactiveText: 'rgba(30, 41, 59, 0.72)',
  },
};

export default function FilterTaskPlan() {
  const { selectedTaskTypeFilter, setSelectedTaskTypeFilter } = useActivityPlans();

  return (
    <Box sx={{ mt: { xs: 1.5, sm: 2 }, width: '100%' }}>
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr) minmax(0, 0.78fr) minmax(0, 1.45fr) minmax(0, 1fr)',
            sm: 'minmax(0, 1fr) minmax(0, 0.82fr) minmax(0, 1.4fr) minmax(0, 1fr)',
          },
          alignItems: 'stretch',
          gap: { xs: 0.65, sm: 0.75 },
        }}
      >
        {TASK_TYPE_FILTER_OPTIONS.map((option) => {
          const isSelected = selectedTaskTypeFilter === option.key;
          const IconComponent = option.icon;
          const tone = buttonToneMap[option.key] || buttonToneMap.all;

          return (
            <Button
              key={option.key}
              onClick={() => setSelectedTaskTypeFilter(option.key)}
              variant="text"
              startIcon={IconComponent ? <IconComponent sx={{ fontSize: { xs: 8, sm: 9 } }} /> : null}
              sx={{
                justifyContent: 'center',
                textTransform: 'none',
                fontWeight: isSelected ? 700 : 600,
                fontSize: { xs: '0.7rem', sm: '0.78rem' },
                minHeight: { xs: 34, sm: 36 },
                borderRadius: { xs: '10px', sm: '12px' },
                px: { xs: 0.5, sm: 0.75 },
                width: '100%',
                whiteSpace: 'nowrap',
                border: isSelected
                  ? '1.5px solid var(--theme-blue-primary)'
                  : '1px solid rgba(203, 213, 225, 0.9)',
                color: isSelected ? tone.activeText : tone.inactiveText,
                backgroundColor: '#FFFFFF',
                boxShadow: isSelected ? '0 0 0 1px rgba(31, 78, 140, 0.18)' : 'none',
                '& .MuiButton-startIcon': {
                  mr: IconComponent ? 0.2 : 0,
                },
                '&:hover': {
                  backgroundColor: '#FFFFFF',
                  borderColor: isSelected
                    ? 'var(--theme-blue-primary)'
                    : 'rgba(148, 163, 184, 0.95)',
                },
              }}
            >
              {option.label}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}
