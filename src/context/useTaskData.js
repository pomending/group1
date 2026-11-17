import { useEffect, useState } from "react";
import { tasks as initialTasks } from "../data/mockData";
import { validateTask } from "../utils/taskUtils";

function useTaskData(){

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

        const error = validateTask(newTask, tasks);

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
        
        if (!Number.isSafeInteger(updatedTask.id) || updatedTask.id <= 0) {
            return {
                ok: false,
                message: "올바르지 않은 작업 ID입니다."
            };
        }
    
        const original = tasks.find(
            t => t.id === updatedTask.id
        );
    
        if (!original) {
            return {
                ok: false,
                message: "수정할 작업을 찾을 수 없습니다."
            };
        }

        const mergedTask = {
            ...original,
            ...updatedTask
        };

        if (original.projectId !== mergedTask.projectId) {
            return {
                ok: false,
                message: "세부 작업의 소속 프로젝트는 변경할 수 없습니다."
            };
        }

        if (original.taskType !== mergedTask.taskType) {
            return {
                ok: false,
                message: "세부 작업의 종류는 변경할 수 없습니다."
            };
        }

        const error = validateTask(
            mergedTask,
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

        if (!Number.isSafeInteger(id) || id <= 0) {
            return {
                ok: false,
                message: "올바르지 않은 작업 ID입니다."
            };
        }

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