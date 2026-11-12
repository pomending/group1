import { isValidDate } from "./dateUtils";
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
                TASK_TYPES.includes(t.taskType)
            )
            .map(t => t.taskType)
    );

    return completedTypes.size / TASK_TYPES.length * 100;

};

export const validateProject = (projectData) => {

    if (!projectData.name?.trim()) {
        return "프로젝트명을 입력하세요.";
    }

    if (!PROJECT_STATUSES.includes(projectData.status)) {
        return "올바른 프로젝트 상태를 선택하세요.";
    }

    if (!projectData.startDate || !projectData.dueDate) {
        return "프로젝트 기간을 입력하세요.";
    }

    if (
        !isValidDate(projectData.startDate) ||
        !isValidDate(projectData.dueDate)
    ) {
        return "올바른 프로젝트 날짜를 입력하세요.";
    }

    if (
        projectData.completedDate &&
        !isValidDate(projectData.completedDate)
    ) {
        return "올바른 프로젝트 완료일을 입력하세요.";
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

    return null;

};

export const canCompleteProject = (project, tasks) => {

    if (!project) {
        return {
            ok: false,
            message: "프로젝트를 찾을 수 없습니다."
        };
    }

    if (
        !Number.isSafeInteger(project?.id) ||
        project.id <= 0
    ) {
        return {
            ok: false,
            message: "올바르지 않은 프로젝트 ID입니다."
        };
    }

    if (project.status === "완료") {
        return {
            ok: false,
            message: "이미 완료된 프로젝트입니다."
        };
    }

    const today = new Date().toLocaleDateString("sv-SE");

    if (project.startDate > today) {
        return {
            ok: false,
            message: "프로젝트 시작 예정일 이전에는 완료할 수 없습니다."
        };
    }

    const requiredTypes = [
        "제작 관리",
        "검수 관리",
        "포장 관리"
    ];

    const allCompleted = requiredTypes.every(type =>
        tasks.some(task =>
            task.projectId === project.id &&
            task.taskType === type &&
            task.progress === "완료"
        )
    );

    if (!allCompleted) {
        return {
            ok: false,
            message: "제작, 검수, 포장 작업이 모두 완료되어야 합니다."
        };
    }

    return { ok: true };

};