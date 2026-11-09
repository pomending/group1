import { TASK_TYPES } from "./taskUtils";

export const PROJECT_STATUSES = [
    "대기",
    "진행 중",
    "완료"
];

export const getProjectManagers = (employees) => employees.filter(emp =>
    emp.department === "경영지원팀" &&
    emp.status === "재직"
);

export const isProjectDelayed = (project) => {

    if (!project.dueDate || project.status === '완료') {
        return false
    }

    return project.dueDate < new Date().toLocaleDateString('sv-SE')

}

export const getProjectStatus = (project) => {
    if (isProjectDelayed(project)) {
        return '지연'
    } else {
        return project.status
    }
}

export const getDeadlineStatus = (project) => {

    if (project.status === '완료') {
        return '완료'
    }

    if (!project.dueDate) {
        return '알 수 없음'
    }

    const today = new Date().toLocaleDateString('sv-SE')

    const daysLeft = (new Date(project.dueDate) - new Date(today)) / (60 * 60 * 24 * 1000)

    if (!Number.isFinite(daysLeft)) {
        return '정보 확인 불가'
    }

    if (daysLeft > 3) {
        return '정상'
    } else if (daysLeft > 0) {
        return `D - ${daysLeft}`
    } else if (daysLeft === 0) {
        return 'D-Day'
    } else {
        return `D + ${Math.abs(daysLeft)} (지연됨)`
    }

}

export const getProjectProgress = (project, tasks) => {

    const completedTypes = new Set(
        tasks
            .filter(t =>
                t.projectId === project.id &&
                t.progress === "완료" &&
                TASK_TYPES.includes(t.taskStatus)
            )
            .map(t => t.taskStatus)
    );

    return completedTypes.size / TASK_TYPES.length * 100;

};

export const validateProject = (projectData, employees, original = null) => {

    if (!projectData.name?.trim()) {
        return "프로젝트명을 입력하세요.";
    }

    if (!PROJECT_STATUSES.includes(projectData.status)) {
        return "올바른 프로젝트 상태를 선택하세요.";
    }

    if (!projectData.startDate || !projectData.dueDate) {
        return "프로젝트 기간을 입력하세요.";
    }

    if (projectData.startDate > projectData.dueDate) {
        return "마감일은 시작일보다 빠를 수 없습니다.";
    }

    if (
        projectData.completedDate &&
        projectData.completedDate < projectData.startDate
    ) {
        return "완료일은 프로젝트 시작일보다 빠를 수 없습니다.";
    }

    if (projectData.status === "완료" && !projectData.completedDate) {
        return "완료된 프로젝트에는 완료일이 필요합니다.";
    }

    if (projectData.status !== "완료" && projectData.completedDate) {
        return "완료되지 않은 프로젝트에는 완료일을 등록할 수 없습니다.";
    }

    const keepOldManager =
        original?.status === "완료" &&
        projectData.status === "완료" &&
        original.managerId === projectData.managerId;

    if (!keepOldManager) {

        const validManager = getProjectManagers(employees)
            .some(emp => emp.id === Number(projectData.managerId));

        if (!validManager) {
            return "경영지원팀의 재직중인 직원을 선택하세요."
        }

    }

    return null;

};