// 계정 초기 데이터 (20개) — 실제 로그인 ID는 직원 이메일을 사용합니다.
// employeeId는 mockData.js의 initialEmployees.id를 참조합니다.
// 첫 5개 계정은 기존 시연 계정을 유지했습니다.
// 계정 상태와 직원 재직 상태는 별개이며 휴직+활성, 재직+비활성 예시를 포함합니다.
// 초기 비밀번호는 시연용 평문입니다 (실제 서비스 인증 구조가 아닙니다).
// mustChangePassword=true: 최초 로그인 시 비밀번호 변경 안내.
// id: 1 / employeeId: 10 은 기존 대표 관리자 로그인 계정입니다.

export const initialAccounts = [
    {
        id: 1,
        employeeId: 10,
        password: "demo1234",
        role: "ADMIN",
        status: "활성",
        mustChangePassword: true,
        createdAt: "2026-11-04T09:00:00.000Z"
    },
    {
        id: 2,
        employeeId: 4,
        password: "asdf1234",
        role: "MANAGER",
        status: "활성",
        mustChangePassword: true,
        createdAt: "2026-11-04T09:00:00.000Z"
    },
    {
        id: 3,
        employeeId: 1,
        password: "asdf1234",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: true,
        createdAt: "2026-11-04T09:00:00.000Z"
    },
    {
        id: 4,
        employeeId: 2,
        password: "asdf1234",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: true,
        createdAt: "2026-11-04T09:00:00.000Z"
    },
    {
        id: 5,
        employeeId: 3,
        password: "asdf1234",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: true,
        createdAt: "2026-11-04T09:00:00.000Z"
    },
    {
        id: 6,
        employeeId: 5,
        password: "asdf1234",
        role: "MANAGER",
        status: "활성",
        mustChangePassword: true,
        createdAt: "2026-10-05T09:00:00.000Z"
    },
    {
        id: 7,
        employeeId: 6,
        password: "welcome2026",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: false,
        createdAt: "2026-10-06T09:30:00.000Z"
    },
    {
        id: 8,
        employeeId: 7,
        password: "asdf1234",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: true,
        createdAt: "2026-10-07T10:00:00.000Z"
    },
    {
        id: 9,
        employeeId: 8,
        password: "asdf1234",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: true,
        createdAt: "2026-10-08T09:00:00.000Z"
    },
    {
        id: 10,
        employeeId: 9,
        password: "welcome2026",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: false,
        createdAt: "2026-10-09T11:00:00.000Z"
    },
    {
        id: 11,
        employeeId: 11,
        password: "asdf1234",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: true,
        createdAt: "2026-10-12T09:00:00.000Z"
    },
    {
        id: 12,
        employeeId: 12,
        password: "welcome2026",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: false,
        createdAt: "2026-10-13T09:00:00.000Z"
    },
    {
        id: 13,
        employeeId: 13,
        password: "asdf1234",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: true,
        createdAt: "2026-10-14T13:00:00.000Z"
    },
    {
        id: 14,
        employeeId: 14,
        password: "welcome2026",
        role: "MANAGER",
        status: "활성",
        mustChangePassword: false,
        createdAt: "2026-10-15T09:00:00.000Z"
    },
    {
        id: 15,
        employeeId: 15,
        password: "asdf1234",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: true,
        createdAt: "2026-10-16T14:00:00.000Z"
    },
    {
        id: 16,
        employeeId: 16,
        password: "asdf1234",
        role: "EMPLOYEE",
        status: "비활성",
        mustChangePassword: true,
        createdAt: "2026-10-19T09:00:00.000Z"
    },
    {
        id: 17,
        employeeId: 17,
        password: "welcome2026",
        role: "MANAGER",
        status: "활성",
        mustChangePassword: false,
        createdAt: "2026-10-20T09:00:00.000Z"
    },
    {
        id: 18,
        employeeId: 19,
        password: "asdf1234",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: true,
        createdAt: "2026-10-21T09:00:00.000Z"
    },
    {
        id: 19,
        employeeId: 20,
        password: "welcome2026",
        role: "EMPLOYEE",
        status: "활성",
        mustChangePassword: false,
        createdAt: "2026-10-22T09:00:00.000Z"
    },
    {
        id: 20,
        employeeId: 22,
        password: "welcome2026",
        role: "ADMIN",
        status: "활성",
        mustChangePassword: false,
        createdAt: "2026-10-23T09:00:00.000Z"
    }
];
