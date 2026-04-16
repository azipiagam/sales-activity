import React from 'react';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import AddPlan from './AddPlan';

export default function AddVisit(props) {
  return (
    <AddPlan
      {...props}
      initialTujuan="visit"
      title="Create Visit"
      headerIcon={AddLocationIcon}
      lockTujuan
      disableAddressEdit={false}
    />
  );
}
