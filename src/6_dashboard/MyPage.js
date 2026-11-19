import React, { useEffect, useRef, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useERP } from "../context/ERPContext";
import { initialAccounts } from "../data/mockAccounts";
import { initialEmployees } from "../data/mockData";
import { formatEmployeeId } from "../utils/formatUtils";
import "./MyPage.css";

function readList(key, fallback) {
    try {
        const list = JSON.parse(localStorage.getItem(key) || "null");
        return Array.isArray(list) ? list : fallback;
    } catch {
        return fallback;
    }
}

// 게시판의 작성자 확인에 사용합니다. 계정 ID와 직원 ID는 별개입니다.
export function getBoardUser() {
    let accountId;
    try {
        accountId = sessionStorage.getItem("erp_current_user_id");
    } catch {
        return null;
    }
    if (!accountId) return null;

    const accounts = readList("erp_accounts", initialAccounts);
    const employees = readList("erp_employees", initialEmployees);
    const account = accounts.find(item => String(item.id) === String(accountId));
    if (!account || account.status !== "활성") return null;

    const employee = employees.find(item => String(item.id) === String(account.employeeId));
    if (!employee) return null;
    return {
        employeeId: employee.id,
        email: String(employee.email).trim().toLowerCase(),
        name: employee.name
    };
}

export function isBoardAuthor(item, user) {
    if (!item || !user) return false;
    if (item.authorEmployeeId != null) {
        return String(item.authorEmployeeId) === String(user.employeeId);
    }
    return Boolean(item.authorEmail &&
        String(item.authorEmail).trim().toLowerCase() === user.email);
}

function getProfilePhoto(employeeId) {
    try {
        return employeeId == null ? "" : localStorage.getItem(`erpProfilePhoto_${employeeId}`) || "";
    } catch {
        return "";
    }
}

