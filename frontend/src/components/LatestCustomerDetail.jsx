import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PieChart } from '@mui/x-charts/PieChart';

export default function LatestCustomerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      // Dummy customer data with chart data
      const dummyCustomers = [
        {
          id: 1,
          customer_name: 'John Smith',
          company_name: 'Tech Solutions Inc.',
          city: 'Jakarta',
          state: 'DKI Jakarta',
          chartData: [
            { id: 1, value: 45, label: 'Done', color: '#34D399' },
            { id: 2, value: 30, label: 'Plan', color: '#6BA3D0' },
            { id: 3, value: 25, label: 'Missed', color: '#F87171' },
          ],
        },  
        {
          id: 2,
          customer_name: 'Sarah Johnson',
          company_name: 'Digital Marketing Pro',
          city: 'Surabaya',
          state: 'Jawa Timur',
          chartData: [
            { id: 1, value: 60, label: 'Completed', color: '#34D399' },
            { id: 2, value: 25, label: 'In Progress', color: '#6BA3D0' },
            { id: 3, value: 15, label: 'Pending', color: '#F87171' },
          ],
        },
        {
          id: 3,
          customer_name: 'Michael Chen',
          company_name: 'Global Trading Co.',
          city: 'Bandung',
          state: 'Jawa Barat',
          chartData: [
            { id: 1, value: 35, label: 'Completed', color: '#34D399' },
            { id: 2, value: 40, label: 'In Progress', color: '#6BA3D0' },
            { id: 3, value: 25, label: 'Pending', color: '#F87171' },
          ],
        },
        {
          id: 4,
          customer_name: 'Emily Davis',
          company_name: 'Creative Agency',
          city: 'Yogyakarta',
          state: 'DI Yogyakarta',
          chartData: [
            { id: 1, value: 70, label: 'Completed', color: '#34D399' },
            { id: 2, value: 20, label: 'In Progress', color: '#6BA3D0' },
            { id: 3, value: 10, label: 'Pending', color: '#F87171' },
          ],
        },
        {
          id: 5,
          customer_name: 'David Wilson',
          company_name: 'Innovation Labs',
          city: 'Medan',
          state: 'Sumatera Utara',
          chartData: [
            { id: 1, value: 50, label: 'Completed', color: '#34D399' },
            { id: 2, value: 35, label: 'In Progress', color: '#6BA3D0' },
            { id: 3, value: 15, label: 'Pending', color: '#F87171' },
          ],
        },
      ];
      
      // Find customer by ID
      const customerId = parseInt(id, 10);
      const foundCustomer = dummyCustomers.find(c => c.id === customerId);
      setCustomer(foundCustomer || null);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [id]);

  const handleBack = () => {
    navigate('/');
  };

  const getTotal = (chartData) => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        mt: 0,
        mb: 4,
        px: { xs: 2, sm: 3 },
      }}
    >
      {/* Header dengan Back Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mt: { xs: 2, sm: 3 },
          mb: 3,
        }}
      >
        <Button
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{
            color: '#6BA3D0',
            textTransform: 'none',
            minWidth: 'auto',
            px: 1.5,
            '&:hover': {
              backgroundColor: 'rgba(107, 163, 208, 0.1)',
            },
          }}
        >
          Back
        </Button>
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            fontWeight: 700,
            color: '#1F2937',
          }}
        >
          Customer Details
        </Typography>
      </Box>

      {/* Customer Detail dengan Chart */}
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 8,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#9CA3AF',
              fontSize: '0.875rem',
            }}
          >
            Loading...
          </Typography>
        </Box>
      ) : !customer ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 8,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#9CA3AF',
              fontSize: '0.875rem',
            }}
          >
            Customer not found
          </Typography>
        </Box>
      ) : (
        <Card
          elevation={0}
          sx={{
            background: '#FFFFFF',
            borderRadius: { xs: '12px', sm: '14px', md: '16px' },
            padding: { xs: '16px', sm: '20px', md: '24px' },
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
            border: 'none',
            width: '100%',
          }}
        >
          {/* Customer Info */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              mb: 3,
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                flex: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                  fontWeight: 600,
                  color: '#1F2937',
                }}
              >
                {customer.customer_name || 'N/A'}
              </Typography>
              {customer.company_name && (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                    color: '#6B7280',
                    fontWeight: 400,
                  }}
                >
                  {customer.company_name}
                </Typography>
              )}
              {(customer.city || customer.state) && (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    color: '#9CA3AF',
                    fontWeight: 400,
                  }}
                >
                  {[customer.city, customer.state].filter(Boolean).join(', ')}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Chart Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              gap: { xs: 3, sm: 4 },
            }}
          >
            {/* Doughnut Chart */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              {(() => {
                const total = getTotal(customer.chartData);
                const chartDataFiltered = customer.chartData.filter(item => item.value > 0);
                
                return total > 0 && chartDataFiltered.length > 0 ? (
                  <Box sx={{ position: 'relative' }}>
                    <PieChart
                      series={[
                        {
                          data: chartDataFiltered.map(item => ({
                            id: item.id,
                            value: item.value,
                          })),
                          innerRadius: 50,
                          outerRadius: 80,
                          paddingAngle: 3,
                          cornerRadius: 8,
                          cx: 90,
                          cy: 90,
                        },
                      ]}
                      width={180}
                      height={180}
                      slotProps={{
                        legend: { hidden: true },
                      }}
                      margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                      colors={chartDataFiltered.map(item => item.color)}
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
                        variant="h6"
                        sx={{
                          fontSize: { xs: '1.25rem', sm: '1.5rem' },
                          fontWeight: 700,
                          color: '#1F2937',
                        }}
                      >
                        {total}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: { xs: '0.625rem', sm: '0.75rem' },
                          color: '#6B7280',
                        }}
                      >
                        Total
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 180,
                      height: 180,
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
                );
              })()}
            </Box>

            {/* Legend */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                flex: 1,
                justifyContent: 'center',
              }}
            >
              {customer.chartData.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                        color: '#374151',
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      color: '#1F2937',
                      fontWeight: 600,
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Card>
      )}
    </Container>
  );
}

