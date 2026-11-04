import React, { useState } from "react";
import { useERP } from "../context/ERPContext";
import { initialAccounts } from "../data/mockAccounts";
import { initialEmployees } from "../data/mockData";
import { formatEmployeeId } from "../utils/formatUtils";
import "./MyPage.css";

// 로그인한 직원의 기본 정보와 로컬에 저장한 수정 정보를 합칩니다.
function loadEmployeeByEmail(loginEmail, basicEmployee) {
    if (!basicEmployee) return null;
    try {
        const saved = localStorage.getItem("erpMyPageInfo_" + loginEmail.trim().toLowerCase());
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
        // 저장된 정보가 없으면 기본 직원 정보를 사용합니다.
    }
    return basicEmployee;
}

// 게시판에서도 로그인한 계정을 확인하도록 기존 로그인 저장 키를 사용합니다.
// 계정 id와 직원 employeeId는 서로 다른 번호입니다.
export function getBoardUser() {
    let accountId;
    try {
        accountId = sessionStorage.getItem("erp_current_user_id");
        if (!accountId) return null;
    } catch (error) {
        return null;
    }

    // Context와 동일한 저장소에서 최신 계정·직원 목록을 읽습니다.
    let accounts = initialAccounts;
    let employees = initialEmployees;
    try {
        const savedAccounts = JSON.parse(localStorage.getItem("erp_accounts") || "null");
        const savedEmployees = JSON.parse(localStorage.getItem("erp_employees") || "null");
        if (Array.isArray(savedAccounts)) accounts = savedAccounts;
        if (Array.isArray(savedEmployees)) employees = savedEmployees;
    } catch (error) {
        // 저장되지 않은 경우 최초 데이터 사용
    }

    const account = accounts.find(item => String(item.id) === String(accountId));
    if (!account || account.status !== "활성") return null;
    const employee = employees.find(item => String(item.id) === String(account.employeeId));
    if (!employee) return null;

    const displayed = loadEmployeeByEmail(employee.email, employee);
    return {
        employeeId: employee.id,
        email: employee.email.toLowerCase(),
        name: displayed.name
    };
}

// 기존 게시글·댓글의 작성자 권한 확인 기능은 그대로 둡니다.
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

function MyPage() {

    // ERPContext에서 실제 로그인한 계정과 직원 정보를 받아옵니다.
    const { currentUser: account, currentEmployee: basicEmployee } = useERP();
    const loginEmail = basicEmployee?.email || "";
    const storageKey = "erpMyPageInfo_" + loginEmail.trim().toLowerCase();

    // 기존 마이페이지의 정보 수정 기능을 유지합니다.
    const [updatedEmployee, setUpdatedEmployee] = useState(null);
    const employee = updatedEmployee?.id === basicEmployee?.id
        ? updatedEmployee
        : loadEmployeeByEmail(loginEmail, basicEmployee);

    // 정보 수정 상태
    const [isEditing, setIsEditing] = useState(false);

    // 수정 입력값
    const [name, setName] = useState(employee?.name || "");
    const [email, setEmail] = useState(employee?.email || "");
    const [phone, setPhone] = useState(employee?.phone || "");

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
        setUpdatedEmployee({ ...employee, ...changedInfo });
        setIsEditing(false);
    };

    // 직원이 존재하지 않는 경우
    if (!employee) {
        return (
            <main className="mypage">
                <h1 className="mypage-title">마이페이지</h1>
                <div className="mypage-card">
                    로그인한 계정의 직원 정보를 찾을 수 없습니다.
                </div>
            </main>
        );
    }
    return (
        <main className="mypage">
            <h1 className="mypage-title">마이페이지</h1>
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
                                    onClick={startEdit}>
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
                                    className="mypage-save-button">
                                    저장
                                </button>
                                <button
                                    type="button"
                                    className="mypage-cancel-button"
                                    onClick={() => setIsEditing(false)}>
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
                                    <strong>
                                        {account?.employeeId != null
                                            ? formatEmployeeId(account.employeeId)
                                            : "계정 데이터 없음"}
                                    </strong>
                                </div>
                                <div className="mypage-info-item">
                                    <span>계정 권한</span>
                                    <strong>
                                        {account
                                            ? account.role
                                            : "계정 데이터 없음"}
                                    </strong>
                                </div>
                                <div className="mypage-info-item">
                                    <span>계정 상태</span>
                                    <strong>
                                        {account
                                            ? account.status
                                            : "계정 데이터 없음"}
                                    </strong>
                                </div>
                                <div className="mypage-info-item">
                                    <span>최초 비밀번호 변경</span>
                                    <strong>
                                        {account
                                            ? (
                                                account.mustChangePassword
                                                    ? "필요"
                                                    : "불필요"
                                            )
                                            : "확인할 계정 없음"}
                                    </strong>
                                </div>
                                {account && (
                                    <div className="mypage-info-item">
                                        <span>계정 생성일 (UTC)</span>
                                        <strong>
                                            {account.createdAt.slice(0, 10)}
                                        </strong>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* 비밀번호 변경 */}
                        <div className="mypage-account">
                            <button
                                type="button"
                                className="mypage-password-button"
                                disabled>
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
