import { FC, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { CommunicationType } from '../../models/CommunicationType.model';
import { Box, Paper, styled } from '@mui/material';
import { TextField } from '../TextField/TextField';

const ServiceFormPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    maxWidth: 500,
    textAlign: 'center',
    //backgroundColor: 'gainsboro',
  }));

interface IProps {
    isOpen: boolean;
    serivceToEdit: CommunicationType;
    onClose: () => void;
    onEdit: (updatedService: CommunicationType) => void;
}

export const EditServiceDialog: FC<IProps> = ({
    isOpen,
    serivceToEdit,
    onClose,
    onEdit,
}) => {
    const [name, setName] = useState(serivceToEdit.content);
    const [protocol, setProtocol] = useState(serivceToEdit.protocol);
    const [destPort, setDestPort] = useState(serivceToEdit.dstPort);
    const [srcAddr, setSrcAddr] = useState(serivceToEdit.srcAddr);
    const [destAddr, setDestAddr] = useState(serivceToEdit.dstAddr);
    const [srcPort, setSrcPort] = useState(serivceToEdit.srcPort);

    const updatedService: CommunicationType = {
        id: serivceToEdit.id, 
        columnId: serivceToEdit.columnId, 
        content: name, 
        protocol,
        dstPort: destPort, 
        srcAddr, 
        dstAddr: destAddr, 
        srcPort
    };

    const isFormValid = !!name && !!protocol && !!destPort;

    const handleConfirm = () => {
        onEdit(updatedService);
    }

    return (
    <Dialog
    open={isOpen}
    onClose={onClose}
    maxWidth={'sm'}
    fullWidth
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
    PaperProps={{
        style: {
            //backgroundColor: 'gainsboro',
        },
    }}
    >
        <DialogTitle id="alert-dialog-title" sx={{fontSize: 32, fontWeight: '200', paddingTop: '16px'}}>
            {`Edit ${serivceToEdit.content} Service`}
        </DialogTitle>
        <DialogContent sx={{display: 'flex', flexDirection: 'column', overflowY: 'hidden'}}>
            <ServiceFormPaper elevation={3} sx={{padding: 3}}>
                <Box component="form" sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="name"
                        label="Service Name"
                        name="name"
                        autoComplete="name"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="protocol"
                        label="Protocol"
                        name="protocol"
                        autoComplete="protocol"
                        autoFocus
                        value={protocol}
                        onChange={(e) => setProtocol(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="destPort"
                        label="Destination Port"
                        name="destPort"
                        autoComplete="destPort"
                        type='number'
                        autoFocus
                        value={destPort}
                        onChange={(e) => setDestPort(Number(e.target.value))}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        id="srcAddr"
                        label="Source Address"
                        name="srcAddr"
                        autoComplete="srcAddr"
                        autoFocus
                        value={srcAddr}
                        onChange={(e) => setSrcAddr(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        id="destAddr"
                        label="Destination Address"
                        name="destAddr"
                        autoComplete="destAddr"
                        autoFocus
                        value={destAddr}
                        onChange={(e) => setDestAddr(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        id="srcPort"
                        label="Source Port"
                        name="srcPort"
                        type='number'
                        autoComplete="srcPort"
                        autoFocus
                        value={srcPort}
                        onChange={(e) => setSrcPort(Number(e.target.value))}
                    />
                </Box>
            </ServiceFormPaper>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button disabled={!isFormValid} onClick={handleConfirm}>Confirm</Button>
        </DialogActions>
    </Dialog>
    );
}
