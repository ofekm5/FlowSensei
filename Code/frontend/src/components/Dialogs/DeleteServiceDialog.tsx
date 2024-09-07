import { FC } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface IProps {
    isOpen: boolean;
    serivceToDelete: string;
    onClose: () => void;
    onDelete: () => void;
}

export const DeleteServiceDialog: FC<IProps> = ({
    isOpen,
    serivceToDelete,
    onClose,
    onDelete,
}) => {

  return (
    <Dialog
    open={isOpen}
    onClose={onClose}
    maxWidth={'sm'}
    fullWidth
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
    >
        <DialogTitle id="alert-dialog-title" sx={{fontSize: 32}}>
            {`Delete Service`}
        </DialogTitle>
        <DialogContent sx={{display: 'flex', gap: 1}}>
            <DialogContentText id="alert-dialog-description" sx={{fontSize: 24}}>
                {`Are You Sure You Want To Delete`}
            </DialogContentText>
            <DialogContentText id="alert-dialog-description" sx={{fontSize: 24, fontWeight: 'bold', color: 'black'}}>
                {serivceToDelete}
            </DialogContentText>
            <DialogContentText id="alert-dialog-description" sx={{fontSize: 24}}>
                {'?'}
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={onDelete}>Delete</Button>
        </DialogActions>
    </Dialog>
  );
}
