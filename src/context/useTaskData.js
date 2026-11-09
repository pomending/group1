import { useEffect, useState } from "react";
import { tasks as initialTasks } from "../data/mockData";
import { validateTask } from "../utils/taskUtils";

function useTaskData(projects, employees){

    const NEXT_ID_KEY = 'erp_task_next_id'
    const STORAGE_KEY = 'erp_tasks'

    const [tasks, setTasks] = useState(() => {

        try {

            const savedTasks = localStorage.getItem(STORAGE_KEY)

            if (savedTasks !== null) {

                const parsedTasks = JSON.parse(savedTasks)

                if (Array.isArray(parsedTasks)) {
                    return parsedTasks
                }

            }

        } catch (error) {
            console.error('세부작업 데이터 불러오기 실패', error)
        }

        return initialTasks

    })

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }, [tasks]);

    const addTask = (newTask) => {

        const error = validateTask(newTask, projects, employees, tasks)

        if (error) {
            return { ok: false, message: error };
        }

        const savedNextId = Number(localStorage.getItem(NEXT_ID_KEY))

        const maxId = Math.max(
            0, ...tasks.map(t => Number(t.id) || 0)
        )

        const newId = Math.max(
            maxId + 1,
            Number.isSafeInteger(savedNextId) && savedNextId > 0 ?
                savedNextId : 1
        )

        localStorage.setItem(NEXT_ID_KEY, String(newId + 1))

        setTasks(prev => [
            ...prev, {
                ...newTask,
                id: newId
            }
        ])

        return { ok: true };

    }

    const updateTask = (updatedTask) => {
        
        const original = tasks.find(t => t.id === updatedTask.id)

        if (!original) {
            return {
                ok: false,
                message: "수정할 작업을 찾을 수 없습니다."
            };
        }

        const error = validateTask(
            { ...original, ...updatedTask }, 
            projects, 
            employees, 
            tasks,
            original.id
        );
    
        if (error) {
            return { ok: false, message: error };
        }

        setTasks(prev => prev.map(task =>
            task.id === updatedTask.id
                ? { ...task, ...updatedTask }
                : task
        ))

        return { ok: true };

    }

    const deleteTask = (id) => {

        if (!tasks.some(t => t.id === id)) {
            return {
                ok: false,
                message: "삭제할 작업이 존재하지 않습니다."
            };
        }
    
        setTasks(prev => prev.filter(task => task.id !== id));
    
        return { ok: true };
    };

    const resetTasks = () => {

        const nextId = Math.max(
            0, ...initialTasks.map(t => Number(t.id) || 0)
        ) + 1;
    
        localStorage.setItem(NEXT_ID_KEY, String(nextId));
    
        setTasks([...initialTasks]);

    };

    

    return{
        tasks,
        resetTasks,
        addTask,
        updateTask,
        deleteTask
    }
}

export default useTaskData