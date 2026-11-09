import { useNavigate } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import { useState } from "react";
import "./ChangePasswordPage.css";

function ChangePasswordPage() {
    const { currentUser, changePassword } = useERP();
    const navi = useNavigate();
    const [prevPwd, setPrevPwd] = useState("");
    const [nextPwd1, setNextPwd1] = useState("");
    const [nextPwd2, setNextPwd2] = useState("");

    const handleChangePassword = (e) => {
        e.preventDefault();

        const result = changePassword(currentUser.id, prevPwd, nextPwd1, nextPwd2);

        if (result.ok) {
            alert("비밀번호 변경에 성공했습니다.");
            navi("/", { replace: true });
        } else {
            alert(result.message);
        }
    };

    return (
        <main className="cp-page">
            <div className="cp-container">
                <div className="cp-brand" aria-label="GOODS ERP">
                    <span className="cp-brand-mark" aria-hidden="true">G</span>
                    <div className="cp-brand-text">
                        <strong>GOODS ERP</strong>
                        <span>Management System</span>
                    </div>
                </div>

                <section className="cp-card" aria-labelledby="cp-heading">
                    <div className="cp-card-top">
                        <span className="cp-lock-icon" aria-hidden="true">
                            <svg width="25" height="25" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4.5" y="10" width="15" height="11" rx="2" />
                                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                                <path d="M12 14.5v2.5" />
                            </svg>
                        </span>
                        <span className="cp-tag">계정 보안</span>
                    </div>

                    <header className="cp-header">
                        <h1 id="cp-heading">비밀번호 변경</h1>
                        <p>계정 보호를 위해 비밀번호를 새로 설정해주세요.<br />변경을 완료하면 ERP를 이용할 수 있습니다.</p>
                    </header>

                    <form className="cp-form" onSubmit={handleChangePassword}>
                        <div className="cp-field">
                            <label htmlFor="cp-prev-pwd">현재 비밀번호</label>
                            <input
                                id="cp-prev-pwd"
                                type="password"
                                placeholder="현재 비밀번호를 입력하세요"
                                value={prevPwd}
                                onChange={(e) => setPrevPwd(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <div className="cp-field">
                            <label htmlFor="cp-next-pwd">새 비밀번호</label>
                            <input
                                id="cp-next-pwd"
                                type="password"
                                placeholder="변경할 비밀번호를 입력하세요"
                                value={nextPwd1}
                                onChange={(e) => setNextPwd1(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <div className="cp-field">
                            <label htmlFor="cp-next-pwd-confirm">새 비밀번호 확인</label>
                            <input
                                id="cp-next-pwd-confirm"
                                type="password"
                                placeholder="새 비밀번호를 다시 입력하세요"
                                value={nextPwd2}
                                onChange={(e) => setNextPwd2(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <p className="cp-note">새 비밀번호는 현재 비밀번호와 다르게 설정해주세요.</p>
                        <button className="cp-submit" type="submit">비밀번호 변경 완료</button>
                    </form>
                </section>

                <p className="cp-footer">GOODS ERP · 함께하는 업무 관리</p>
            </div>
        </main>
    );
}

export default ChangePasswordPage;
