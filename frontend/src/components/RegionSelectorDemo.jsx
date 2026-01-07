import React, { useState } from 'react';

// Material-UI Components
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  Grid,
  Card,
  CardContent
} from '@mui/material';

import RegionSelector from './RegionSelector';

const RegionSelectorDemo = () => {
  const [selectedRegion, setSelectedRegion] = useState({
    province: null,
    regency: null,
    district: null
  });

  // State untuk demo form
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    region: {
      province: null,
      regency: null,
      district: null
    }
  });

  const [showResult, setShowResult] = useState(false);

  const handleRegionChange = (regionData) => {
    setSelectedRegion(regionData);

    setFormData(prev => ({
      ...prev,
      region: regionData
    }));
  };

  const handleSubmit = () => {
    setShowResult(true);
    console.log('Form Data:', formData);
    console.log('Selected Region:', selectedRegion);
  };

  // Handler untuk reset form
  const handleReset = () => {
    setSelectedRegion({
      province: null,
      regency: null,
      district: null
    });
    setFormData({
      name: '',
      address: '',
      region: {
        province: null,
        regency: null,
        district: null
      }
    });
    setShowResult(false);
  };

  const getRegionDisplayText = (region) => {
    const parts = [];
    if (region.province) parts.push(`Provinsi: ${region.province.name}`);
    if (region.regency) parts.push(`Kota/Kabupaten: ${region.regency.name}`);
    if (region.district) parts.push(`Kecamatan: ${region.district.name}`);
    return parts.length > 0 ? parts.join(', ') : 'Belum ada wilayah yang dipilih';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Region Selector Demo
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Komponen Cascading Searchable Input Wilayah Indonesia
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Demo interaktif untuk menguji fitur cascading input wilayah dengan autocomplete search
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Main Demo Section */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Form Demo
            </Typography>

            {/* Region Selector Component */}
            <Box sx={{ mb: 4 }}>
              <RegionSelector
                value={selectedRegion}
                onChange={handleRegionChange}
                required={true}
                showDistrict={true}
                sx={{ mb: 3 }}
              />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!selectedRegion.province || !selectedRegion.regency}
                sx={{
                  backgroundColor: '#6BA3D0',
                  '&:hover': { backgroundColor: '#5a8fb8' },
                  px: 4
                }}
              >
                Submit Data
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{
                  borderColor: '#6BA3D0',
                  color: '#6BA3D0',
                  '&:hover': {
                    borderColor: '#5a8fb8',
                    backgroundColor: 'rgba(107, 163, 208, 0.08)'
                  }
                }}
              >
                Reset Form
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Fitur Utama
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <li>Cascading dropdown (Provinsi → Kota/Kab → Kecamatan)</li>
                <li>Autocomplete search di setiap level</li>
                <li>Auto-reset ketika level atas berubah</li>
                <li>Responsive design</li>
                <li>Custom styling dengan MUI</li>
                <li>Data wilayah Indonesia lengkap</li>
                <li>Validasi dan error handling</li>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Wilayah Terpilih
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getRegionDisplayText(selectedRegion)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Result Section */}
      {showResult && (
        <Paper elevation={3} sx={{ mt: 4, p: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Hasil Form
          </Typography>

          <Alert severity="success" sx={{ mb: 3 }}>
            Data berhasil disimpan! Lihat console browser untuk detail data.
          </Alert>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Region Data:
            </Typography>
            <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                {JSON.stringify(selectedRegion, null, 2)}
              </pre>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Full Form Data:
            </Typography>
            <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                {JSON.stringify(formData, null, 2)}
              </pre>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Usage Example */}
      <Paper elevation={2} sx={{ mt: 4, p: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Contoh Penggunaan
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Berikut adalah contoh kode untuk menggunakan komponen RegionSelector:
        </Typography>

        <Box sx={{ bgcolor: 'grey.900', color: 'grey.100', p: 2, borderRadius: 1, fontSize: '0.875rem' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`import RegionSelector from './components/RegionSelector';

const MyForm = () => {
  const [region, setRegion] = useState({
    province: null,
    regency: null,
    district: null
  });

  const handleRegionChange = (regionData) => {
    setRegion(regionData);
    console.log('Selected region:', regionData);
  };

  return (
    <RegionSelector
      value={region}
      onChange={handleRegionChange}
      required={true}
      showDistrict={true}
      error={false}
      helperText="Pilih wilayah dengan lengkap"
    />
  );
};`}
          </pre>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegionSelectorDemo;
