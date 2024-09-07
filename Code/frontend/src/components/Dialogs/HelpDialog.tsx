import { FC } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Alert, AlertTitle, Box } from '@mui/material';

interface IProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpDialog: FC<IProps> = ({
    isOpen,
    onClose,
}) => {

  return (
    <Dialog
    open={isOpen}
    onClose={onClose}
    maxWidth={'xs'}
    fullWidth
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
    >
        <Alert severity="info">
            <AlertTitle sx={{fontWeight: 'bold'}}>Notice</AlertTitle>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, marginTop: 2}}>
                <Box>
                    1. Drag and drop services to change priority 
                </Box>
                <Box>
                    2. Click "Apply Changes" button to save changes
                </Box>
            </Box>
        </Alert>
    </Dialog>
  );
}
