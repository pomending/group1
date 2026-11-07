// HR 공통 표시/검증 함수 (Context와 화면 모두에서 사용)
export const EMPLOYEE_STATUSES = ["재직", "휴직", "퇴사"];
export const EMPLOYEE_POSITIONS = ["사원", "주임", "대리", "과장", "차장", "부장", "팀장"];

export const departmentNames = ["인사팀", "영업팀", "경영지원팀", "물류팀", "생산팀"];

export function statusClass(status) {
    return status === "재직" ? "working" : status === "휴직" ? "leave" : "resigned";
}

export function sanitizeEmployee(input = {}) {
    return {
        name: String(input.name ?? "").trim(),
        department: String(input.department ?? "").trim(),
        position: String(input.position ?? "").trim(),
        status: input.status ?? "재직",
        email: String(input.email ?? "").trim(),
        phone: String(input.phone ?? "").trim(),
        hireDate: String(input.hireDate ?? "").trim()
    };
}

export function validateEmployee(input, employees, excludeId = null) {
    const employee = sanitizeEmployee(input);
    if (!employee.name) return "직원 이름을 입력해주세요.";
    if (!departmentNames.includes(employee.department)) {
        return "목록에 있는 부서를 선택해주세요.";
    }
    if (!employee.position) return "직급을 입력해주세요.";
    if (!EMPLOYEE_STATUSES.includes(employee.status)) return "올바른 재직 상태를 선택해주세요.";

    if (!employee.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
        return "올바른 이메일 주소를 입력해주세요.";
    }
    const alreadyUsed = employees.some(e =>
        Number(e.id) !== Number(excludeId) &&
        String(e.email ?? "").toLowerCase() === employee.email.toLowerCase()
    );
    if (alreadyUsed) return "이미 등록된 이메일 주소입니다.";

    if (!/^\d{2,3}-?\d{3,4}-?\d{4}$/.test(employee.phone)) {
        return "연락처를 확인해주세요. (예: 010-1234-5678)";
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(employee.hireDate)) {
        return "입사일을 선택해주세요.";
    }
    const date = new Date(`${employee.hireDate}T00:00:00`);
    if (Number.isNaN(date.getTime()) ||
        date.getFullYear() !== Number(employee.hireDate.slice(0, 4)) ||
        date.getMonth() + 1 !== Number(employee.hireDate.slice(5, 7)) ||
        date.getDate() !== Number(employee.hireDate.slice(8, 10))) {
        return "올바른 입사일을 입력해주세요.";
    }
    const today = new Date().toLocaleDateString("sv-SE");
    if (employee.hireDate > today) return "입사일은 오늘 이후로 설정할 수 없습니다.";
    return null;
}
