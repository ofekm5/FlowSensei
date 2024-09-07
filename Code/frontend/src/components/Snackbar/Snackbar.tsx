import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { FC, SyntheticEvent, useState } from 'react';

interface IProps {
    isOpen: boolean;
    onClose: (event?: SyntheticEvent | Event, reason?: SnackbarCloseReason) => void;
}
export const CustomizedSnackbars: FC<IProps> = ({
    isOpen,
    onClose,
}) => {
  return (
      <Snackbar open={isOpen} autoHideDuration={6000} onClose={onClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert
          onClose={onClose}
          severity="success"
          variant="filled"
          sx={{ width: '100%', fontSize: '24px' }}
        >
          Updated Preferences Successfully!
        </Alert>
      </Snackbar>
  );
}
