import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddLocationAltRoundedIcon from '@mui/icons-material/AddLocationAltRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FmdGoodRoundedIcon from '@mui/icons-material/FmdGoodRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';

import { AddressMap } from '../maps';
import { getCoordinatesFromAddressEnhanced } from '../../../utils/geocoding';

const PRIMARY_ADDRESS_ID = 'primary-address';
const DEFAULT_COORDINATES = {
  LAT: -6.14524734321372,
  LNG: 106.67938722917663,
};


co