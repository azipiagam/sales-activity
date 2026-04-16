import React from 'react';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import AddPlan from './AddPlan';

export default function AddFollowUp(props) {
  return (
    <AddPlan
      {...props}
      initialTujuan="follow up"
      title="Create Follow Up"
      headerIcon={PlaylistAddCheckIcon}
      lockTujuan
      disableAddressEdit
      disableGeocoding
    />
  );
}
