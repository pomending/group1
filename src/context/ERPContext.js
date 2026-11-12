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
import { claims } from "../data/mockData";
import { isValidDate } from "../utils/dateUtils";

const ERPContext = createContext(null);

export function ERPProvider({ children }) {
    // 현재 실제 구현된 모듈만 호출한다. 다른 팀원의 빈 hook은 완성 후 연결.
    const employeeData = useEmployeeData();
    const consultationData = useConsultationData();
    const customerData = useCustomerData();
    const quotationData = useQuotationData();
    const productData = useProductData();
    const projectData = useProjectData();
    const { completeProject, ...publicProjectData } = projectData;
    const accountData = useAccountData(employeeData.employees);
    const authData = useAuthData(accountData.accounts, employeeData.employees);
    const taskData = useTaskData();

    const deleteConsultations = (ids) => {

        // 삭제 대상 확인
        if (!Array.isArray(ids) || ids.length === 0) {
            return {
                ok: false,
                message: "삭제할 상담을 선택해주세요."
            };
        }

        // ID 유효성 검사
        const hasInvalidId = ids.some(
            id => !Number.isSafeInteger(id) || id <= 0
        );

        if (hasInvalidId) {
            return {
                ok: false,
                message: "올바르지 않은 상담 ID가 포함되어 있습니다."
            };
        }

        // 상담 존재 여부 검사
        const hasMissingConsultation = ids.some(
            id => !consultationData.consultations.some(
                c => c.id === id
            )
        );

        if (hasMissingConsultation) {
            return {
                ok: false,
                message: "존재하지 않는 상담이 포함되어 있습니다."
            };
        }

        const hasQuotationRequested =
            consultationData.consultations.some(
                c => ids.includes(c.id) &&
                    c.status === "견적 요청"
            );

        if (hasQuotationRequested) {
            return {
                ok: false,
                message: "견적 요청된 상담은 삭제할 수 없습니다."
            };
        }

        // 클레임에서 참조 중인 상담 확인
        const hasClaim = claims.some(
            claim => ids.includes(claim.consultationId)
        );

        if (hasClaim) {
            return {
                ok: false,
                message: "클레임이 연결된 상담이 포함되어 있어 삭제할 수 없습니다."
            };
        }

        return consultationData.deleteConsultations(ids);
    };

    const deleteCustomers = (ids) => {

        // 삭제 대상 확인
        if (!Array.isArray(ids) || ids.length === 0) {
            return {
                ok: false,
                message: "삭제할 고객을 선택해주세요."
            };
        }

        // ID 유효성 검사
        const hasInvalidId = ids.some(
            id => !Number.isSafeInteger(id) || id <= 0
        );

        if (hasInvalidId) {
            return {
                ok: false,
                message: "올바르지 않은 고객 ID가 포함되어 있습니다."
            };
        }

        // 고객 존재 여부 검사
        const hasMissingCustomer = ids.some(
            id => !customerData.customers.some(c => c.id === id)
        );

        if (hasMissingCustomer) {
            return {
                ok: false,
                message: "존재하지 않는 고객이 포함되어 있습니다."
            };
        }

        // 자동 등록 고객 확인
        const hasAutoSavedCustomer = customerData.customers.some(
            c => ids.includes(c.id) &&
                c.registrationSource === "autosave"
        );

        // 상담에서 참조 중인 고객 확인
        const hasConsultation = consultationData.consultations.some(
            c => ids.includes(c.customerId)
        );

        // 견적에서 참조 중인 고객 확인
        const hasQuotation = quotationData.quotations.some(
            q => ids.includes(q.customerId)
        );

        // 프로젝트에서 참조 중인 고객 확인
        const hasProject = projectData.projects.some(
            p => ids.includes(p.customerId)
        );

        if (
            hasAutoSavedCustomer ||
            hasConsultation ||
            hasQuotation ||
            hasProject
        ) {
            return {
                ok: false,
                message: "자동 등록되었거나 다른 데이터에서 참조 중인 고객이 포함되어 있어 삭제할 수 없습니다."
            };
        }

        return customerData.deleteCustomers(ids);
    };

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

    const validateQuotationReferences = (quotation, original = null) => {

        const isDraft = quotation.status === "임시 저장";

        // 고객 참조 검사
        if (!isDraft || quotation.customerId != null) {
            const hasCustomer = customerData.customers.some(
                c => c.id === quotation.customerId
            );

            if (!hasCustomer) {
                return {
                    ok: false,
                    message: "존재하는 고객을 선택해주세요."
                };
            }
        }

        // 상품 참조 검사
        if (!isDraft || quotation.productId != null) {

            const product = productData.products.find(
                p => p.id === quotation.productId
            );

            if (!product) {
                return {
                    ok: false,
                    message: "존재하는 상품을 선택해주세요."
                };
            }

            const isNewProduct =
                !original ||
                original.productId !== quotation.productId;

            // 신규 상품을 선택하는 경우
            if (isNewProduct) {

                if (product.productStatus !== "판매 중") {
                    return {
                        ok: false,
                        message: "판매 중인 상품만 선택할 수 있습니다."
                    };
                }

                if (quotation.baseUnitPrice !== product.productPrice) {
                    return {
                        ok: false,
                        message: "상품의 기본 단가가 일치하지 않습니다."
                    };
                }
            }
        }

        // 직원 참조 검사
        if (!isDraft || quotation.employeeId != null) {

            const employee = employeeData.employees.find(
                e => e.id === quotation.employeeId
            );

            if (!employee) {
                return {
                    ok: false,
                    message: "존재하는 직원을 선택해주세요."
                };
            }

            const isNewEmployee =
                !original ||
                original.employeeId !== quotation.employeeId;

            if (
                isNewEmployee &&
                (
                    employee.status !== "재직" ||
                    employee.department !== "영업팀"
                )
            ) {
                return {
                    ok: false,
                    message: "재직 중인 영업팀 직원만 선택할 수 있습니다."
                };
            }
        }

        return { ok: true };
    };

    const addQuotation = (newQuotation) => {

        if (!newQuotation || typeof newQuotation !== "object") {
            return {
                ok: false,
                message: "올바르지 않은 견적 정보입니다."
            };
        }

        const result = validateQuotationReferences(newQuotation);

        if (!result.ok) {
            return result;
        }

        return quotationData.addQuotation(newQuotation);
    };

    const updateQuotation = (updatedQuotation) => {

        if (
            !Number.isSafeInteger(updatedQuotation?.id) ||
            updatedQuotation.id <= 0
        ) {
            return {
                ok: false,
                message: "올바르지 않은 견적 ID입니다."
            };
        }

        const original = quotationData.quotations.find(
            q => q.id === updatedQuotation.id
        );

        if (!original) {
            return {
                ok: false,
                message: "견적서를 찾을 수 없습니다."
            };
        }

        const hasProject = projectData.projects.some(
            p => p.quotationId === original.id
        );

        if (hasProject) {
            return {
                ok: false,
                message: "프로젝트에 연결된 견적은 수정할 수 없습니다."
            };
        }

        const mergedQuotation = {
            ...original,
            ...updatedQuotation
        };

        const result =
            validateQuotationReferences(mergedQuotation, original);

        if (!result.ok) {
            return result;
        }

        return quotationData.updateQuotation(updatedQuotation);
    };

    const deleteQuotation = (id) => {

        if (!Number.isSafeInteger(id) || id <= 0) {
            return {
                ok: false,
                message: "올바르지 않은 견적 ID입니다."
            };
        }

        const quotation = quotationData.quotations.find(
            q => q.id === id
        );

        if (!quotation) {
            return {
                ok: false,
                message: "삭제할 견적을 찾을 수 없습니다."
            };
        }

        const hasProject = projectData.projects.some(
            p => p.quotationId === id
        );

        if (hasProject) {
            return {
                ok: false,
                message: "프로젝트에서 사용 중인 견적은 삭제할 수 없습니다."
            };
        }

        if (quotation.status === "승인 완료") {
            return {
                ok: false,
                message: "승인 완료된 견적은 삭제할 수 없습니다."
            };
        }

        return quotationData.deleteQuotation(id);
    };

    const validateProjectReferences = (project, original = null) => {

        const keepOldManager =
            original?.status === "완료" &&
            project.status === "완료" &&
            original.managerId === project.managerId;
    
        if (!keepOldManager) {
    
            if (
                !Number.isSafeInteger(project.managerId) ||
                project.managerId <= 0
            ) {
                return {
                    ok: false,
                    message: "올바르지 않은 담당자 ID입니다."
                };
            }
    
            const validManager = getProjectManagers(
                employeeData.employees
            ).some(
                emp => emp.id === project.managerId
            );
    
            if (!validManager) {
                return {
                    ok: false,
                    message: "경영지원팀의 재직중인 직원을 선택하세요."
                };
            }
        }
    
        return { ok: true };
    };

    const addProject = (newProject) => {

        // 견적 ID 타입 검증
        if (
            !Number.isSafeInteger(newProject.quotationId) ||
            newProject.quotationId <= 0
        ) {
            return {
                ok: false,
                message: "올바르지 않은 견적 ID입니다."
            };
        }
    
        // 연결 견적 확인
        const selectedQuotation = quotationData.quotations.find(
            q => q.id === newProject.quotationId
        );
    
        if (
            !selectedQuotation ||
            selectedQuotation.status !== "승인 완료"
        ) {
            return {
                ok: false,
                message: "승인된 견적을 선택하세요."
            };
        }
    
        // 견적의 납품 예정일 확인
        if (!selectedQuotation.deliveryDate) {
            return {
                ok: false,
                message: "견적에 납품 예정일이 없습니다."
            };
        }
    
        // 실제 등록할 프로젝트 데이터
        const mergedProject = {
            ...newProject,
            customerId: selectedQuotation.customerId,
            dueDate: selectedQuotation.deliveryDate,
            status: "대기"
        };
    
        // 프로젝트 담당자 검증
        const result = validateProjectReferences(mergedProject);
    
        if (!result.ok) {
            return result;
        }
    
        return projectData.addProject(mergedProject);
    
    };

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
    
        // 기존 고객 및 견적 변경 금지
        if (
            mergedProject.quotationId !== original.quotationId ||
            mergedProject.customerId !== original.customerId
        ) {
            return {
                ok: false,
                message: "프로젝트의 고객사와 연결 견적은 변경할 수 없습니다."
            };
        }
    
        // 기존 작업이 수정된 프로젝트 기간을 벗어나는지 확인
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
    
        // 프로젝트 담당자 검증
        const result = validateProjectReferences(
            mergedProject, original
        );
    
        if (!result.ok) {
            return result;
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

    const validateTaskReferences = (
        task, project, original = null
    ) => {
    
        // 프로젝트 시작일 및 마감일 검사
        if (
            !isValidDate(project.startDate) ||
            !isValidDate(project.dueDate)
        ) {
            return {
                ok: false,
                message: "프로젝트의 시작일과 마감일을 확인하세요."
            };
        }
    
        // 완료된 작업의 기존 담당자 유지 가능
        const keepEmployee =
            original?.progress === "완료" &&
            task.progress === "완료" &&
            Number(original.employeeId) === Number(task.employeeId) &&
            original.taskType === task.taskType &&
            Number(original.projectId) === Number(task.projectId);
    
        if (!keepEmployee) {
    
            const validEmployee = getAvailableEmployees(
                employeeData.employees,
                task.taskType
            ).some(
                e => e.id === task.employeeId
            );
    
            if (!validEmployee) {
                return {
                    ok: false,
                    message: "해당 작업을 담당할 수 있는 재직 직원을 선택하세요."
                };
            }
        }
    
        // 작업 마감일이 프로젝트 기간 내인지 검사
        if (
            task.taskDeadline < project.startDate ||
            task.taskDeadline > project.dueDate
        ) {
            return {
                ok: false,
                message: "프로젝트 기간 내에서 마감일을 선택하세요."
            };
        }
    
        return { ok: true };
    
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
    
        // 배송 작업 생성과 동시에 완료 처리 금지
        if (
            newTask.taskType === "배송 관리" &&
            newTask.progress === "완료"
        ) {
            return {
                ok: false,
                message: "배송 작업은 생성과 동시에 완료할 수 없습니다."
            };
        }
    
        // 작업 참조 검증
        const result = validateTaskReferences(newTask, project);
    
        if (!result.ok) {
            return result;
        }
    
        // 모든 검증 통과 후 실제 작업 생성
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
    
        // 작업 참조 검증
        const referenceResult = validateTaskReferences(
            mergedTask, project, original
        );
    
        if (!referenceResult.ok) {
            return referenceResult;
        }
    
        // 배송 완료 여부 확인
        const isCompletingDelivery =
            original.taskType === "배송 관리" &&
            mergedTask.taskType === "배송 관리" &&
            original.progress !== "완료" &&
            mergedTask.progress === "완료";
    
        if (isCompletingDelivery) {
    
            const check = canCompleteProject(
                project, taskData.tasks
            );
    
            if (!check.ok) return check;
    
        }
    
        // 실제 세부 작업 수정
        const result = taskData.updateTask(updatedTask);
    
        if (!result.ok) return result;
    
        // 배송 완료 시 프로젝트 자동 완료
        if (isCompletingDelivery) {
            return projectData.completeProject(
                original.projectId
            );
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
            claims,

            deleteConsultations,

            deleteCustomers,

            updateEmployee,
            deleteEmployee,

            addQuotation,
            updateQuotation,
            deleteQuotation,

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
