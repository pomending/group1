
import React, { useState } from "react";
import { initialEmployees } from "../data/mockData";
import { formatEmployeeId } from "../utils/formatUtils";
import "./MyPage.css";

// 입력한 이메일로 직원정보 찾기
function loadEmployeeByEmail(loginEmail) {
    const normalizedEmail = loginEmail.trim().toLowerCase();

    const basicEmployee = initialEmployees.find(
        item => item.email.toLowerCase() === normalizedEmail
    );

    if (!basicEmployee) {
        return null;
    }

    // 직원별로 이전에 수정한 정보 불러오기
    try {
        const storageKey = "erpMyPageInfo_" + normalizedEmail;
        const saved = localStorage.getItem(storageKey);

        if (saved) {
            const info = JSON.parse(saved);

            return {
                ...basicEmployee,
                name: info.name || basicEmployee.name,
                email: info.email || basicEmployee.email,
                phone: info.phone ?? basicEmployee.phone
            };
        }
    } catch (error) {
        // 저장정보가 없으면 mockData의 기본정보 사용
    }

    return basicEmployee;
}

// 임시 로그인에서 선택한 직원 이메일입니다.
// 실제 로그인을 연결할 때 이 함수의 이메일 조회만 교체하면 됩니다.
function getCurrentLoginEmail() {
    let savedEmail = "";
    try {
        savedEmail = localStorage.getItem("erpMyPageActiveEmail") || "";
    } catch (error) {
        // 저장소를 사용할 수 없으면 첫 번째 직원으로 시작합니다.
    }

    const email = savedEmail.trim().toLowerCase();
    const employee = initialEmployees.find(
        item => item.email.toLowerCase() === email
    );
    return employee?.email || initialEmployees[0]?.email || "";
}

// 게시판에서 현재 사용자를 확인하는 함수입니다.
export function getBoardUser() {
    const email = getCurrentLoginEmail();
    const employee = initialEmployees.find(
        item => item.email.toLowerCase() === email.toLowerCase()
    );
    if (!employee) return null;

    const displayed = loadEmployeeByEmail(email);
    return {
        employeeId: employee.id,
        email: employee.email.toLowerCase(),
        name: displayed?.name || employee.name
    };
}

// 이름은 중복될 수 있으므로 직원 ID로 권한을 판단합니다.
// 이전 글 중 이메일만 기록된 글도 지원합니다.
export function isBoardAuthor(item, user) {
    if (!item || !user) return false;
    if (item.authorEmployeeId != null) {
        return String(item.authorEmployeeId) === String(user.employeeId);
    }
    return Boolean(
        item.authorEmail &&
        String(item.authorEmail).trim().toLowerCase() === user.email
    );
}

// 사용자가 제공한 초기 계정 예시 중 화면에 필요한 정보만 임시로 표시합니다.
// 계정 번호 id 1은 mockData의 id 1(김민수)로 연결합니다.
// employeeId 10은 별도 직원 번호이며 현재 사람을 찾는 기준으로 쓰지 않습니다.
// 비밀번호는 마이페이지에서 보관하거나 표시하지 않습니다.
const exampleAccount = {
    id: 1,
    employeeId: 10,
    role: "ADMIN",
    status: "활성",
    mustChangePassword: true,
    createdAt: "2026-11-04T09:00:00.000Z"
};

