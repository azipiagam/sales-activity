import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

export default function LatestCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      // Dummy customer data
      const dummyCustomers = [
        {
          id: 1,
          customer_name: 'John Smith',
          company_name: 'Tech Solutions Inc.',
          city: 'Jakarta',
          state: 'DKI Jakarta',
        },
        {
          id: 2,
          customer_name: 'Sarah Johnson',
          company_name: 'Digital Marketing Pro',
          city: 'Surabaya',
          state: 'Jawa Timur',
        },
        {
          id: 3,
          customer_name: 'Michael Chen',
          company_name: 'Global Trading Co.',
          city: 'Bandung',
          state: 'Jawa Barat',
        },
        {
          id: 4,
          customer_name: 'Emily Davis',
          company_name: 'Creative Agency',
          city: 'Yogyakarta',
          state: 'DI Yogyakarta',
        },
        {
          id: 5,
          customer_name: 'David Wilson',
          company_name: 'Innovation Labs',
          city: 'Medan',
          state: 'Sumatera Utara',
        },
      ];
      
      setCustomers(dummyCustomers);
      setLoading(false);
    }, 500); // Simulate 500ms loading time

    return () => clearTimeout(timer);
  }, []);


  return (
    <Box 
      sx={{ 
        mt: { xs: 2, sm: 3, md: 3 },
        mb: { xs: 3, sm: 4, md: 4 },
        px: 0,
      }}
    >
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
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem' },
              fontWeight: 700,
              color: '#1F2937',
            }}
          >
            Customers
          </Typography>
          <IconButton
            sx={{
              color: '#6BA3D0',
              padding: { xs: '8px', sm: '10px' },
              '&:hover': {
                backgroundColor: 'rgba(107, 163, 208, 0.1)',
              },
            }}
          >
            <SearchIcon 
              sx={{ 
                fontSize: { xs: '1.25rem', sm: '1.5rem' } 
              }} 
            />
          </IconButton>
        </Box>

        {/* Customer List */}
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
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
        ) : customers.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#9CA3AF',
                fontSize: '0.875rem',
              }}
            >
              No customers found
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            {customers.map((customer, index) => (
              <Box
                key={customer.id || index}
                onClick={() => navigate(`/customers/${customer.id}`)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: { xs: 1, sm: 1.5 },
                  borderBottom: index < customers.length - 1 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(107, 163, 208, 0.05)',
                  },
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
                    variant="body1"
                    sx={{
                      fontSize: { xs: '0.9375rem', sm: '1rem' },
                      fontWeight: 500,
                      color: '#1F2937',
                    }}
                  >
                    {customer.customer_name || customer.company_name || 'N/A'}
                  </Typography>
                  {customer.company_name && customer.customer_name && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.8125rem', sm: '0.875rem' },
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
            ))}
          </Box>
        )}
      </Card>
    </Box>
  );
}

