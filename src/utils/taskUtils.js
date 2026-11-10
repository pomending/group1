import { isValidDate } from "./dateUtils";

export const TASK_TYPES = ["제작 관리", "검수 관리", "포장 관리", "배송 관리"]

export const TASK_PROGRESS = ["대기중", "작업중", "완료"];

export const getAvailableEmployees = (employees, taskType) => {

    return employees.filter(e => {

        if (["제작 관리", "검수 관리", "포장 관리"].includes(taskType)) {
            return e.department === "생산팀" && e.status === "재직";
        } else if (taskType === "배송 관리") {
            return e.department === "물류팀" && e.status === "재직";
        }
        return false;

    });
};

export const validateTask = (taskData, projects, employees, tasks, excludeId = null) => {

    if (!taskData.projectId) {
        return "프로젝트를 선택하세요.";
    }
    
    if (!Number.isSafeInteger(taskData.projectId) || taskData.projectId <= 0) {
        return "올바르지 않은 프로젝트 ID입니다.";
    }

    const selectedProject = projects.find(
        project => project.id === taskData.projectId
    );

    if (!selectedProject) {
        return "존재하지 않는 프로젝트입니다.";
    }

    if (!taskData.taskType) {
        return "작업 단계를 선택하세요.";
    }

    if (!taskData.employeeId) {
        return "담당자를 선택하세요.";
    }
    
    if (!Number.isSafeInteger(taskData.employeeId) || taskData.employeeId <= 0) {
        return "올바르지 않은 담당자 ID입니다.";
    }

    if (!taskData.taskDeadline) {
        return "작업 마감일을 선택하세요.";
    }
    
    if (!isValidDate(taskData.taskDeadline)) {
        return "올바른 작업 마감일을 선택하세요.";
    }

    if (
        !isValidDate(selectedProject.startDate) ||
        !isValidDate(selectedProject.dueDate)
    ) {
        return "프로젝트의 시작일과 마감일을 확인하세요.";
    }

    if (!TASK_TYPES.includes(taskData.taskType)) {
        return "올바른 작업 단계를 선택하세요.";
    }

    if (!TASK_PROGRESS.includes(taskData.progress)) {
        return "올바른 작업 진행 상태를 선택하세요.";
    }

    const original = excludeId == null
        ? null
        : tasks.find(t => Number(t.id) === Number(excludeId));

    const keepEmployee =
        original?.progress === "완료" &&
        taskData.progress === "완료" &&
        Number(original.employeeId) === Number(taskData.employeeId) &&
        original.taskType === taskData.taskType &&
        Number(original.projectId) === Number(taskData.projectId);

    if (!keepEmployee) {

        const validEmployee = getAvailableEmployees(employees, taskData.taskType).some(
            e => e.id === taskData.employeeId
        );

        if (!validEmployee) {
            return "해당 작업을 담당할 수 있는 재직 직원을 선택하세요.";
        }

    }

    if (
        taskData.taskDeadline < selectedProject.startDate ||
        taskData.taskDeadline > selectedProject.dueDate
    ) {
        return "프로젝트 기간 내에서 마감일을 선택하세요.";
    }

    const selectedTasks = tasks.filter(
        (task) => task.projectId === taskData.projectId
    )

    if (selectedTasks.some(t =>
        t.taskType === taskData.taskType &&
        t.id !== excludeId
    )) {
        return "이미 등록된 작업 단계입니다.";
    }

    return null;

}