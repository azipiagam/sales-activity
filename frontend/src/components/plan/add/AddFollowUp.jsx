import React from 'react';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import AddPlan from './AddPlan';

export default function AddFollowUp(props) {
  return (
    <AddPlan
      {...props}
      initialTujuan="follow up"
      title="Create Follow Up"
      headerIcon={ForumOutlinedIcon}
      lockTujuan
      disableAddressEdit
      disableGeocoding
    />
  );
}
