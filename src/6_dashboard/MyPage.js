
import React, { useState } from "react";
import "./MyPage.css";

function MyPage() {

    // 예시 사원 정보
    const basicEmployee = {
        number: "EMP-0001",
        name: "홍길동",
        department: "디자인팀",
        position: "사원",
        username: "hong1",
        email: "hing@gmail.com",
        phone: "",
        role: "일반 사원"
    };

    // 저장된 정보 불러오기
    const [employee, setEmployee] = useState(() => {
        try {
            const saved = localStorage.getItem("erpMyPageInfo");

            if (saved) {
                const info = JSON.parse(saved);

                return {
                    ...basicEmployee,
                    name: info.name || basicEmployee.name,
                    email: info.email || basicEmployee.email,
                    phone: info.phone || ""
                };
            }
        } catch (error) {
            // 저장된 정보가 없거나 잘못된 경우 기본값 사용
        }

        return basicEmployee;
    });

    // 수정 상태
    const [isEditing, setIsEditing] = useState(false);

    // 수정할 정보
    const [name, setName] = useState(employee.name);
    const [email, setEmail] = useState(employee.email);
    const [phone, setPhone] = useState(employee.phone);

    // 수정 버튼
    const startEdit = () => {
        setName(employee.name);
        setEmail(employee.email);
        setPhone(employee.phone);
        setIsEditing(true);
    };

    // 저장 버튼
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
                "erpMyPageInfo",
                JSON.stringify(changedInfo)
            );
        } catch (error) {
            alert("정보를 저장할 수 없습니다.");
            return;
        }

        setEmployee({ ...employee, ...changedInfo });
        setIsEditing(false);
    };

    return (
        <main className="mypage">

            <h1 className="mypage-title">마이페이지</h1>

            <div className="mypage-card">

                <form onSubmit={saveInfo}>

                    {/* 상단 프로필 */}
                    <div className="mypage-profile">

                        <div className="mypage-avatar">👤</div>

                        <div className="mypage-profile-text">

                            {/* 수정 중에는 이름을 입력할 수 있음 */}
                            {isEditing ? (
                                <div className="mypage-info-item">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        aria-label="이름"
                                        style={{ width: "220px", maxWidth: "100%" }}
                                        maxLength={30}
                                        required
                                    />
                                </div>
                            ) : (
                                <h2>{employee.name}</h2>
                            )}

                            <p>
                                {employee.department} · {employee.position}
                            </p>

                            <span>사원 번호 {employee.number}</span>

                        </div>
                    </div>

                    {/* 사원 정보 */}
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

                            {/* 아이디 */}
                            <div className="mypage-info-item">
                                <span>아이디</span>
                                <strong>{employee.username}</strong>
                            </div>

                            {/* 이메일 */}
                            <div className="mypage-info-item">
                                <label htmlFor="mypage-email">이메일</label>

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
                                <label htmlFor="mypage-phone">전화번호</label>

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
                                    <strong>{employee.phone || "미등록"}</strong>
                                )}
                            </div>

                            {/* 직급 */}
                            <div className="mypage-info-item">
                                <span>직급</span>
                                <strong>{employee.position}</strong>
                            </div>

                            {/* 계정 권한 */}
                            <div className="mypage-info-item">
                                <span>계정 권한</span>
                                <strong>{employee.role}</strong>
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
