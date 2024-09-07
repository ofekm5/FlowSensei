import { FC, SyntheticEvent, useState } from 'react';
import { Box, Paper, SnackbarCloseReason } from '@mui/material';
import { KanbanBoard } from '../../components/DragAndDrop/KanbanBoard';
import { typesMock, commMock } from '../../Mocks/Mocks';
import { Button } from '../../components/Button/Button';
import { CommunicationType } from '../../models/CommunicationType.model';
import { DeleteServiceDialog } from '../../components/Dialogs/DeleteServiceDialog';
import { EditServiceDialog } from '../../components/Dialogs/EditServiceDialog';
import { CreateServiceDialog } from '../../components/Dialogs/CreateServiceDialog';
import { HelpDialog } from '../../components/Dialogs/HelpDialog';
import { CustomizedSnackbars } from '../../components/Snackbar/Snackbar';

const Preferences: FC = () => {
  const [initServices] = useState<CommunicationType[]>([...commMock]);
  const [selectedService, setSelectedService] = useState<CommunicationType>();
  const [services, setServices] = useState<CommunicationType[]>([...commMock]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleApplyClick = () => {
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = (
    event?: SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenSnackbar(false);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  }

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  }

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  }

  const handleCloseHelpDialog = () => {
    setOpenHelpDialog(false);
  }

  const handleDeleteClick = (serviceToDelete: CommunicationType) => {
    setSelectedService(serviceToDelete);
    setOpenDeleteDialog(true);
  }

  const handleEditClick = (serviceToEdit: CommunicationType) => {
    setSelectedService(serviceToEdit);
    setOpenEditDialog(true);
  }

  const handleCreateClick = () => {
    setOpenCreateDialog(true);
  }

  const handleHelpClick = () => {
    setOpenHelpDialog(true);
  }

  const deleteService = () => {
    if(selectedService){
      const updatedServices = services.filter(service => service.content !== selectedService.content);
      setServices([...updatedServices])
    }

    handleCloseDeleteDialog();
  }

  const editService = (updatedService: CommunicationType) => {
    if(selectedService){
      const updatedServices = services.map(service => {
        if(service.id === updatedService.id){
          return updatedService;
        }

        return service;
      });

      setServices([...updatedServices]);
    }

    handleCloseEditDialog();
  }

  const createService = (newServiceData: Partial<CommunicationType>) => {
    console.log("newService: ", newServiceData);
    handleCloseCreateDialog();
  }

  const handleReset = () => {
    setServices([...initServices]);
  }

  return (
    <>
      <Box sx={{ display: 'flex', height: '81vh', padding: 2 }}>
        <Paper elevation={3} sx={{ padding: 2, marginRight: 2, minWidth: '220px', height: 'fit-content', backgroundColor: 'gainsboro' }}>
          <Box display={'flex'} flexDirection={'column'} gap={2}>
            <Button variant='contained' onClick={handleCreateClick}>Add Service</Button>
            <Button variant='contained' onClick={handleApplyClick}>Apply Changes</Button>
            <Button variant='contained' onClick={handleReset}>Reset</Button>
            <Button variant='contained' onClick={handleHelpClick}>Help</Button>         
          </Box>
        </Paper>
        <Box sx={{ flex: 1 }}>
          <KanbanBoard 
            services={services}
            prefTypes={typesMock} 
            setServices={setServices}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
          />
        </Box>
      </Box>

      {selectedService && openDeleteDialog &&
        <DeleteServiceDialog 
          isOpen={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
          onDelete={deleteService}
          serivceToDelete={selectedService.content}
        />
      }

      {selectedService && openEditDialog &&
        <EditServiceDialog 
          isOpen={openEditDialog}
          onClose={handleCloseEditDialog}
          onEdit={editService}
          serivceToEdit={selectedService}
        />
      }

      {openCreateDialog &&
        <CreateServiceDialog 
          isOpen={openCreateDialog}
          onClose={handleCloseCreateDialog}
          onCreate={createService}
        />
      }

      {openHelpDialog &&
        <HelpDialog 
          isOpen={openHelpDialog}
          onClose={handleCloseHelpDialog}
        />
      }

      <CustomizedSnackbars 
        isOpen={openSnackbar}
        onClose={handleCloseSnackbar}
      />
    </>
  );
};

export default Preferences;
