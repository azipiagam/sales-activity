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
  CardContent,
  Chip
} from '@mui/material';

// Custom Components
import AddAddressWithRegion from './addAddressWithRegion';

// Demo Component
const AddAddressWithRegionDemo = () => {
  // State untuk menyimpan data alamat yang dipilih
  const [selectedAddressData, setSelectedAddressData] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Handler untuk AddAddressWithRegion
  const handleAddressConfirm = (addressData) => {
    setSelectedAddressData(addressData);
    setShowResult(true);
    console.log('Address Data:', addressData);
  };

  // Handler untuk reset demo
  const handleReset = () => {
    setSelectedAddressData(null);
    setShowResult(false);
    setIsDrawerOpen(false);
  };

  // Helper function untuk mendapatkan display text
  const getAddressDisplayText = (data) => {
    if (!data) return 'Belum ada alamat yang dipilih';

    return data.address || 'Alamat belum lengkap';
  };

  const getRegionDisplayText = (data) => {
    if (!data) return 'Belum ada wilayah yang dipilih';

    const parts = [];
    if (data.region?.province) parts.push(`Provinsi: ${data.region.province.name}`);
    if (data.region?.regency) parts.push(`Kota/Kab: ${data.region.regency.name}`);
    if (data.region?.district) parts.push(`Kecamatan: ${data.region.district.name}`);

    // Jika ada manual input
    if (data.manualRegion?.province && !data.region?.province) {
      parts.push(`Provinsi (Manual): ${data.manualRegion.province}`);
    }
    if (data.manualRegion?.regency && !data.region?.regency) {
      parts.push(`Kota/Kab (Manual): ${data.manualRegion.regency}`);
    }
    if (data.manualRegion?.district && !data.region?.district) {
      parts.push(`Kecamatan (Manual): ${data.manualRegion.district}`);
    }

    return parts.length > 0 ? parts : 'Belum ada wilayah yang dipilih';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Add Address with Region Demo
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Demo komponen AddAddressWithRegion dengan input manual wilayah
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Kombinasi RegionSelector + manual input untuk Provinsi, Kota/Kabupaten, Kecamatan
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Main Demo Section */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Demo Add Address with Region
            </Typography>

            {/* Button untuk membuka drawer */}
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                onClick={() => setIsDrawerOpen(true)}
                sx={{
                  backgroundColor: '#6BA3D0',
                  '&:hover': { backgroundColor: '#5a8fb8' },
                  px: 4
                }}
              >
                Pilih Lokasi & Wilayah
              </Button>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
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
                Reset Demo
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Fitur Input
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <li>Input Provinsi (manual)</li>
                <li>Input Kota/Kabupaten (manual)</li>
                <li>Input Kecamatan (manual)</li>
                <li>Input Nama Jalan (manual)</li>
                <li>Input Kode Pos (manual)</li>
                <li>Preview alamat otomatis</li>
                <li>Search lokasi di OpenStreetMap</li>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Alamat Terpilih
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {getAddressDisplayText(selectedAddressData)}
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
                Wilayah:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getRegionDisplayText(selectedAddressData)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Result Section */}
      {showResult && selectedAddressData && (
        <Paper elevation={3} sx={{ mt: 4, p: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Detail Data Alamat
          </Typography>

          <Alert severity="success" sx={{ mb: 3 }}>
            Data alamat berhasil dipilih! Lihat detail di bawah.
          </Alert>

          {/* Region Data */}
          {selectedAddressData.region && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Wilayah (Manual Input):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedAddressData.region.province && (
                  <Chip label={`Provinsi: ${selectedAddressData.region.province}`} color="primary" size="small" />
                )}
                {selectedAddressData.region.regency && (
                  <Chip label={`Kota/Kab: ${selectedAddressData.region.regency}`} color="secondary" size="small" />
                )}
                {selectedAddressData.region.district && (
                  <Chip label={`Kecamatan: ${selectedAddressData.region.district}`} color="success" size="small" />
                )}
              </Box>
            </Box>
          )}

          {/* Address Details */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Detail Alamat:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedAddressData.details?.street && (
                <Chip label={`Jalan: ${selectedAddressData.details.street}`} size="small" />
              )}
              {selectedAddressData.details?.postalCode && (
                <Chip label={`Kode Pos: ${selectedAddressData.details.postalCode}`} size="small" />
              )}
            </Box>
          </Box>

          {/* Coordinates */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Koordinat:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              Latitude: {selectedAddressData.latitude}, Longitude: {selectedAddressData.longitude}
            </Typography>
          </Box>

          {/* Full Address */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Alamat Lengkap:
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body1">
                {selectedAddressData.address}
              </Typography>
            </Box>
          </Box>

          {/* Raw Data */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Raw Data (JSON):
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'grey.900', color: 'grey.100', borderRadius: 1, fontSize: '0.875rem' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(selectedAddressData, null, 2)}
              </pre>
            </Box>
          </Box>
        </Paper>
      )}

      {/* AddAddressWithRegion Drawer */}
      <AddAddressWithRegion
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        customerAddress="Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10270"
        onLocationChange={(lat, lng) => console.log('Location changed:', lat, lng)}
        onAddressConfirm={handleAddressConfirm}
      />
    </Container>
  );
};

export default AddAddressWithRegionDemo;
