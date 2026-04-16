import React from 'react';
import AddPlan from './AddPlan';

export default function AddVisit(props) {
  return (
    <AddPlan
      {...props}
      initialTujuan="visit"
      title="Create Visit"
      lockTujuan
      disableAddressEdit={false}
    />
  );
}