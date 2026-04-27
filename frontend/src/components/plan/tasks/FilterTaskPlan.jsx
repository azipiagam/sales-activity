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
    label: 'All',
    icon: AppsOutlinedIcon,
    gridWeight: 0.82,
    sizeVariant: 'compact',
  },
  {
    key: 'visit',
    label: 'Visit',
    icon: LocationOnOutlinedIcon,
    gridWeight: 1,
    sizeVariant: 'default',
  },
  {
    key: 'follow_up',
    label: 'Follow Up',
    icon: ForumOutlinedIcon,
    gridWeight: 1.55,
    sizeVariant: 'wide',
  },
  {
    key: 'prospek',
    label: 'Prospect',
    icon: PersonSearchIcon,
    gridWeight: 1.12,
    sizeVariant: 'prospect',
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

const buildGridTemplateColumns = () =>
  TASK_TYPE_FILTER_OPTIONS.map((option) => `minmax(0, ${option.gridWeight ?? 1}fr)`).join(' ');

const buttonStyleMap = {
  compact: {
    fontSize: { xs: '0.66rem', sm: '0.71rem' },
    minHeight: { xs: 30, sm: 32 },
    px: { xs: 0.3, sm: 0.45 },
    startIconGap: { xs: 0.2, sm: 0.24 },
  },
  default: {
    fontSize: { xs: '0.7rem', sm: '0.75rem' },
    minHeight: { xs: 31, sm: 33 },
    px: { xs: 0.45, sm: 0.65 },
    startIconGap: { xs: 0.24, sm: 0.28 },
  },
  wide: {
    fontSize: { xs: '0.78rem', sm: '0.84rem' },
    minHeight: { xs: 34, sm: 36 },
    px: { xs: 0.68, sm: 0.92 },
    startIconGap: { xs: 0.34, sm: 0.4 },
  },
  prospect: {
    fontSize: { xs: '0.7rem', sm: '0.75rem' },
    minHeight: { xs: 32, sm: 34 },
    px: { xs: 0.56, sm: 0.78 },
    startIconGap: { xs: 0.32, sm: 0.38 },
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
            xs: buildGridTemplateColumns(),
            sm: buildGridTemplateColumns(),
          },
          alignItems: 'stretch',
          gap: { xs: 0.65, sm: 0.75 },
        }}
      >
        {TASK_TYPE_FILTER_OPTIONS.map((option) => {
          const isSelected = selectedTaskTypeFilter === option.key;
          const IconComponent = option.icon;
          const tone = buttonToneMap[option.key] || buttonToneMap.all;
          const buttonStyle = buttonStyleMap[option.sizeVariant] || buttonStyleMap.default;

          return (
            <Button
              key={option.key}
              onClick={() => setSelectedTaskTypeFilter(option.key)}
              variant="text"
              startIcon={IconComponent ? <IconComponent /> : null}
              sx={{
                justifyContent: 'center',
                textTransform: 'none',
                fontWeight: isSelected ? 700 : 600,
                fontSize: buttonStyle.fontSize,
                minHeight: buttonStyle.minHeight,
                borderRadius: { xs: '10px', sm: '12px' },
                px: buttonStyle.px,
                width: '100%',
                minWidth: 0,
                whiteSpace: 'nowrap',
                border: isSelected
                  ? '1.5px solid var(--theme-blue-primary)'
                  : '1px solid rgba(203, 213, 225, 0.9)',
                color: isSelected ? tone.activeText : tone.inactiveText,
                backgroundColor: '#FFFFFF',
                boxShadow: isSelected ? '0 0 0 1px rgba(31, 78, 140, 0.18)' : 'none',
                lineHeight: 1,
                letterSpacing: '0.01em',
                '& .MuiButton-startIcon': {
                  mr: IconComponent ? buttonStyle.startIconGap : 0,
                },
                '& .MuiButton-startIcon .MuiSvgIcon-root': {
                  fontSize: 'inherit',
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
