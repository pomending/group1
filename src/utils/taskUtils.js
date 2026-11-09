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