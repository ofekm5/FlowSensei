import { FC } from 'react';
import { useSortable } from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import { CommunicationType } from '../../models/CommunicationType.model';
import { Paper, Typography } from '@mui/material';

interface IProps {
    commType: CommunicationType;
}

export const CommunicationItem: FC<IProps> = ({commType}) => {

    const mainBGColor = '#6495ED';
    const borderColor = '#6495ED';
    const hoverRingColor = '#2C6280';

    const {setNodeRef,attributes,listeners,transform,transition,isDragging} = useSortable({
        id:commType.id,
        data: {
            type: "Task",
            commType,
        },
    })

    const style = {
        display: 'flex',
        justifyContent: 'center',
        transition,
        transform: CSS.Transform.toString(transform)
    }

    // We need to give an overlay so that performance issue na ho
    if(isDragging) {
        return (
            <Paper 
                ref={setNodeRef} 
                //style={style} 
                sx={{ 
                    backgroundColor: mainBGColor,
                    padding: '10px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: borderColor,
                    cursor: 'grab',
                    position: 'relative',
                    opacity: 0.3
                }}
            />
        )
    }

    return (
        <Paper 
            ref={setNodeRef}
            //style={style}
            {...attributes}
            {...listeners}
            sx={{ 
                backgroundColor: mainBGColor,
                padding: '10px', 
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px', 
                cursor: 'grab',
                transition: 'transform .2s ease-in-out',

                '&:hover': {
                    boxShadow: `0 0 0 2px ${hoverRingColor} inset`,
                    transform: 'scale(1.07)',
                },
            }}

        >
            <Typography variant="h5" sx={{color: 'white'}}>
                        {commType.content}
            </Typography> 
        </Paper>
    )
}