function MyPage() {

    const {
        currentUser: account,
        currentEmployee,
        logout,
        changePassword,
        updateEmployee
    } = useERP();

    const employeeId = account?.employeeId;

    const photoInputRef = useRef(null);
    const [photo, setPhoto] = useState(() => getProfilePhoto(employeeId));

    const employee = currentEmployee;

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(employee?.name || "");
    const [email, setEmail] = useState(employee?.email || "");
    const [phone, setPhone] = useState(employee?.phone || "");
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => setPhoto(getProfilePhoto(employeeId)), [employeeId]);

    // 프로필 사진을 중앙 정사각형으로 자르고 저장합니다.
    const changeProfilePhoto = event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || employeeId == null) return;
        if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
            return alert("JPG, PNG, WEBP, GIF 이미지 파일을 선택해 주세요.");
        }
        if (file.size > 10 * 1024 * 1024) return alert("10MB 이하의 이미지를 선택해 주세요.");

        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = canvas.height = 256;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                const size = Math.min(image.width, image.height);
                ctx.fillStyle = "#e9e5ff";
                ctx.fillRect(0, 0, 256, 256);
                ctx.drawImage(image, (image.width - size) / 2, (image.height - size) / 2,
                    size, size, 0, 0, 256, 256);
                try {
                    const value = canvas.toDataURL("image/jpeg", 0.85);
                    localStorage.setItem(`erpProfilePhoto_${employeeId}`, value);
                    setPhoto(value);
                    window.dispatchEvent(new Event("erpProfilePhotoChanged"));
                } catch {
                    alert("프로필 사진을 저장할 수 없습니다.");
                }
            };
            image.onerror = () => alert("이미지를 열 수 없습니다.");
            image.src = reader.result;
        };
        reader.onerror = () => alert("이미지 파일을 읽을 수 없습니다.");
        reader.readAsDataURL(file);
    };

    const startEdit = () => {
        setName(employee.name);
        setEmail(employee.email);
        setPhone(employee.phone || "");
        setIsEditing(true);
    };

    const saveInfo = event => {
        event.preventDefault();

        if (!employee) {
            return;
        }

        const result = updateEmployee({
            id: employee.id,
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim()
        });

        if (!result.ok) {
            alert(result.message);
            return;
        }

        setIsEditing(false);
    };

    const closePasswordForm = () => {
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    // 비밀번호는 로컬에 직접 저장하지 않고 Context에서 변경합니다.
    const handleChangePassword = () => {
        
        if (!account) return;

        const result = changePassword(
            account.id,
            currentPassword,
            newPassword,
            confirmPassword
        );
        
        if (!result.ok) {
            alert(result.message);
            return;
        }
        
        closePasswordForm();
        alert("비밀번호가 변경되었습니다.");
    };

    const handleLogout = () => {
        logout();
        alert("로그아웃되었습니다.");
    };

    // 직원이 존재하지 않는 경우
    if (!employee) {
        return (
            <main className="mypage">
                <PageHeader
                    eyebrow="MY PAGE"
                    title="마이페이지"
                    description="내 정보와 계정 설정을 관리합니다."
                />
                <div className="mypage-card">
                    로그인한 계정의 직원 정보를 찾을 수 없습니다.
                </div>
            </main>
        );
    }
    return (
        <main className="mypage">
            <PageHeader
                    eyebrow="MY PAGE"
                    title="마이페이지"
                    description="내 정보와 계정 설정을 관리합니다."
                />
            <div className="mypage-card">
                <form onSubmit={saveInfo}>
                    {/* 상단 프로필 */}
                    <div className="mypage-profile">
                        <button
                            type="button"
                            className="mypage-avatar"
                            aria-label="프로필 사진 등록 또는 변경"
                            title="사진을 누르면 프로필 사진을 변경할 수 있습니다."
                            onClick={() => photoInputRef.current?.click()}>
                            {photo ? <img src={photo} alt="" /> : "👤"}
                        </button>
                        <input
                            ref={photoInputRef}
                            className="mypage-photo-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={changeProfilePhoto}
                            aria-label="프로필 사진 파일 선택" />
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
                                        required />
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
                                        required />
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
                                        required
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
                        {/* 실제 로그인 계정 정보 */}
                        <div className="mypage-account-section">
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
                        {/* 계정 관리 버튼 */}
                        <div className="mypage-account">
                            <button
                                type="button"
                                className="mypage-password-button"
                                onClick={() => showPasswordForm ? closePasswordForm() : setShowPasswordForm(true)}>
                                🔒 비밀번호 변경
                            </button>
                            <button type="button" className="mypage-logout-button" onClick={handleLogout}>
                                로그아웃
                            </button>
                        </div>
                        {/* 비밀번호 변경 입력창 */}
                        {showPasswordForm && (
                            <div className="mypage-password-panel">
                                <h4>비밀번호 변경</h4>
                                <div className="mypage-password-fields" onKeyDown={(e) => {
                                    if (e.key === "Enter" && e.target.tagName === "INPUT") {
                                        e.preventDefault();
                                        handleChangePassword();
                                    }
                                }}>
                                    <div className="mypage-password-field">
                                        <label htmlFor="mypage-current-password">현재 비밀번호</label>
                                        <input
                                            id="mypage-current-password"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            autoComplete="current-password" />
                                    </div>
                                    <div className="mypage-password-field">
                                        <label htmlFor="mypage-new-password">새 비밀번호</label>
                                        <input
                                            id="mypage-new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            autoComplete="new-password" />
                                    </div>
                                    <div className="mypage-password-field">
                                        <label htmlFor="mypage-confirm-password">새 비밀번호 확인</label>
                                        <input
                                            id="mypage-confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            autoComplete="new-password" />
                                    </div>
                                </div>
                                <div className="mypage-password-actions">
                                    <button type="button" onClick={closePasswordForm}>취소</button>
                                    <button type="button" className="mypage-password-save" onClick={handleChangePassword}>변경하기</button>
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </main>
    );
}

export default MyPage;
