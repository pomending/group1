import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import "./loginStyles.css";

export default function LoginPage() {

    const { login } = useERP();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // 로그인 처리
    const handleSubmit = (e) => {
        e.preventDefault();

        const success = login(email, password);

        if (success) {
            navigate("/");
        } else {
            setError("이메일 또는 비밀번호를 확인해주세요.");
        }
    };

    return (
        <main className="login-page">

            {/* 왼쪽 ERP 소개 화면 */}
            <section className="login-intro">
                <div className="login-brand">
                    <span className="login-mark">G</span>
                    <div>
                        <strong>GOODS ERP</strong>
                        <span>Management System</span>
                    </div>
                </div>

                <div className="login-intro-copy">
                    <p className="login-eyebrow">함께하는 업무 관리</p>
                    <h2>
                        흩어진 업무를<br />
                        하나의 흐름으로.
                    </h2>
                    <p>
                        고객부터 프로젝트, 일정까지.<br />
                        우리 팀의 업무를 한곳에서 관리하세요.
                    </p>

                    <div className="login-overview">
                        {["고객 관리", "프로젝트", "일정 관리"].map(label => (
                            <div key={label}>
                                <span className="login-overview-dot" />
                                <strong>{label}</strong>
                                <span className="login-overview-line" />
                            </div>
                        ))}
                    </div>
                </div>

                <p className="login-intro-footer">
                    GOODS ERP · Management System
                </p>
            </section>

            {/* 오른쪽 로그인 화면 */}
            <div className="login-panel">
                <section className="login-card">

                    <div className="login-brand">
                        <span className="login-mark">G</span>
                        <div>
                            <strong>GOODS ERP</strong>
                            <span>Management System</span>
                        </div>
                    </div>

                    <header className="login-heading">
                        <h1>로그인</h1>
                        <p>계정으로 로그인해 업무를 시작하세요.</p>
                    </header>

                    <form className="login-form" onSubmit={handleSubmit}>

                        {/* 이메일 입력 */}
                        <label htmlFor="login-email">이메일</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={e => {
                                setEmail(e.target.value);
                                setError("");
                            }}
                            placeholder="이메일을 입력하세요"
                            autoComplete="username"
                            required
                        />

                        {/* 비밀번호 입력 */}
                        <label htmlFor="login-password">비밀번호</label>
                        <div className="login-password-field">
                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => {
                                    setPassword(e.target.value);
                                    setError("");
                                }}
                                placeholder="비밀번호를 입력하세요"
                                autoComplete="current-password"
                                required
                            />

                            <button
                                type="button"
                                className="login-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "숨기기" : "보기"}
                            </button>
                        </div>

                        {/* 로그인 버튼 */}
                        <button type="submit">로그인</button>

                        {/* 오류 메시지 */}
                        {error && (
                            <p className="login-error" role="alert">
                                {error}
                            </p>
                        )}

                    </form>

                    <p className="login-footer">
                        GOODS ERP · 함께하는 업무 관리
                    </p>

                </section>
            </div>

        </main>
    );
}
