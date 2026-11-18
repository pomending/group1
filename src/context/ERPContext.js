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
import { getAvailableEmployees, TASK_TYPES } from "../utils/taskUtils";
import { sanitizeEmployee, validateEmployee } from "../utils/employeeUtils";
import useQuotationData from "./useQuotationData";
import { deleteSchedulesByProject, deleteSchedulesByEmployee, resetStoredSchedules } from "../5_schedule/scheduleStorage";
import { isValidDate } from "../utils/validationUtils";
import useClaimData from "./useClaimData";
import { validateClaim } from "../utils/claimUtils";
import { resetDashboardData } from "../6_dashboard/dashboardStorage";
import { validateCustomerData } from "../utils/customerUtils";
import { validateConsultationForm } from "../utils/consultationUtils";

const ERPContext = createContext(null);

export function ERPProvider({ children }) {
    // 현재 실제 구현된 모듈만 호출한다. 다른 팀원의 빈 hook은 완성 후 연결.
    const employeeData = useEmployeeData();
    const { resetEmployees, ...publicEmployeeData } = employeeData;
    const consultationData = useConsultationData();
    const { resetConsultations, completeConsultationTransfer, checkConsultationTransfer, ...publicConsultationData } = consultationData;
    const customerData = useCustomerData();
    const { resetCustomers, ...publicCustomerData } = customerData;
    const quotationData = useQuotationData();
    const { resetQuotations, ...publicQuotationData } = quotationData;
    const productData = useProductData();
    const { setProducts, resetProducts, ...publicProductData } = productData;
    const projectData = useProjectData();
    const { completeProject, resetProjects, ...publicProjectData } = projectData;
    const accountData = useAccountData(employeeData.employees);
    const { resetAccounts, ...publicAccountData } = accountData;
    const authData = useAuthData(accountData.accounts, employeeData.employees);
    const taskData = useTaskData();
    const { resetTasks, ...publicTaskData } = taskData;
    const claimData = useClaimData();
    const { resetClaim, ...publicClaimData } = claimData;

    const validateConsultationEmployee = (consultation, original = null) => {

        const status = consultation.status || "문의 접수";
        const employeeId = consultation.employeeId;

        // 담당자가 반드시 필요한 상태
        const requiresEmployee = [
            "처리 중",
            "견적 요청",
            "문의 종료"
        ].includes(status);

        // 담당자 미배정 검사
        if (employeeId == null || employeeId === "") {
            if (requiresEmployee) {
                return {
                    ok: false,
                    message: "담당자를 지정해주세요."
                };
            }

            return { ok: true };
        }

        // 담당 직원 존재 확인
        const employee = employeeData.employees.find(
            e => e.id === employeeId
        );

        if (!employee) {
            return {
                ok: false,
                message: "존재하지 않는 담당자입니다."
            };
        }

        // 종료된 상담의 기존 담당자 기록은 유지 허용
        const keepEmployee =
            original &&
            ["문의 종료", "인계 완료"].includes(original.status) &&
            ["문의 종료", "인계 완료"].includes(status) &&
            original.employeeId === employeeId;

        if (
            !keepEmployee &&
            (
                employee.status !== "재직" ||
                employee.department !== "영업팀"
            )
        ) {
            return {
                ok: false,
                message: "재직 중인 영업팀 직원만 담당자로 지정할 수 있습니다."
            };
        }

        return { ok: true };
    };

    const validateConsultationCustomer = (
        consultation,
        newlyCreatedCustomerId = null
    ) => {

        const customerId = consultation.customerId;

        // 고객 미연결 상담 허용
        if (customerId == null) {
            return { ok: true };
        }

        if (
            !Number.isSafeInteger(customerId) ||
            customerId <= 0
        ) {
            return {
                ok: false,
                message: "올바르지 않은 고객 ID입니다."
            };
        }

        // 방금 정상적으로 생성한 고객은 존재하는 것으로 인정
        if (
            newlyCreatedCustomerId !== null &&
            customerId === newlyCreatedCustomerId
        ) {
            return { ok: true };
        }

        const exists = customerData.customers.some(
            customer => customer.id === customerId
        );

        if (!exists) {
            return {
                ok: false,
                message: "존재하지 않는 고객입니다."
            };
        }

        return { ok: true };
    };

    const saveConsultationRecord = (
        consultation,
        original = null,
        newlyCreatedCustomerId = null
    ) => {
    
        // 담당 직원 검증
        const employeeResult = validateConsultationEmployee(
            consultation, original
        );
    
        if (!employeeResult.ok) {
            return employeeResult;
        }
    
        // 고객 FK 검증
        const customerResult = validateConsultationCustomer(
            consultation, newlyCreatedCustomerId
        );
    
        if (!customerResult.ok) {
            return customerResult;
        }
    
        // 실제 상담 저장
        return original
            ? consultationData.updateConsultation(consultation)
            : consultationData.addConsultation(consultation);
    };

    const addConsultation = (newConsultation) => {
        return saveConsultationRecord(newConsultation);
    };
    
    const updateConsultation = (updatedConsultation) => {
    
        const original = consultationData.consultations.find(
            c => c.id === updatedConsultation.id
        );
    
        if (!original) {
            return {
                ok: false,
                message: "존재하지 않는 상담입니다."
            };
        }
    
        const mergedConsultation = {
            ...original,
            ...updatedConsultation
        };
    
        return saveConsultationRecord(
            mergedConsultation,
            original
        );
    };

    const saveConsultationWithCustomer = (editData) => {

        const validationResult = validateConsultationForm(editData);

        if (!validationResult.ok) {
            return validationResult;
        }

        const original = editData.id == null
            ? null
            : consultationData.consultations.find(
                c => c.id === editData.id
            );

        if (editData.id != null && !original) {
            return {
                ok: false,
                message: "존재하지 않는 상담입니다."
            };
        }

        // 담당 직원 검증
        const employeeResult = validateConsultationEmployee(
            editData, original
        );

        if (!employeeResult.ok) return employeeResult;

        // 기존 상담의 변경 제한을 고객 수정 전에 검사
        if (original) {
            if (["견적 요청", "인계 완료"].includes(original.status)) {
                if (original.status !== editData.status) {
                    return {
                        ok: false,
                        message: `${original.status} 상태의 상담은 상태를 변경할 수 없습니다.`
                    };
                }

                if (original.companyName !== editData.companyName) {
                    return {
                        ok: false,
                        message: "견적 요청 또는 인계 완료된 상담의 고객은 변경할 수 없습니다."
                    };
                }
            }

            if (
                original.status !== "인계 완료" &&
                editData.status === "인계 완료"
            ) {
                return {
                    ok: false,
                    message: "견적이 정식 등록되면 자동으로 인계 완료됩니다."
                };
            }
        }

        const today = new Date().toLocaleDateString("sv-SE");

        let customerId = editData.customerId ?? null;
        let customerAction = "none";
        let customerToAdd = null;
        let customerToUpdate = null;

        if (editData.status === "견적 요청") {

            const existingCustomer = customerData.customers.find(
                c => c.companyName === editData.companyName
            );

            if (!existingCustomer) {

                customerToAdd = {
                    companyName: editData.companyName,
                    businessNumber: "",
                    customerManager: editData.customerManager,
                    employeeId: editData.employeeId ?? null,
                    phone: editData.phone,
                    email: editData.email || "",
                    address: "",
                    createdAt: today,
                    memo: editData.memo?.trim()
                        ? `${today} | ${editData.memo}`
                        : "",
                    registrationSource: "autosave"
                };

                customerAction = "created";

            } else {

                customerId = existingCustomer.id;
                customerAction = "linked";

                const oldMemo = original?.memo || "";
                const currentMemo = editData.memo || "";

                const addedMemo = currentMemo.startsWith(oldMemo)
                    ? currentMemo.slice(oldMemo.length).trim()
                    : currentMemo.trim();

                const newMemo = addedMemo
                    ? `${today} | ${addedMemo}`
                    : "";

                const isMemoChanged =
                    !original || original.memo !== editData.memo;

                const updatedMemo = newMemo && isMemoChanged
                    ? [existingCustomer.memo, newMemo]
                        .filter(Boolean).join("\n")
                    : (existingCustomer.memo || "");

                const candidate = {
                    ...existingCustomer,
                    customerManager: editData.customerManager,
                    email: editData.email?.trim() ||
                        existingCustomer.email,
                    phone: editData.phone,
                    memo: updatedMemo
                };

                if (
                    candidate.customerManager !== existingCustomer.customerManager ||
                    candidate.email !== existingCustomer.email ||
                    candidate.phone !== existingCustomer.phone ||
                    candidate.memo !== existingCustomer.memo
                ) {
                    customerToUpdate = candidate;
                }
            }
        }

        // 기존에 연결된 고객을 다른 고객으로 바꾸는 것 방지
        if (
            original &&
            ["견적 요청", "인계 완료"].includes(original.status) &&
            (customerToAdd || original.customerId !== customerId)
        ) {
            return {
                ok: false,
                message: "이미 연결된 상담의 고객은 변경할 수 없습니다."
            };
        }

        // 실제 저장 전에 고객 정보 검증
        const customerCandidate = customerToAdd || customerToUpdate;

        if (customerCandidate) {
            const managerResult = validateCustomerEmployee(customerCandidate);

            if (!managerResult.ok) return managerResult;

            const customerResult = validateCustomerData(
                customerCandidate,
                customerData.customers,
                customerToUpdate?.id ?? null
            );

            if (!customerResult.ok) return customerResult;
        }

        // 신규 고객 생성이 아닌 경우 기존 고객 FK 검증
        if (!customerToAdd) {
            const customerResult = validateConsultationCustomer({
                customerId
            });

            if (!customerResult.ok) return customerResult;
        }

        // 신규 고객 생성
        if (customerToAdd) {
            const result = addCustomer(customerToAdd);

            if (!result.ok) return result;

            customerId = result.id;
        }

        const consultationToSave = {
            ...editData,
            customerId
        };

        const result = saveConsultationRecord(
            consultationToSave,
            original,
            customerToAdd ? customerId : null
        );

        if (!result.ok) return result;

        // 상담 저장 성공 후 기존 고객 정보 반영
        if (customerToUpdate) {
            const customerResult = saveEditedCustomer(customerToUpdate);

            if (!customerResult.ok) return customerResult;
        }

        return {
            ok: true,
            customerAction
        };
    };

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

        const hasTransferredConsultation =
            consultationData.consultations.some(
                c => ids.includes(c.id) &&
                    ["견적 요청", "인계 완료"].includes(c.status)
            );

        if (hasTransferredConsultation) {
            return {
                ok: false,
                message: "견적 요청 또는 인계 완료된 상담은 삭제할 수 없습니다."
            };
        }

        // 클레임에서 참조 중인 상담 확인
        const hasClaim = claimData.claims.some(
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

    const validateCustomerEmployee = (customer) => {

        const employeeId = customer.employeeId;

        if (employeeId == null || employeeId === "") {
            return {
                ok: false,
                message: "담당자를 지정해주세요."
            };
        }

        const employee = employeeData.employees.find(
            e => e.id === employeeId
        );

        if (!employee) {
            return {
                ok: false,
                message: "존재하지 않는 담당자입니다."
            };
        }

        if (
            employee.status !== "재직" ||
            employee.department !== "영업팀"
        ) {
            return {
                ok: false,
                message: "재직 중인 영업팀 직원만 담당자로 지정할 수 있습니다."
            };
        }

        return { ok: true };
    };

    const addCustomer = (newCustomer) => {

        if (
            !newCustomer ||
            typeof newCustomer !== "object" ||
            Array.isArray(newCustomer)
        ) {
            return {
                ok: false,
                message: "올바르지 않은 고객 정보입니다."
            };
        }

        const result = validateCustomerEmployee(newCustomer);

        if (!result.ok) {
            return result;
        }

        const customerResult = validateCustomerData(
            newCustomer,
            customerData.customers
        );

        if (!customerResult.ok) {
            return customerResult;
        }

        const newId = customerData.addCustomer(newCustomer);

        return {
            ok: true,
            id: newId
        };
    };

    const saveEditedCustomer = (updatedCustomer) => {

        if (
            !Number.isSafeInteger(updatedCustomer?.id) ||
            updatedCustomer.id <= 0
        ) {
            return {
                ok: false,
                message: "올바르지 않은 고객 ID입니다."
            };
        }

        const original = customerData.customers.find(
            c => c.id === updatedCustomer.id
        );

        if (!original) {
            return {
                ok: false,
                message: "존재하지 않는 고객입니다."
            };
        }

        const mergedCustomer = {
            ...original,
            ...updatedCustomer
        };

        const result = validateCustomerEmployee(mergedCustomer);

        if (!result.ok) {
            return result;
        }

        const customerResult = validateCustomerData(
            mergedCustomer,
            customerData.customers,
            mergedCustomer.id
        );

        if (!customerResult.ok) {
            return customerResult;
        }

        customerData.saveEditedCustomer(mergedCustomer);

        return { ok: true };
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

        if (
            !Number.isSafeInteger(updatedEmployee?.id) ||
            updatedEmployee.id <= 0
        ) {
            return {
                ok: false,
                message: "올바르지 않은 직원 ID입니다."
            };
        }

        const employeeId = updatedEmployee.id;

        const original = employeeData.employees.find(
            e => e.id === employeeId
        );

        if (!original) {
            return {
                ok: false,
                message: "수정할 직원을 찾을 수 없습니다."
            };
        }

        const mergedEmployee = {
            ...original,
            ...updatedEmployee
        };

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

        // 검증을 통과한 데이터 정리
        Object.assign(
            mergedEmployee,
            sanitizeEmployee(mergedEmployee)
        );

        const statusChanged = original.status !== mergedEmployee.status;
        const departmentChanged =
            original.department !== mergedEmployee.department;

        if (statusChanged || departmentChanged) {

            // 변경 후 영업 담당자 자격 확인
            const validSalesEmployee =
                mergedEmployee.status === "재직" &&
                mergedEmployee.department === "영업팀";

            // 담당 중인 고객 확인
            const hasCustomer = customerData.customers.some(
                c => c.employeeId === employeeId
            );

            if (hasCustomer && !validSalesEmployee) {
                return {
                    ok: false,
                    message: "담당 중인 고객이 있습니다. 담당자를 변경한 후 수정해주세요."
                };
            }

            // 진행 중인 상담 확인
            const hasActiveConsultation =
                consultationData.consultations.some(c =>
                    c.employeeId === employeeId &&
                    ["문의 접수", "처리 중", "견적 요청"].includes(c.status)
                );

            if (hasActiveConsultation && !validSalesEmployee) {
                return {
                    ok: false,
                    message: "담당 중인 상담이 있습니다. 담당자를 변경한 후 수정해주세요."
                };
            }

            // 진행 중인 견적 확인
            const hasActiveQuotation =
                quotationData.quotations.some(q =>
                    q.employeeId === employeeId &&
                    ["승인 대기", "승인 완료"].includes(q.status) &&
                    !projectData.projects.some(
                        p => p.quotationId === q.id
                    )
                );

            if (hasActiveQuotation && !validSalesEmployee) {
                return {
                    ok: false,
                    message: "담당 중인 견적이 있습니다. 담당자를 변경한 후 수정해주세요."
                };
            }

            // 변경 후 프로젝트 담당자 자격 확인
            const validProjectManager = getProjectManagers(
                [mergedEmployee]
            ).some(e => e.id === employeeId);

            // 완료되지 않은 프로젝트 확인
            const hasActiveProject = projectData.projects.some(p =>
                p.managerId === employeeId &&
                p.status !== "완료"
            );

            if (hasActiveProject && !validProjectManager) {
                return {
                    ok: false,
                    message: "담당 중인 프로젝트가 있습니다. 담당자를 변경한 후 수정해주세요."
                };
            }

            // 완료되지 않은 세부 작업 담당자 자격 확인
            const hasInvalidTask = taskData.tasks.some(task => {

                if (
                    task.employeeId !== employeeId ||
                    task.progress === "완료"
                ) {
                    return false;
                }

                const availableEmployees = getAvailableEmployees(
                    [mergedEmployee],
                    task.taskType
                );

                return !availableEmployees.some(
                    e => e.id === employeeId
                );
            });

            if (hasInvalidTask) {
                return {
                    ok: false,
                    message: "담당 중인 세부 작업이 있습니다. 담당자를 변경한 후 수정해주세요."
                };
            }
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

        const references = [];

        if (hasProject) references.push("프로젝트");
        if (hasQuotation) references.push("견적");
        if (hasCustomer) references.push("고객");
        if (hasConsultation) references.push("상담");
        if (hasTask) references.push("세부 작업");
        if (hasAccount) references.push("계정");

        if (references.length > 0) {
            return {
                ok: false,
                message: `${references.join(", ")}에서 참조 중인 직원은 삭제할 수 없습니다.`
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

            // 현재 견적이 담당 업무에 해당하는지 확인
            const isActiveQuotation =
                ["승인 대기", "승인 완료"].includes(quotation.status) &&
                !projectData.projects.some(
                    p => p.quotationId === quotation.id
                );

            // 신규 담당자 지정 또는 진행 업무에 해당할 때 자격 검사
            if (
                (isNewEmployee || isActiveQuotation) &&
                (
                    employee.status !== "재직" ||
                    employee.department !== "영업팀"
                )
            ) {
                return {
                    ok: false,
                    message: "재직 중인 영업팀 직원만 담당자로 지정할 수 있습니다."
                };
            }
        }

        return { ok: true };
    };



    const addQuotation = (newQuotation, consultationId) => {

        if (!newQuotation || typeof newQuotation !== "object") {
            return {
                ok: false,
                message: "올바르지 않은 견적 정보입니다."
            };
        }

        const isDraft = newQuotation.status === "임시 저장";

        // 정식 견적 생성 시에만 상담 관련 검사
        if (!isDraft) {

            const check =
                consultationData.checkConsultationTransfer(consultationId);

            if (!check.ok) {
                return check;
            }

            const consultation = consultationData.consultations.find(
                c => c.id === consultationId
            );

            if (consultation.customerId !== newQuotation.customerId) {
                return {
                    ok: false,
                    message: "상담과 견적의 고객 정보가 일치하지 않습니다."
                };
            }
        }

        // 기존 견적 참조 데이터 유효성 검사
        const result = validateQuotationReferences(newQuotation);

        if (!result.ok) {
            return result;
        }

        // 견적 생성
        const addResult = quotationData.addQuotation(newQuotation);

        if (!addResult.ok) {
            return addResult;
        }

        // 정식 견적 생성 성공 시에만 상담 인계 완료
        if (!isDraft) {
            consultationData.completeConsultationTransfer(consultationId);
        }

        return addResult;
    };

    const updateQuotation = (updatedQuotation, consultationId) => {

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

        // 임시 저장 견적은 승인 대기로만 정식 등록 가능
        if (
            original.status === "임시 저장" &&
            !["임시 저장", "승인 대기"].includes(mergedQuotation.status)
        ) {
            return {
                ok: false,
                message: "임시 저장된 견적은 승인 대기 상태로만 등록할 수 있습니다."
            };
        }

        // 정식 견적을 임시 저장으로 되돌리는 것 금지
        if (
            original.status !== "임시 저장" &&
            mergedQuotation.status === "임시 저장"
        ) {
            return {
                ok: false,
                message: "정식 등록된 견적은 임시 저장으로 변경할 수 없습니다."
            };
        }

        // 정식 등록된 견적의 고객 변경 금지
        if (
            original.status !== "임시 저장" &&
            original.customerId !== mergedQuotation.customerId
        ) {
            return {
                ok: false,
                message: "정식 등록된 견적의 고객은 변경할 수 없습니다."
            };
        }

        // 임시 저장에서 정식 저장으로 변경되는지 확인
        const isDraftToSubmitted =
            original.status === "임시 저장" &&
            mergedQuotation.status === "승인 대기";

        // 정식 저장으로 변경될 때만 상담 관련 검사
        if (isDraftToSubmitted) {

            const check =
                consultationData.checkConsultationTransfer(consultationId);

            if (!check.ok) {
                return check;
            }

            const consultation = consultationData.consultations.find(
                c => c.id === consultationId
            );

            if (consultation.customerId !== mergedQuotation.customerId) {
                return {
                    ok: false,
                    message: "상담과 견적의 고객 정보가 일치하지 않습니다."
                };
            }
        }

        // 기존 견적 참조 데이터 유효성 검사
        const result =
            validateQuotationReferences(mergedQuotation, original);

        if (!result.ok) {
            return result;
        }

        // 견적 수정
        const updateResult =
            quotationData.updateQuotation(updatedQuotation);

        if (!updateResult.ok) {
            return updateResult;
        }

        // 정식 저장 성공 시 상담 인계 완료
        if (isDraftToSubmitted) {
            consultationData.completeConsultationTransfer(consultationId);
        }

        return updateResult;
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

        // 연결된 견적 확인
        const quotation = quotationData.quotations.find(
            q => q.id === project.quotationId
        );

        if (!quotation) {
            return {
                ok: false,
                message: "연결된 견적을 찾을 수 없습니다."
            };
        }

        // 프로젝트 삭제 후 견적 업무를 다시 담당할 직원 확인
        const quotationEmployee = employeeData.employees.find(
            e => e.id === quotation.employeeId
        );

        if (
            !quotationEmployee ||
            quotationEmployee.status !== "재직" ||
            quotationEmployee.department !== "영업팀"
        ) {
            return {
                ok: false,
                message: "연결된 견적의 담당자가 업무를 수행할 수 없는 상태입니다."
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

        // 작업 단계별 마감일 순서 검증
        const currentOrder = TASK_TYPES.indexOf(task.taskType);

        const hasInvalidOrder = taskData.tasks.some(other => {

            // 다른 프로젝트의 작업 또는 수정 중인 자기 자신 제외
            if (
                other.projectId !== project.id ||
                other.id === original?.id
            ) {
                return false;
            }

            const otherOrder = TASK_TYPES.indexOf(other.taskType);

            if (currentOrder === -1 || otherOrder === -1) {
                return false;
            }

            // 앞 단계의 마감일이 더 늦거나,
            // 뒷 단계의 마감일이 더 빠르면 거부
            return (
                (otherOrder < currentOrder &&
                    other.taskDeadline > task.taskDeadline) ||
                (otherOrder > currentOrder &&
                    other.taskDeadline < task.taskDeadline)
            );
        });

        if (hasInvalidOrder) {
            return {
                ok: false,
                message: "작업 마감일은 제작 → 검수 → 포장 → 배송 순서로 설정해야 합니다."
            };
        }

        // 완료하려는 작업의 앞 단계가 모두 완료됐는지 확인
        if (task.progress === "완료") {

            const previousTypes = TASK_TYPES.slice(0, currentOrder);

            const hasIncompletePreviousTask = previousTypes.some(type =>
                !taskData.tasks.some(other =>
                    other.projectId === project.id &&
                    other.taskType === type &&
                    other.progress === "완료"
                )
            );

            if (hasIncompletePreviousTask) {
                return {
                    ok: false,
                    message: "앞 단계 작업이 모두 완료되어야 완료 처리할 수 있습니다."
                };
            }
        }

        // 뒤 단계가 완료됐다면 현재 작업의 완료 취소 금지
        if (
            original?.progress === "완료" &&
            task.progress !== "완료"
        ) {
            const originalOrder = TASK_TYPES.indexOf(original.taskType);

            const hasCompletedLaterTask = taskData.tasks.some(other =>
                other.projectId === original.projectId &&
                TASK_TYPES.indexOf(other.taskType) > originalOrder &&
                other.progress === "완료"
            );

            if (hasCompletedLaterTask) {
                return {
                    ok: false,
                    message: "뒤 단계에 완료된 작업이 있어 완료 상태를 취소할 수 없습니다."
                };
            }
        }

        return { ok: true };

    };

    const validateTaskProjectEditable = (project) => {

        if (project.status === "완료") {
            return {
                ok: false,
                message: "완료된 프로젝트의 세부 작업은 추가·수정·삭제할 수 없습니다."
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
        const editableResult = validateTaskProjectEditable(project);

        if (!editableResult.ok) {
            return editableResult;
        }

        if (newTask.progress !== "대기중") {
            return {
                ok: false,
                message: "신규 작업은 대기중 상태로만 등록할 수 있습니다."
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

        const editableResult = validateTaskProjectEditable(project);

        if (!editableResult.ok) {
            return editableResult;
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

        //작업이 시작되면 대기 상태이던 프로젝트가 진행 중으로 변경
        if (project.status === '대기' && ["작업중", "완료"].includes(mergedTask.progress)) {

            const changeProjectStatus = projectData.updateProject({ id: project.id, status: "진행 중" })

            if (!changeProjectStatus.ok) {
                return changeProjectStatus
            }

        }

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
        const editableResult = validateTaskProjectEditable(project);

        if (!editableResult.ok) {
            return editableResult;
        }

        const currentOrder = TASK_TYPES.indexOf(original.taskType);

        const hasCompletedLaterTask = taskData.tasks.some(task =>
            task.projectId === original.projectId &&
            TASK_TYPES.indexOf(task.taskType) > currentOrder &&
            task.progress === "완료"
        );

        if (hasCompletedLaterTask) {
            return {
                ok: false,
                message: "뒤 단계에 완료된 작업이 있어 삭제할 수 없습니다."
            };
        }

        // 모든 검증 통과 후 삭제
        return taskData.deleteTask(taskId);
    };

    const addClaim = (newClaim) => {

        const result = validateClaim({
            ...newClaim,
            status: "접수"
        });

        if (!result.ok) {
            return result;
        }

        const consultation = consultationData.consultations.find(
            c => c.id === newClaim.consultationId
        );

        if (!consultation) {
            return {
                ok: false,
                message: "존재하지 않는 주문번호입니다."
            };
        }

        if (consultation.status !== "인계 완료") {
            return {
                ok: false,
                message: "인계 완료된 상담만 클레임을 등록할 수 있습니다."
            };
        }

        if (
            newClaim.companyName.trim() !==
            consultation.companyName.trim()
        ) {
            return {
                ok: false,
                message: "업체명과 주문번호가 일치하지 않습니다."
            };
        }

        return claimData.addClaim({
            ...newClaim,
            companyName: consultation.companyName
        });
    };

    // 개발/시연용: 모듈별 참조 관계를 함께 원래 상태로 되돌린다.
    // 개별 resetEmployees의 참조 제한을 거치면 전체 초기화가 막힐 수 있어
    // 각 Hook의 원본 초기화 함수를 직접 호출한다.
    const resetAllData = () => {

        try {
            const scheduleResult = resetStoredSchedules();

            if (!scheduleResult.ok) {
                return scheduleResult;
            }

            // 상품 초기화 결과 확인
            const productResult = productData.resetProducts();

            if (!productResult.ok) {
                return {
                    ok: false,
                    message: (productResult.message || "상품 초기화에 실패했습니다.") +
                        " 일부 데이터는 이미 초기화되었을 수 있습니다."
                };
            }

            projectData.resetProjects();
            employeeData.resetEmployees();
            customerData.resetCustomers();
            accountData.resetAccounts();
            consultationData.resetConsultations();
            taskData.resetTasks();
            quotationData.resetQuotations();
            claimData.resetClaim();
            resetDashboardData();

            authData.logout();
            sessionStorage.removeItem("homepage_master");

            return { ok: true };

        } catch (error) {
            console.error("전체 초기화 실패", error);

            return {
                ok: false,
                message: "전체 초기화 중 오류가 발생했습니다. 일부 데이터가 초기화되었을 수 있습니다."
            };
        }

    };

    return (
        <ERPContext.Provider value={{
            ...publicProjectData,
            ...publicEmployeeData,
            ...publicCustomerData,
            ...publicProductData,
            ...publicAccountData,
            ...authData,
            ...publicConsultationData,
            ...publicTaskData,
            ...publicQuotationData,
            ...publicClaimData,

            validateConsultationEmployee,
            addConsultation,
            updateConsultation,
            saveConsultationWithCustomer,
            deleteConsultations,

            addCustomer,
            saveEditedCustomer,
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

            addClaim,

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
