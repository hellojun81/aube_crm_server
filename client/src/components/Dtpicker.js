import React, { useState } from 'react';
import dayjs from 'dayjs';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { useEffect } from 'react';


export default function DTPicker(props) {
  const [value, setValue] = React.useState(dayjs(props.value));
  const { value2, onChange} = props;

  const handleChange = (newValue) => {
     console.log('event',newValue)
     onChange(dayjs(newValue));
     setValue(dayjs(newValue));
    
  };


  // React.useEffect(() => {
  //   console.log('props.value',props.value)
  //   // setValue(dayjs(props.value));
  // }, [props.date]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={3}>
        <DesktopDatePicker
          label="Date desktop"
          inputFormat="YYYY/MM/DD"
          value={value.toDate()}
          onChange={(date) => handleChange(date)}
          renderInput={(params) => <TextField {...params} />}
        />
      </Stack>
    </LocalizationProvider>
  );
}


