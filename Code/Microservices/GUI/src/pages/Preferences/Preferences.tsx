import { FC, SyntheticEvent, useEffect, useState } from 'react';
import { Box, Paper, SnackbarCloseReason } from '@mui/material';
import { KanbanBoard } from '../../components/DragAndDrop/KanbanBoard';
import { typesMock } from '../../Mocks/Mocks';
import { Button } from '../../components/Button/Button';
import { Service } from '../../models/Serivce.model';
import { DeleteServiceDialog } from '../../components/Dialogs/DeleteServiceDialog';
import { EditServiceDialog } from '../../components/Dialogs/EditServiceDialog';
import { CreateServiceDialog } from '../../components/Dialogs/CreateServiceDialog';
import { HelpDialog } from '../../components/Dialogs/HelpDialog';
import { CustomizedSnackbars } from '../../components/Snackbar/Snackbar';
import { useFetchServices } from '../../hooks/useFetchServices';
import { useCreateService } from '../../hooks/useCreateService';
import { useUpdateService } from '../../hooks/useUpdateService';
import { useDeleteService } from '../../hooks/useDeleteService';
import { useUpdateServicesQueue } from '../../hooks/useUpdateServicesQueue';

interface IProps {
  servicesFromDB: Service[];
}

const Preferences: FC<IProps> = ({
  servicesFromDB,
}) => {
  const { createService } = useCreateService();
  const { updateService } = useUpdateService();
  const { deleteService } = useDeleteService();
  const { updateServicesQueue } = useUpdateServicesQueue();
  const [selectedService, setSelectedService] = useState<Service>();
  const [services, setServices] = useState<Service[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarText, setSnackbarText] = useState('');

  useEffect(() => {
    if(servicesFromDB){
      const fixedServices = servicesFromDB.map(service => ({...service, columnId:"111"}))
      setServices([...fixedServices]);
    }
  }, [servicesFromDB])

  const handleApplyClick = () => {
    updateServicesQueue(services);
    setSnackbarText("Updated Priorities Successfully!");
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

  const handleDeleteClick = (serviceToDelete: Service) => {
    setSelectedService(serviceToDelete);
    setOpenDeleteDialog(true);
  }

  const handleEditClick = (serviceToEdit: Service) => {
    setSelectedService(serviceToEdit);
    setOpenEditDialog(true);
  }

  const handleCreateClick = () => {
    setOpenCreateDialog(true);
  }

  const handleHelpClick = () => {
    setOpenHelpDialog(true);
  }

  const handleDeleteService = async () => {
    // if(selectedService){
    //   const updatedServices = services.filter(service => service.content !== selectedService.content);
    //   setServices([...updatedServices])
    // }
    if(selectedService){
      await deleteService(selectedService)
    }

    handleCloseDeleteDialog();
    setSnackbarText("Deleted Service Successfully!");
    setOpenSnackbar(true);
  }

  const editService = async (updatedService: Service) => {
    // if(selectedService){
    //   const updatedServices = services.map(service => {
    //     if(service.id === updatedService.id){
    //       return updatedService;
    //     }

    //     return service;
    //   });

    //   setServices([...updatedServices]);
    // }

    if(selectedService){
      await updateService(updatedService);
    }

    handleCloseEditDialog();
    setSnackbarText("Updated Service Successfully!");
    setOpenSnackbar(true);
  }

  const handleCreateService = async (newServiceData: Partial<Service>) => {
    await createService(newServiceData);
    handleCloseCreateDialog();
    setSnackbarText("Created Service Successfully!");
    setOpenSnackbar(true);
  }

  const handleReset = () => {
    setServices([...servicesFromDB]);
  }

  return (
    <>
      <Box sx={{ display: 'flex', height: '81vh', padding: 2 }}>
        <Paper elevation={3} sx={{ padding: 2, marginRight: 2, minWidth: '220px', height: 'fit-content', backgroundColor: 'gainsboro' }}>
          <Box display={'flex'} flexDirection={'column'} gap={2}>
            <Button variant='contained' onClick={handleCreateClick} disabled={services.length >= 8}>Add Service</Button>
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
          onDelete={handleDeleteService}
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
          onCreate={handleCreateService}
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
        text={snackbarText}
      />
    </>
  );
};

export default Preferences;
