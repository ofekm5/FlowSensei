import { FC, useState } from 'react'
import { Column } from './Column';
import { DndContext, DragOverEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { CommunicationItem } from './CommunicationItem';
import { CommunicationType } from '../../models/CommunicationType.model';
import { PreferenceType } from '../../models/PreferenceType.model';
import { createPortal } from 'react-dom';
import { Box, Button } from '@mui/material';

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
    commTypes: CommunicationType[];
}

export const KanbanBoard: FC<IProps> = ({
    commTypes,
    prefTypes,
}) => 
{
    const [columns,setColumns] = useState<PreferenceType[]>([...prefTypes])

    const [initTasks] = useState<CommunicationType[]>([...commTypes]);

    const [tasks,setTasks] = useState<CommunicationType[]>([...commTypes]);

    const [activeTask, setActiveTask] = useState<CommunicationType>();

    const handleReset = () => {
        setTasks([...initTasks]);
    }

    const handleApplyClick = () => {
        alert('Updated Preferences Successfully'); 
        console.log("comms:", tasks);
    }

    const createTask = (columnId: string) =>
    {
        const newTask = {id:generateId(),columnId,content:`Task ${tasks.length + 1}`}
        setTasks(prev => [...prev, newTask]);
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
            setTasks((task) =>
            {
                // Finding indexes here as we need to shuffle them
                // activeId is same because we always give draggable id remember?
                const activeIndex = task.findIndex((t)=> t.id === activeId);
                const overIndex = task.findIndex((t) => t.id === overId);

                // If we drop the task on a task on different column, just gotta check overId
                // We can also 
                if(task[activeIndex].columnId!== task[overIndex].columnId)
                {
                    task[activeIndex].columnId = task[overIndex].columnId;
                }

                // This is a smooth inbuilt function which switches positions of
                // 2 elements in an array based on index given.
                return arrayMove(task, activeIndex, overIndex);
            })
        }

        // I am dropping a task over another column i.e when no tasks are there in column

        const isOverAColumn = over.data.current?.type === "Column";
        if(isActiveATask && isOverAColumn) {
            setTasks((tasks)=>{
                const activeIndex = tasks.findIndex((t)=>t.id === activeId);

                tasks[activeIndex].columnId = overId as string;

                // The reason we are using arrayMove with same 2 indexes is bc we get new array
                return arrayMove(tasks, activeIndex, activeIndex)
            })
        }
    }

    return (
        <Box height={'100%'} display={'flex'} flexDirection={'column'} >
            <DndContext onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={()=>setActiveTask(undefined)}>
                <Box display={'flex'} justifyContent={'center'} height={'100%'} gap={4}>
                    <SortableContext items={columnIds}>
                    {columns.map(col=>(
                        <Column column={col} key={col.id} createTask={createTask}
                            commTypes={tasks.filter(task=>task.columnId === col.id)}
                        />
                    ))}
                    </SortableContext>
                </Box>
                {createPortal(<DragOverlay>
                    {activeTask && (
                        <CommunicationItem commType={activeTask}/>
                    )}
                </DragOverlay>, document.body)}
            </DndContext>
            <Box display={'flex'} gap={1} justifyContent={'flex-end'} width={'100%'}>
                <Button variant='contained' onClick={handleReset}>Reset</Button>
                <Button variant='contained' onClick={handleApplyClick}>Apply</Button>
            </Box>
        </Box>
    )

}
