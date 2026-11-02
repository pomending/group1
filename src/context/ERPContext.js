import React, { createContext, useContext, useState } from "react";
import {
    customers as initialCustomers,
    initialEmployees,
    products as initialProducts,
    quotations as initialQuotations
} from "../data/mockData";
import useProjectData from "./useProjectData";
import useEmployeeData from "./useEmployeeData";

const ERPContext = createContext(null);

export function ERPProvider({ children }) {
    // 현재 실제 구현된 모듈만 호출한다. 다른 팀원의 빈 hook은 완성 후 연결.
    const projectData = useProjectData();
    const employeeData = useEmployeeData();

    const [customers, setCustomers] = useState(initialCustomers);
    const [products, setProducts] = useState(initialProducts);
    const [quotations, setQuotations] = useState(initialQuotations);

    // 프로젝트에서 담당자로 사용 중인 직원은 삭제하지 않는다.
    const deleteEmployee = (id) => {
        const isAssigned = projectData.projects?.some(
            project => Number(project.managerId) === Number(id)
        );
        if (isAssigned) {
            return {
                ok: false,
                message: "담당 프로젝트가 있는 직원은 삭제할 수 없습니다. 프로젝트 담당자를 먼저 변경하거나 직원의 상태를 수정해주세요."
            };
        }
        return employeeData.deleteEmployee(id);
    };

    // 직원 데이터 초기화로 프로젝트 담당자 참조가 끊어지는 상황 방지
    const resetEmployees = () => {
        const initialIds = new Set(initialEmployees.map(e => Number(e.id)));
        const hasNewEmployeeAssigned = projectData.projects?.some(
            project => project.managerId != null &&
                !initialIds.has(Number(project.managerId))
        );
        if (hasNewEmployeeAssigned) {
            return {
                ok: false,
                message: "초기 직원 목록에 없는 직원이 프로젝트 담당자로 지정되어 있어 초기화할 수 없습니다. 담당자를 먼저 변경해주세요."
            };
        }
        employeeData.resetEmployees();
        return { ok: true };
    };

    return (
        <ERPContext.Provider value={{
            ...projectData,
            ...employeeData,
            deleteEmployee, // 기본 삭제 함수를 안전한 통합 함수로 덮어씀
            resetEmployees,

            customers,
            setCustomers,
            products,
            setProducts,
            quotations,
            setQuotations
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
