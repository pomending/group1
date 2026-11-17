import { useEffect, useState } from "react";
import { initialEmployees } from "../data/mockData";
import { sanitizeEmployee, validateEmployee } from "../utils/employeeUtils";

const STORAGE_KEY = "erp_employees";
const NEXT_ID_KEY = "erp_employee_next_id";

function getSavedEmployees() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (error) {
        console.error("직원 데이터 불러오기 실패", error);
    }
    return initialEmployees;
}

export default function useEmployeeData() {
    const [employees, setEmployees] = useState(getSavedEmployees);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
        } catch (error) {
            console.error("직원 데이터 저장 실패", error);
        }
    }, [employees]);

    const addEmployee = (input) => {
        const message = validateEmployee(input, employees);
        if (message) return { ok: false, message };

        // 기존 프로젝트와 직원 ID가 중복되지 않도록 가장 큰 ID 다음 값 사용
        const maxId = Math.max(0, ...employees.map(e => Number(e.id) || 0));
        let savedNextId = 1;
        try {
            savedNextId = Number(localStorage.getItem(NEXT_ID_KEY)) || 1;
        } catch (error) {
            console.error("다음 직원 ID 불러오기 실패", error);
        }
        const newId = Math.max(maxId + 1, savedNextId);
        try {
            localStorage.setItem(NEXT_ID_KEY, String(newId + 1));
        } catch (error) {
            console.error("다음 직원 ID 저장 실패", error);
        }
        setEmployees(prev => [...prev, { id: newId, ...sanitizeEmployee(input) }]);
        return { ok: true, id: newId };
    };

    const updateEmployee = (input) => {
        const id = Number(input.id);
        if (!employees.some(e => Number(e.id) === id)) {
            return { ok: false, message: "수정할 직원을 찾을 수 없습니다." };
        }
        const message = validateEmployee(input, employees, id);
        if (message) return { ok: false, message };
        setEmployees(prev => prev.map(employee =>
            Number(employee.id) === id
                ? { ...employee, ...sanitizeEmployee(input) }
                : employee
        ));
        return { ok: true, id };
    };

    // 다른 모듈의 참조 여부는 ERPContext의 통합 deleteEmployee에서 검사
    const deleteEmployee = (id) => {
        const employeeId = Number(id);
        if (!employees.some(e => Number(e.id) === employeeId)) {
            return { ok: false, message: "삭제할 직원을 찾을 수 없습니다." };
        }
        setEmployees(prev => prev.filter(e => Number(e.id) !== employeeId));
        return { ok: true };
    };

    const resetEmployees = () => {
        setEmployees([...initialEmployees]);
        try {
            localStorage.removeItem(NEXT_ID_KEY);
        } catch (error) {
            console.error("직원 ID 초기화 실패", error);
        }
    };

    return {
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        resetEmployees
    };
}
