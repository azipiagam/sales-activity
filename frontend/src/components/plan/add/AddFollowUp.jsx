import React from 'react';
import AddPlan from './AddPlan';

export default function AddFollowUp(props) {
  return (
    <AddPlan
      {...props}
      initialTujuan="follow up"
      title="Create Follow Up"
      lockTujuan
      disableAddressEdit
      disableGeocoding
    />
  );
}
