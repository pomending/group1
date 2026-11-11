import React, { createContext, useContext } from "react";
import useProjectData from "./useProjectData";
import useEmployeeData from "./useEmployeeData";
import useCustomerData from "./useCustomerData";
import useAccountData from "./useAccountData";
import useAuthData from "./useAuthData";
import useProductData from "./useProductData";
import useConsultationData from "./useConsultationData";
import useTaskData from "./useTaskData";
import { getProjectManagers, canCompleteProject } from "../utils/projectUtils";
import { getAvailableEmployees } from "../utils/taskUtils";
import { validateEmployee } from "../utils/employeeUtils";
import useQuotationData from "./useQuotationData";
import { deleteSchedulesByProject, deleteSchedulesByEmployee, resetStoredSchedules } from "../5_schedule/scheduleStorage";

const ERPContext = createContext(null);

export function ERPProvider({ children }) {
    // 현재 실제 구현된 모듈만 호출한다. 다른 팀원의 빈 hook은 완성 후 연결.
    const employeeData = useEmployeeData();
    const quotationData = useQuotationData();
    const projectData = useProjectData(employeeData.employees, quotationData.quotations);
    const { completeProject, ...publicProjectData } = projectData;
    const customerData = useCustomerData();
    const productData = useProductData();
    const accountData = useAccountData(employeeData.employees);
    const authData = useAuthData(accountData.accounts, employeeData.employees);
    const consultationData = useConsultationData();
    const taskData = useTaskData(projectData.projects, employeeData.employees);


    const updateEmployee = (updatedEmployee) => {

        const employeeId = Number(updatedEmployee.id);

        const original = employeeData.employees.find(
            e => Number(e.id) === employeeId
        );

        if (!original) {
            return employeeData.updateEmployee(updatedEmployee);
        }

        const mergedEmployee = {
            ...original,
            ...updatedEmployee
        };

        const statusChanged = original.status !== mergedEmployee.status;
        const departmentChanged = original.department !== mergedEmployee.department;

        if (statusChanged || departmentChanged) {

            // 변경 후 프로젝트 담당자 자격 확인
            const validProjectManager = getProjectManagers(
                [mergedEmployee]
            ).some(e => Number(e.id) === employeeId);

            const hasActiveProject = projectData.projects.some(p =>
                Number(p.managerId) === employeeId &&
                p.status !== "완료"
            );

            if (hasActiveProject && !validProjectManager) {
                return {
                    ok: false,
                    message: "담당 중인 프로젝트가 있습니다. 담당자를 변경한 후 수정해주세요."
                };
            }

            // 변경 후 세부 작업 담당자 자격 확인
            const hasInvalidTask = taskData.tasks.some(task => {

                if (
                    Number(task.employeeId) !== employeeId ||
                    task.progress === "완료"
                ) {
                    return false;
                }

                const availableEmployees = getAvailableEmployees(
                    [mergedEmployee],
                    task.taskType
                );

                return !availableEmployees.some(
                    e => Number(e.id) === employeeId
                );
            });

            if (hasInvalidTask) {
                return {
                    ok: false,
                    message: "담당 중인 세부 작업이 있습니다. 담당자를 변경한 후 수정해주세요."
                };
            }
        }

        // 계정 변경 전에 직원 데이터 유효성 검사
        const error = validateEmployee(
            mergedEmployee,
            employeeData.employees,
            employeeId
        );

        if (error) {
            return {
                ok: false,
                message: error
            };
        }

        // 퇴사 처리 시 계정 자동 비활성화
        if (
            original.status !== "퇴사" &&
            mergedEmployee.status === "퇴사"
        ) {

            const account = accountData.accounts.find(
                a => Number(a.employeeId) === employeeId
            );

            if (account && account.status !== "비활성") {

                const result = accountData.setAccountStatus(
                    account.id,
                    "비활성"
                );

                if (!result) {
                    return {
                        ok: false,
                        message: "계정을 비활성화할 수 없습니다. 마지막 활성 관리자 계정인지 확인해주세요."
                    };
                }
            }
        }

        return employeeData.updateEmployee(mergedEmployee);
    };

    // 담당자로 사용 중인 직원은 삭제하지 않는다.
    const deleteEmployee = (id) => {

        if (!Number.isSafeInteger(id) || id <= 0 ||
            !employeeData.employees.some(e => Number(e.id) === id)) {
            return {
                ok: false,
                message: "삭제할 직원을 찾을 수 없습니다."
            };
        }

        const hasProject = projectData.projects.some(
            project => Number(project.managerId) === Number(id)
        );

        const hasQuotation = quotationData.quotations.some(
            quotation => quotation.employeeId != null &&
                Number(quotation.employeeId) === Number(id)
        );

        const hasCustomer = customerData.customers.some(
            customer => Number(customer.employeeId) === Number(id)
        );

        const hasConsultation = consultationData.consultations.some(
            consultation => Number(consultation.employeeId) === Number(id)
        );

        const hasTask = taskData.tasks.some(
            task => Number(task.employeeId) === Number(id)
        );

        const hasAccount = accountData.accounts.some(
            a => a.employeeId === Number(id)
        );

        if (
            hasProject ||
            hasQuotation ||
            hasCustomer ||
            hasConsultation ||
            hasTask ||
            hasAccount
        ) {
            return {
                ok: false,
                message: "다른 데이터에서 참조 중인 직원은 삭제할 수 없습니다."
            };
        }

        const scheduleResult = deleteSchedulesByEmployee(Number(id));

        if (!scheduleResult.ok) {
            return scheduleResult;
        }

        return employeeData.deleteEmployee(id);
    };

    const addProject = (newProject) => {

        const selectedQuotation = quotationData.quotations.find(
            q => q.id === Number(newProject.quotationId)
        );

        if (!selectedQuotation || selectedQuotation.status !== "승인 완료") {
            return {
                ok: false,
                message: "승인된 견적을 선택하세요."
            };
        }

        if (!selectedQuotation.deliveryDate) {
            return {
                ok: false,
                message: "견적에 납품 예정일이 없습니다."
            };
        }

        const isDuplicate = projectData.projects.some(
            p => Number(p.quotationId) === Number(newProject.quotationId)
        );

        if (isDuplicate) {
            return {
                ok: false,
                message: "이미 등록된 견적입니다."
            };
        }

        return projectData.addProject({
            ...newProject,
            customerId: selectedQuotation.customerId,
            dueDate: selectedQuotation.deliveryDate,
            status: '대기'
        });

    }

    const updateProject = (updatedProject) => {

        const original = projectData.projects.find(
            p => p.id === Number(updatedProject.id)
        );

        if (!original) {
            return projectData.updateProject(updatedProject);
        }

        const mergedProject = {
            ...original,
            ...updatedProject
        };

        if (
            mergedProject.quotationId !== original.quotationId ||
            mergedProject.customerId !== original.customerId
        ) {
            return {
                ok: false,
                message: "프로젝트의 고객사와 연결 견적은 변경할 수 없습니다."
            };
        }

        const hasInvalidTask = taskData.tasks.some(task =>
            Number(task.projectId) === Number(mergedProject.id) &&
            (
                task.taskDeadline < mergedProject.startDate ||
                task.taskDeadline > mergedProject.dueDate
            )
        );

        if (hasInvalidTask) {
            return {
                ok: false,
                message: "기존 세부 작업의 마감일이 프로젝트 기간을 벗어납니다."
            };
        }

        return projectData.updateProject(updatedProject);

    };

    const deleteProject = (id) => {

        if (!Number.isSafeInteger(id) || id <= 0) {
            return {
                ok: false,
                message: "올바르지 않은 프로젝트 ID입니다."
            };
        }
    
        const project = projectData.projects.find(p => p.id === id);
    
        if (!project) {
            return {
                ok: false,
                message: "삭제할 프로젝트를 찾을 수 없습니다."
            };
        }
    
        if (project.status === "완료") {
            return {
                ok: false,
                message: "완료된 프로젝트는 삭제할 수 없습니다."
            };
        }
    
        const hasTask = taskData.tasks.some(
            task => task.projectId === id
        );
    
        if (hasTask) {
            return {
                ok: false,
                message: "세부 작업이 등록된 프로젝트는 삭제할 수 없습니다."
            };
        }
    
        const scheduleResult = deleteSchedulesByProject(id);
    
        if (!scheduleResult.ok) {
            return scheduleResult;
        }
    
        return projectData.deleteProject(id);
    };

    const addTask = (newTask) => {

        // 프로젝트 ID 유효성 검사
        if (
            !Number.isSafeInteger(newTask.projectId) ||
            newTask.projectId <= 0
        ) {
            return {
                ok: false,
                message: "올바르지 않은 프로젝트 ID입니다."
            };
        }

        // 소속 프로젝트 확인
        const project = projectData.projects.find(
            p => p.id === newTask.projectId
        );

        if (!project) {
            return {
                ok: false,
                message: "소속 프로젝트를 찾을 수 없습니다."
            };
        }

        // 완료된 프로젝트에는 작업 추가 금지
        if (project.status === "완료") {
            return {
                ok: false,
                message: "완료된 프로젝트에는 세부 작업을 추가할 수 없습니다."
            };
        }

        // 배송 작업 생성과 동시에 완료 처리하는 것은 금지
        if (
            newTask.taskType === "배송 관리" &&
            newTask.progress === "완료"
        ) {
            return {
                ok: false,
                message: "배송 작업은 생성과 동시에 완료할 수 없습니다."
            };
        }

        // 모든 검증 통과 후 실제 세부 작업 생성
        return taskData.addTask(newTask);
    };

    const updateTask = (updatedTask) => {

        const original = taskData.tasks.find(
            t => t.id === updatedTask.id
        );

        if (!original) {
            return taskData.updateTask(updatedTask);
        }

        const mergedTask = {
            ...original,
            ...updatedTask
        };

        const project = projectData.projects.find(
            p => p.id === original.projectId
        );

        if (!project) {
            return {
                ok: false,
                message: "소속 프로젝트를 찾을 수 없습니다."
            };
        }

        if (project.status === "완료") {
            return {
                ok: false,
                message: "완료된 프로젝트의 세부 작업은 수정할 수 없습니다."
            };
        }

        const isCompletingDelivery =
            original.taskType === "배송 관리" &&
            mergedTask.taskType === "배송 관리" &&
            original.progress !== "완료" &&
            mergedTask.progress === "완료";

        if (isCompletingDelivery) {
            const check = canCompleteProject(project, taskData.tasks);

            if (!check.ok) return check;
        }

        const result = taskData.updateTask(updatedTask);

        if (!result.ok) return result;

        if (isCompletingDelivery) {
            return projectData.completeProject(original.projectId);
        }

        return result;

    };

    const deleteTask = (taskId) => {

        const original = taskData.tasks.find(
            task => task.id === taskId
        );

        // 작업 ID 및 존재 여부 검증은 useTaskData에서 처리
        if (!original) {
            return taskData.deleteTask(taskId);
        }

        // 소속 프로젝트 확인
        const project = projectData.projects.find(
            p => p.id === original.projectId
        );

        if (!project) {
            return {
                ok: false,
                message: "소속 프로젝트를 찾을 수 없습니다."
            };
        }

        // 완료된 프로젝트의 세부 작업 삭제 금지
        if (project.status === "완료") {
            return {
                ok: false,
                message: "완료된 프로젝트의 세부 작업은 삭제할 수 없습니다."
            };
        }

        // 모든 검증 통과 후 삭제
        return taskData.deleteTask(taskId);
    };

    // 개발/시연용: 모듈별 참조 관계를 함께 원래 상태로 되돌린다.
    // 개별 resetEmployees의 참조 제한을 거치면 전체 초기화가 막힐 수 있어
    // 각 Hook의 원본 초기화 함수를 직접 호출한다.
    const resetAllData = () => {

        const scheduleResult = resetStoredSchedules();

        if (!scheduleResult.ok) {
            return scheduleResult;
        }

        projectData.resetProjects();
        employeeData.resetEmployees();
        customerData.resetCustomers();
        productData.resetProducts();
        accountData.resetAccounts();
        consultationData.resetConsultations();
        taskData.resetTasks();
        quotationData.resetQuotations();

        authData.logout();


    };

    return (
        <ERPContext.Provider value={{
            ...publicProjectData,
            ...employeeData,
            ...customerData,
            ...productData,
            ...accountData,
            ...authData,
            ...consultationData,
            ...taskData,
            ...quotationData,

            updateEmployee,
            deleteEmployee,

            addProject,
            updateProject,
            deleteProject,

            addTask,
            updateTask,
            deleteTask,

            resetAllData,

        }}>
            {children}
        </ERPContext.Provider>
    );
}

export function useERP() {
    const context = useContext(ERPContext);
    if (!context) throw new Error("ERPProvider 내부에서 useERP()를 사용해야 합니다.");
    return context;
}
