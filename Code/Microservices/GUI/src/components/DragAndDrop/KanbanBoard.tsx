import { Dispatch, FC, SetStateAction, useState } from 'react'
import { Column } from './Column';
import { DndContext, DragOverEvent, DragOverlay, DragStartEvent, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { ServiceItem } from './ServiceItem';
import { Service } from '../../models/Serivce.model';
import { PreferenceType } from '../../models/PreferenceType.model';
import { createPortal } from 'react-dom';
import { Box } from '@mui/material';
import { SmartPointerSensor } from './SmartPointerSensor';

const generateId = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 8; // Adjust the length of the generated id as needed
    let id = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      id += characters.charAt(randomIndex);
    }
  
    return id;
  };

interface IProps {
    prefTypes: PreferenceType[];
    services: Service[];
    setServices: Dispatch<SetStateAction<Service[]>>
    onEditClick: (serviceToDelete: Service) => void;
    onDeleteClick: (serviceToDelete: Service) => void;
}

export const KanbanBoard: FC<IProps> = ({
    services,
    prefTypes,
    setServices,
    onEditClick,
    onDeleteClick,
}) => 
{
    const [columns,setColumns] = useState<PreferenceType[]>([...prefTypes])

    const [activeTask, setActiveTask] = useState<Service>();

    const pointerSensor = useSensor(SmartPointerSensor);
  
    const sensors = useSensors(pointerSensor);

    const createTask = (columnId: string) =>
    {
        // const newTask = {id:generateId(),columnId,content:`Task ${services.length + 1}`}
        // setServices(prev => [...prev, newTask]);
    }

    const columnIds = columns.map(({id})=>id);

    const onDragStart=(event: DragStartEvent)=>
    {
        if(event.active.data.current?.type === "Task")
        {
            setActiveTask(event.active.data.current.commType);
            return;
        }
    }

    const onDragOver=(event: DragOverEvent)=>
    {
        // The active and over represent the card which we have holded n 
        // over is the card we are hovering on top of
        const {active, over} = event;
        if(!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Check if picked element and the element we hover on is same
        // if it's same then kuch change nhi karna hai right? It's literally same position
        if(activeId === overId) return;

        const isActiveATask = active.data.current?.type === "Task";
        const isOverATask = over.data.current?.type === "Task"

        if(!isActiveATask) return;

        //We check for 2 cases
        // I am dropping a task over another task
        if(isActiveATask && isOverATask) {
            setServices((serivce) =>
            {
                // Finding indexes here as we need to shuffle them
                // activeId is same because we always give draggable id remember?
                const activeIndex = serivce.findIndex((t)=> t.id === activeId);
                const overIndex = serivce.findIndex((t) => t.id === overId);

                // If we drop the serivce on a serivce on different column, just gotta check overId
                // We can also 
                if(serivce[activeIndex].columnId!== serivce[overIndex].columnId)
                {
                    serivce[activeIndex].columnId = serivce[overIndex].columnId;
                }

                // This is a smooth inbuilt function which switches positions of
                // 2 elements in an array based on index given.
                return arrayMove(serivce, activeIndex, overIndex);
            })
        }

        // I am dropping a task over another column i.e when no tasks are there in column

        const isOverAColumn = over.data.current?.type === "Column";
        if(isActiveATask && isOverAColumn) {
            setServices((currSerivces) => {
                const activeIndex = currSerivces.findIndex((t)=>t.id === activeId);

                currSerivces[activeIndex].columnId = overId as string;

                // The reason we are using arrayMove with same 2 indexes is bc we get new array
                return arrayMove(currSerivces, activeIndex, activeIndex)
            })
        }
    }

    return (
        <Box height={'81vh'} width={'100%'} display={'flex'} flexDirection={'column'}>
            <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={()=>setActiveTask(undefined)}>
                <Box display={'flex'} justifyContent={'center'} height={'100%'} gap={4}>
                    <SortableContext items={columnIds}>
                    {columns.map(col=>(
                        <Column column={col} key={col.id} onEditClick={onEditClick}  onDeleteClick={onDeleteClick}
                            services={services.filter(service=> service.columnId === col.id)}
                        />
                    ))}
                    </SortableContext>
                </Box>
                {createPortal(<DragOverlay>
                    {activeTask && (
                        <ServiceItem commType={activeTask} onEditClick={onEditClick} onDeleteClick={onDeleteClick}/>
                    )}
                </DragOverlay>, document.body)}
            </DndContext>
        </Box>
    )

}
