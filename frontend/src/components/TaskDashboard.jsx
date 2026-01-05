import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PieChart } from '@mui/x-charts/PieChart';

export default function TaskDashboard({ selectedDate }) {
  const [bulananFilter, setBulananFilter] = useState('Bulanan');
  const [provinsiFilter, setProvinsiFilter] = useState('Provinsi');
  const [bulananAnchorEl, setBulananAnchorEl] = useState(null);
  const [provinsiAnchorEl, setProvinsiAnchorEl] = useState(null);

  // Sample data - in real app, this would come from props or context
  const taskData = {
    plan: 5,
    missed: 5,
    done: 4,
  };

  const total = taskData.plan + taskData.missed + taskData.done;

  const bulananOptions = ['Hari Ini', 'Mingguan', 'Bulanan'];
  const provinsiOptions = ['Semua Provinsi', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'DKI Jakarta'];

  const handleBulananClick = (event) => {
    setBulananAnchorEl(event.currentTarget);
  };

  const handleBulananClose = () => {
    setBulananAnchorEl(null);
  };

  const handleBulananChange = (value) => {
    setBulananFilter(value);
    handleBulananClose();
  };

  const handleProvinsiClick = (event) => {
    setProvinsiAnchorEl(event.currentTarget);
  };

  const handleProvinsiClose = () => {
    setProvinsiAnchorEl(null);
  };

  const handleProvinsiChange = (value) => {
    setProvinsiFilter(value);
    handleProvinsiClose();
  };

  // Prepare chart data
  const chartData = [
    { id: 1, value: taskData.plan, label: 'Plan', color: '#6BA3D0' }, // Soft blue
    { id: 2, value: taskData.missed, label: 'Missed', color: '#F87171' }, // Soft red
    { id: 3, value: taskData.done, label: 'Done', color: '#34D399' }, // Soft green
  ].filter(item => item.value > 0);

  return (
    <Card
      elevation={0}
      sx={{
        background: '#FFFFFF',
        borderRadius: { xs: '16px', sm: '20px' },
        padding: { xs: '20px', sm: '24px' },
        boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)',
        border: 'none',
        mb: 3,
        mt: -1,
      }}
    >
      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 1.5, sm: 2 },
          mb: 3,
          justifyContent: 'center',
        }}
      >
        {/* Bulanan Filter */}
        <Button
          onClick={handleBulananClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: { xs: '8px 14px', sm: '10px 16px' },
            textTransform: 'none',
            color: '#374151',
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            fontWeight: 500,
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            minWidth: { xs: '100px', sm: '120px' },
            '&:hover': {
              backgroundColor: '#F9FAFB',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
            },
          }}
        >
          <CalendarTodayIcon
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem' },
              color: '#6BA3D0',
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              fontWeight: 500,
              color: '#374151',
              flex: 1,
              textAlign: 'left',
            }}
          >
            {bulananFilter}
          </Typography>
          <ExpandMoreIcon
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem' },
              color: '#6B7280',
              transition: 'transform 0.2s ease-in-out',
              transform: bulananAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Button>

        <Menu
          anchorEl={bulananAnchorEl}
          open={Boolean(bulananAnchorEl)}
          onClose={handleBulananClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: '12px',
              boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              minWidth: 160,
            },
          }}
        >
          {bulananOptions.map((option) => (
            <MenuItem
              key={option}
              onClick={() => handleBulananChange(option)}
              selected={option === bulananFilter}
              sx={{
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                padding: { xs: '10px 16px', sm: '12px 20px' },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(107, 163, 208, 0.1)',
                },
              }}
            >
              {option}
            </MenuItem>
          ))}
        </Menu>

        {/* Provinsi Filter */}
        <Button
          onClick={handleProvinsiClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: { xs: '8px 14px', sm: '10px 16px' },
            textTransform: 'none',
            color: '#374151',
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            fontWeight: 500,
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            minWidth: { xs: '100px', sm: '120px' },
            '&:hover': {
              backgroundColor: '#F9FAFB',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
            },
          }}
        >
          <LocationOnIcon
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem' },
              color: '#6BA3D0',
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              fontWeight: 500,
              color: '#374151',
              flex: 1,
              textAlign: 'left',
            }}
          >
            {provinsiFilter}
          </Typography>
          <ExpandMoreIcon
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem' },
              color: '#6B7280',
              transition: 'transform 0.2s ease-in-out',
              transform: provinsiAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Button>

        <Menu
          anchorEl={provinsiAnchorEl}
          open={Boolean(provinsiAnchorEl)}
          onClose={handleProvinsiClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: '12px',
              boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              minWidth: 180,
            },
          }}
        >
          {provinsiOptions.map((option) => (
            <MenuItem
              key={option}
              onClick={() => handleProvinsiChange(option)}
              selected={option === provinsiFilter}
              sx={{
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                padding: { xs: '10px 16px', sm: '12px 20px' },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(107, 163, 208, 0.1)',
                },
              }}
            >
              {option}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Donut Chart */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          mb: 3,
        }}
      >
        {total > 0 && chartData.length > 0 ? (
          <Box sx={{ position: 'relative' }}>
            <PieChart
              series={[
                {
                  data: chartData.map(item => ({
                    id: item.id,
                    value: item.value,
                  })),
                  innerRadius: 75,
                  outerRadius: 105,
                  paddingAngle: 3,
                  cornerRadius: 10,
                  cx: 120,
                  cy: 120,
                },
              ]}
              width={240}
              height={240}
              slotProps={{
                legend: { hidden: true },
              }}
              margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
              colors={chartData.map(item => item.color)}
            />
            {/* Center Text */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  fontWeight: 700,
                  color: '#1F2937',
                  lineHeight: 1.2,
                }}
              >
                {total}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  color: '#6B7280',
                  fontWeight: 500,
                  mt: 0.25,
                }}
              >
                Tasks
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              width: 240,
              height: 240,
              borderRadius: '50%',
              backgroundColor: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#9CA3AF',
                fontSize: '0.875rem',
              }}
            >
              No Data
            </Typography>
          </Box>
        )}
      </Box>

      {/* Legend */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: { xs: 2, sm: 3 },
          flexWrap: 'wrap',
        }}
      >
        {chartData.map((item) => (
          <Box
            key={item.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: item.color,
                flexShrink: 0,
                boxShadow: item.id === 2 ? '0px 2px 4px rgba(248, 113, 113, 0.3)' : 'none', // Emphasize Missed
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                color: '#374151',
                fontWeight: item.id === 2 ? 600 : 500, // Emphasize Missed
              }}
            >
              {item.label}: <strong>{item.value}</strong>
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
}

