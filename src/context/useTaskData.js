import { useEffect, useState } from "react";
import { tasks as initialTasks } from "../data/mockData";
import { getAvailableEmployees, TASK_PROGRESS, TASK_TYPES } from "../utils/taskUtils";

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

        const error = validateTask(newTask)

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

    const validateTask = (taskData, excludeId = null) => {

        if (!taskData.projectId) {
            return "프로젝트를 선택하세요.";
        }

        const selectedProject = projects.find(
            (project) => project.id === Number(taskData.projectId)
        );

        if (!selectedProject) {
            return "존재하지 않는 프로젝트입니다.";
        }

        if (!taskData.taskStatus) {
            return "작업 단계를 선택하세요.";
        }

        if (!taskData.employeeId) {
            return "담당자를 선택하세요.";
        }

        if (!taskData.taskDeadline) {
            return "작업 마감일을 선택하세요.";
        }

        if (!TASK_TYPES.includes(taskData.taskStatus)) {
            return "올바른 작업 단계를 선택하세요.";
        }

        if (!TASK_PROGRESS.includes(taskData.progress)) {
            return "올바른 작업 진행 상태를 선택하세요.";
        }

        const validEmployee = getAvailableEmployees(employees, taskData.taskStatus).some(
            e => e.id === Number(taskData.employeeId)
        );

        if (!validEmployee) {
            return "작업 단계에 맞는 재직 중인 담당자를 선택하세요.";
        }

        if (!selectedProject.startDate || !selectedProject.dueDate) {
            return "프로젝트의 시작일과 마감일을 확인하세요.";
        }

        if (
            taskData.taskDeadline < selectedProject.startDate ||
            taskData.taskDeadline > selectedProject.dueDate
        ) {
            return "프로젝트 기간 내에서 마감일을 선택하세요.";
        }

        const selectedTasks = tasks.filter(
            (task) => task.projectId === Number(taskData.projectId)
        )

        if (selectedTasks.some(t =>
            t.taskStatus === taskData.taskStatus &&
            t.id !== excludeId
        )) {
            return "이미 등록된 작업 단계입니다.";
        }

        return null;

    }

    return{
        tasks,
        resetTasks,
        addTask,
        updateTask,
        deleteTask
    }
}

export default useTaskData