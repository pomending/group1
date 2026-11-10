export const TASK_TYPES = ["제작 관리", "검수 관리", "포장 관리", "배송 관리"]

export const TASK_PROGRESS = ["대기중", "작업중", "완료"];

export const getAvailableEmployees = (employees, taskStatus) => {

    return employees.filter(e => {

        if (["제작 관리", "검수 관리", "포장 관리"].includes(taskStatus)) {
            return e.department === "생산팀" && e.status === "재직";
        } else if (taskStatus === "배송 관리") {
            return e.department === "물류팀" && e.status === "재직";
        }
        return false;

    });
};

export const validateTask = (taskData, projects, employees, tasks, excludeId = null) => {

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

    const original = excludeId == null
        ? null
        : tasks.find(t => Number(t.id) === Number(excludeId));

    const keepEmployee =
        original?.progress === "완료" &&
        taskData.progress === "완료" &&
        Number(original.employeeId) === Number(taskData.employeeId) &&
        original.taskStatus === taskData.taskStatus &&
        Number(original.projectId) === Number(taskData.projectId);

    if (!keepEmployee) {

        const validEmployee = getAvailableEmployees(employees, taskData.taskStatus).some(
            e => e.id === Number(taskData.employeeId)
        );

        if (!validEmployee) {
            return "해당 작업을 담당할 수 있는 재직 직원을 선택하세요.";
        }

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