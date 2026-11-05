import React, { createContext, useContext, useState } from "react";
import {
    quotations as initialQuotations,
    consultations as initialConsultations,
    tasks as initialTasks,
} from "../data/mockData";
import useProjectData from "./useProjectData";
import useEmployeeData from "./useEmployeeData";
import useCustomerData from "./useCustomerData";
import useAccountData from "./useAccountData";
import useAuthData from "./useAuthData";
import useProductData from "./useProductData";
import useConsultationData from "./useConsultationData";

const ERPContext = createContext(null);

export function ERPProvider({ children }) {
    // 현재 실제 구현된 모듈만 호출한다. 다른 팀원의 빈 hook은 완성 후 연결.
    const projectData = useProjectData();
    const employeeData = useEmployeeData();
    const customerData = useCustomerData();
    const productData = useProductData();
    const accountData = useAccountData(employeeData.employees);
    const authData = useAuthData(accountData.accounts, employeeData.employees);
    const consultationData = useConsultationData();

    const [quotations, setQuotations] = useState(initialQuotations);
    const [tasks, setTasks] = useState(initialTasks);

    // 담당자로 사용 중인 직원은 삭제하지 않는다.
    const deleteEmployee = (id) => {

        const hasProject = projectData.projects.some(
            project => Number(project.managerId) === Number(id)
        );

        const hasQuotation = quotations.some(
            quotation => quotation.employeeId != null &&
                Number(quotation.employeeId) === Number(id)
        );

        const hasCustomer = customerData.customers.some(
            customer => Number(customer.employeeId) === Number(id)
        );

        const hasConsultation = consultationData.consultations.some(
            consultation => Number(consultation.employeeId) === Number(id)
        );

        const hasTask = tasks.some(
            task => Number(task.managerId) === Number(id)
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

        return employeeData.deleteEmployee(id);
    };

    // 개발/시연용: 모듈별 참조 관계를 함께 원래 상태로 되돌린다.
    // 개별 resetEmployees의 참조 제한을 거치면 전체 초기화가 막힐 수 있어
    // 각 Hook의 원본 초기화 함수를 직접 호출한다.
    const resetAllData = () => {
        projectData.resetProjects();
        employeeData.resetEmployees();
        customerData.resetCustomers();
        productData.resetProducts();
        accountData.resetAccounts();
       
        authData.logout();


        // 별도 Hook이 아직 없는 모듈의 Context 상태도 초기화
        setQuotations([...initialQuotations]);
        setTasks([...initialTasks]);
    };

    return (
        <ERPContext.Provider value={{
            ...projectData,
            ...employeeData,
            ...customerData,
            ...productData,
            ...accountData,
            ...authData,
            ...consultationData,
            deleteEmployee, // 기본 삭제 함수를 안전한 통합 함수로 덮어씀
            resetAllData,

            quotations,
            setQuotations,
            tasks,
            setTasks,
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
