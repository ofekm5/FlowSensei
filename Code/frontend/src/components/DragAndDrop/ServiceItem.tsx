import { FC, useState } from 'react';
import { useSortable } from "@dnd-kit/sortable";
import { Service } from '../../models/Serivce.model';
import { Paper, Typography, IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface IProps {
    commType: Service;
    onEditClick: (serviceToEdit: Service) => void;
    onDeleteClick: (serviceToDelete: Service) => void;
}

export const ServiceItem: FC<IProps> = ({ commType, onEditClick, onDeleteClick }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };



    const mainBGColor = '#6495ED';
    const borderColor = '#6495ED';
    const hoverRingColor = '#2C6280';

    const { setNodeRef, attributes, listeners, isDragging } = useSortable({
        id:commType.id,
        data: {
            type: "Task",
            commType,
        },
    })

    // We need to give an overlay so that performance issue na ho
    if(isDragging) {
        return (
            <Paper 
                ref={setNodeRef} 
                sx={{ 
                    backgroundColor: mainBGColor,
                    padding: '10px',
                    height: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: borderColor,
                    cursor: 'grab',
                    position: 'relative',
                    opacity: 0.3,
                }}

                data-yes-dnd="true"
            />
        )
    }

    return (
        <Paper 
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            sx={{ 
                position: 'relative',
                backgroundColor: mainBGColor,
                padding: '10px', 
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px', 
                cursor: 'grab',
                transition: 'transform .2s ease-in-out',

                '&:hover': {
                    boxShadow: `0 0 0 2px ${hoverRingColor} inset`,
                    //transform: 'scale(1.07)',
                },
            }}
            data-yes-dnd="true"
        >
            <IconButton 
                onClick={handleClick} 
                size='small' 
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                sx={{position: 'absolute',  top: 6, right: 2}}
            >
                <MoreVertIcon />
            </IconButton>
            <Typography variant="h5" sx={{color: 'white'}} data-yes-dnd="true">
                        {commType.content}
            </Typography> 

            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                elevation: 0,
                sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                    },
                    '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 12,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    },
                },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => onEditClick(commType)}>
                    <ListItemIcon>
                        <ModeEditIcon fontSize="small" />
                    </ListItemIcon>
                    Edit
                </MenuItem>
                <MenuItem onClick={() => onDeleteClick(commType)}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    Delete
                </MenuItem>
            </Menu>
        </Paper>
    )
}