function MyPage() {

    // mockData에 등록된 첫 번째 직원으로 시작
    const defaultEmail = getCurrentLoginEmail();

    // 현재 조회 중인 직원의 이메일
    const [loginEmail, setLoginEmail] = useState(defaultEmail);

    // 상단 이메일 입력창
    const [searchEmail, setSearchEmail] = useState(defaultEmail);
    const [searchError, setSearchError] = useState("");

    // 직원별 저장 위치
    const storageKey = "erpMyPageInfo_" + loginEmail.trim().toLowerCase();

    // 현재 직원 정보
    const [employee, setEmployee] = useState(() =>
        loadEmployeeByEmail(defaultEmail)
    );

    // 로그인 ID는 mockData에 등록된 이메일을 그대로 사용합니다.
    // 예시 계정의 id로만 연결합니다. employeeId는 연결에 사용하지 않습니다.
    const account = employee?.id === exampleAccount.id
        ? exampleAccount
        : null;

    // 정보 수정 상태
    const [isEditing, setIsEditing] = useState(false);

    // 수정 입력값
    const [name, setName] = useState(employee?.name || "");
    const [email, setEmail] = useState(employee?.email || "");
    const [phone, setPhone] = useState(employee?.phone || "");

    // 상단 이메일 조회 버튼
    const searchEmployee = (event) => {
        event.preventDefault();

        const nextEmail = searchEmail.trim().toLowerCase();
        const nextEmployee = loadEmployeeByEmail(nextEmail);

        if (!nextEmployee) {
            setSearchError("해당 이메일로 등록된 직원을 찾을 수 없습니다.");
            return;
        }

        // 현재 선택한 직원 이메일을 게시판에서도 사용합니다.
        try {
            localStorage.setItem("erpMyPageActiveEmail", nextEmail);
        } catch (error) {
            alert("직원 선택 정보를 저장할 수 없습니다.");
            return;
        }
        setLoginEmail(nextEmail);
        setEmployee(nextEmployee);

        // 이전 수정 상태 초기화
        setIsEditing(false);
        setName(nextEmployee.name);
        setEmail(nextEmployee.email);
        setPhone(nextEmployee.phone || "");
        setSearchError("");
    };

    // 정보 수정 시작
    const startEdit = () => {
        setName(employee.name);
        setEmail(employee.email);
        setPhone(employee.phone);
        setIsEditing(true);
    };

    // 수정정보 저장
    const saveInfo = (event) => {
        event.preventDefault();

        if (!name.trim() || !email.trim()) {
            alert("이름과 이메일을 입력해 주세요.");
            return;
        }

        const changedInfo = {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim()
        };

        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify(changedInfo)
            );
        } catch (error) {
            alert("정보를 저장할 수 없습니다.");
            return;
        }

        setEmployee({ ...employee, ...changedInfo });
        setIsEditing(false);
    };

    // 상단 이메일 조회 영역
    const emailSearchForm = (
        <div
            className="mypage-card"
            style={{ marginBottom: "16px", padding: "16px 20px" }}
        >
            <form
                onSubmit={searchEmployee}
                style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "end",
                    flexWrap: "wrap"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        flex: "1 1 240px"
                    }}
                >
                    <label htmlFor="mypage-login-email">
                        임시 로그인 이메일
                    </label>

                    <input
                        id="mypage-login-email"
                        type="email"
                        value={searchEmail}
                        onChange={(event) => setSearchEmail(event.target.value)}
                        placeholder="직원 이메일 입력"
                        style={{
                            padding: "9px 10px",
                            border: "1px solid #d9dce5",
                            borderRadius: "6px"
                        }}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="mypage-edit-button"
                >
                    조회
                </button>
            </form>

            {searchError && (
                <p
                    role="alert"
                    style={{ color: "#c0392b", marginBottom: 0 }}
                >
                    {searchError}
                </p>
            )}
        </div>
    );

    // 직원이 존재하지 않는 경우
    if (!employee) {
        return (
            <main className="mypage">
                <h1 className="mypage-title">마이페이지</h1>

                {emailSearchForm}

                <div className="mypage-card">
                    등록된 직원 정보를 찾을 수 없습니다.
                    상단에 직원 이메일을 입력해 주세요.
                </div>
            </main>
        );
    }

    return (
        <main className="mypage">

            <h1 className="mypage-title">마이페이지</h1>

            {/* 이메일 조회 */}
            {emailSearchForm}

            <div className="mypage-card">

                <form onSubmit={saveInfo}>

                    {/* 상단 프로필 */}
                    <div className="mypage-profile">

                        <div className="mypage-avatar">
                            👤
                        </div>

                        <div className="mypage-profile-text">

                            {/* 직원 이름 */}
                            {isEditing ? (
                                <div className="mypage-info-item">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        aria-label="이름"
                                        style={{
                                            width: "220px",
                                            maxWidth: "100%"
                                        }}
                                        maxLength={30}
                                        required
                                    />
                                </div>
                            ) : (
                                <h2>{employee.name}</h2>
                            )}

                            {/* 부서 및 직급 */}
                            <p>
                                {employee.department} · {employee.position}
                            </p>

                        </div>
                    </div>

                    {/* 직원정보 */}
                    <div className="mypage-section">

                        <div className="mypage-section-header">

                            <h3>사원 정보</h3>

                            {!isEditing && (
                                <button
                                    type="button"
                                    className="mypage-edit-button"
                                    onClick={startEdit}
                                >
                                    내 정보 수정
                                </button>
                            )}

                        </div>

                        <div className="mypage-info-grid">

                            {/* 이메일 */}
                            <div className="mypage-info-item">
                                <label htmlFor="mypage-email">
                                    이메일
                                </label>

                                {isEditing ? (
                                    <input
                                        id="mypage-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        maxLength={100}
                                        required
                                    />
                                ) : (
                                    <strong>{employee.email}</strong>
                                )}
                            </div>

                            {/* 전화번호 */}
                            <div className="mypage-info-item">
                                <label htmlFor="mypage-phone">
                                    전화번호
                                </label>

                                {isEditing ? (
                                    <input
                                        id="mypage-phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="010-0000-0000"
                                        maxLength={20}
                                    />
                                ) : (
                                    <strong>
                                        {employee.phone || "미등록"}
                                    </strong>
                                )}
                            </div>

                            {/* 직급 */}
                            <div className="mypage-info-item">
                                <span>직급</span>
                                <strong>{employee.position}</strong>
                            </div>

                            {/* 재직 상태 */}
                            <div className="mypage-info-item">
                                <span>재직 상태</span>
                                <strong>{employee.status}</strong>
                            </div>

                            {/* 입사일 */}
                            <div className="mypage-info-item">
                                <span>입사일</span>
                                <strong>{employee.hireDate}</strong>
                            </div>

                        </div>

                        {/* 저장 및 취소 버튼 */}
                        {isEditing && (
                            <div className="mypage-edit-buttons">

                                <button
                                    type="submit"
                                    className="mypage-save-button"
                                >
                                    저장
                                </button>

                                <button
                                    type="button"
                                    className="mypage-cancel-button"
                                    onClick={() => setIsEditing(false)}
                                >
                                    취소
                                </button>

                            </div>
                        )}

                        {/* 계정 정보: 나중에 로그인 계정 데이터와 연결할 부분 */}
                        <div style={{ marginTop: "28px" }}>
                            <h3>계정 정보</h3>

                            <div className="mypage-info-grid">
                                <div className="mypage-info-item">
                                    <span>직원 번호</span>
                                    <strong>{account?.employeeId != null ? formatEmployeeId(account.employeeId) : "계정 데이터 없음"}</strong>
                                </div>

                                <div className="mypage-info-item">
                                    <span>계정 권한</span>
                                    <strong>{account ? account.role : "계정 데이터 없음"}</strong>
                                </div>

                                <div className="mypage-info-item">
                                    <span>계정 상태</span>
                                    <strong>{account ? account.status : "계정 데이터 없음"}</strong>
                                </div>

                                <div className="mypage-info-item">
                                    <span>최초 비밀번호 변경</span>
                                    <strong>
                                        {account
                                            ? (account.mustChangePassword ? "필요" : "불필요")
                                            : "확인할 계정 없음"}
                                    </strong>
                                </div>

                                {account && (
                                    <div className="mypage-info-item">
                                        <span>계정 생성일 (UTC)</span>
                                        <strong>{account.createdAt.slice(0, 10)}</strong>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 비밀번호 변경 */}
                        <div className="mypage-account">
                            <button
                                type="button"
                                className="mypage-password-button"
                                disabled
                            >
                                🔒 비밀번호 변경
                            </button>
                        </div>

                    </div>

                </form>

            </div>

        </main>
    );
}

export default MyPage;
