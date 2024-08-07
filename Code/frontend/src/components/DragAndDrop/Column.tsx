import { FC } from 'react'
import { CommunicationItem } from './CommunicationItem'
import { SortableContext } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import {CSS} from "@dnd-kit/utilities";
import { PreferenceType } from '../../models/PreferenceType.model';
import { CommunicationType } from '../../models/CommunicationType.model';
import { Box, Card, Typography } from '@mui/material';

interface IProps {
    column: PreferenceType;
    createTask: (columnId: string) => void;
    commTypes: CommunicationType[];
}
export const Column: FC<IProps> = ({column, createTask, commTypes}) => {

    const taskIds = commTypes.map(({id})=>id);
    const {setNodeRef, attributes, listeners, transform, transition} = useSortable({
        id:column.id,
        data: {
            type: "Column",
            column,
        },
    })

    const style = {
        transition,
        transform: CSS.Transform.toString(transform)
    }

    const columnBGColor = '	#4682B4';
    const mainBGColor = '#6495ED';

    return (
        <Card elevation={4} sx={{ 
            backgroundColor: columnBGColor,
            width: '25%',
            //height: '100%',
            height: 'fit-content',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box sx={{ 
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: mainBGColor,
                borderRadius: '8px 8px 0 0',
                padding: '4px',
            }}>
                <Typography variant="h4" sx={{color: 'lightgreen'}}>
                        High Priority
                </Typography> 
            </Box>

            <Box
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                sx={{ 
                    display: 'flex',
                    flexGrow: 1,
                    flexDirection: 'column',
                    gap: '16px',
                    padding: '16px',
                    overflowX: 'hidden',
                    overflowY: 'auto'
                }}
            >
                <SortableContext items={taskIds}>
                    {commTypes.map(type => (
                        <CommunicationItem key={type.id} commType={type} />
                    ))}
                </SortableContext>
            </Box>

            <Box sx={{ 
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: mainBGColor,
                borderRadius: '0 0 8px 8px',
                padding: '4px',
            }}>
                <Typography variant="h4" sx={{color: '#dc3b4f'}}>
                    Low Priority
                </Typography> 
            </Box>

            {/* 
            <Box>
                <Button sx={{
                    borderColor: borderColor,
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderRadius: '8px',
                    padding: '16px', // 4 * 4px = 16px
                    backgroundColor: mainBGColor,
                    '&:hover': {
                        color: '#F43F5E' // Equivalent to hover:text-rose-500
                    }
                }} onClick={() => createTask(column.id)}>
                    Add Task
                </Button>
            </Box> 
            */}
        </Card>

    );

}