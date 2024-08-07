import { FC } from 'react';
import { Box } from '@mui/material';
import { KanbanBoard } from '../../components/DragAndDrop/KanbanBoard';
import { typesMock, commMock } from '../../Mocks/Mocks';

const Preferences: FC = () => {

  return (
    <Box sx={{height: '81vh', padding: 2 }}>
      <KanbanBoard commTypes={commMock} prefTypes={typesMock}/>
    </Box>
  );
};

export default Preferences;
