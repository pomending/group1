import React, { useRef, useState } from "react";
import { registerLoginAccount, authenticateLoginAccount } from "./loginStorage";
import "./loginStyles.css";

// 기본 로그인 성공 동작은 대시보드(/) 이동입니다. 라우터 연동 시 onLogin으로 이동 방식을 지정합니다.
export default function LoginPage({ onLogin = () => window.location.assign("/") }) {
  const [isSignup, setIsSignup] = useState(false);
  const [fields, setFields] = useState({ name: "", username: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const pending = useRef(false);

  function changeMode(signup) {
    setShowPassword(false);
    setIsSignup(signup);
    setFields({ name: "", username: "", password: "" });
    setMessage("");
    setError("");
  }

  function updateField(event) {
    setFields(current => ({ ...current, [event.target.name]: event.target.value }));
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (isSignup) {
        const account = await registerLoginAccount(fields);
        setIsSignup(false);
        setShowPassword(false);
        setFields({ name: "", username: account.username, password: "" });
        setMessage("회원가입이 완료되었습니다. 로그인해 주세요.");
      } else {
        const account = await authenticateLoginAccount(fields.username, fields.password);
        setShowPassword(false);
        setFields({ name: "", username: "", password: "" });
        await onLogin(account);
      }
    } catch (error) {
      setError(error.message || "처리하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-intro" aria-label="GOODS ERP 소개">
        <div className="login-brand">
          <span className="login-mark" aria-hidden="true">G</span>
          <div><strong>GOODS ERP</strong><span>Management System</span></div>
        </div>
        <div className="login-intro-copy">
          <p className="login-eyebrow">함께하는 업무 관리</p>
          <h2>흩어진 업무를<br />하나의 흐름으로.</h2>
          <p>고객부터 프로젝트, 일정까지.<br />우리 팀의 업무를 한곳에서 관리하세요.</p>
          <div className="login-overview" aria-hidden="true">
            {["고객 관리", "프로젝트", "일정 관리"].map(label => <div key={label}><span className="login-overview-dot" /><strong>{label}</strong><span className="login-overview-line" /></div>)}
          </div>
        </div>
        <p className="login-intro-footer">GOODS ERP · Management System</p>
      </section>
      <div className="login-panel">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="login-mark" aria-hidden="true">G</span>
          <div>
            <strong>GOODS ERP</strong>
            <span>Management System</span>
          </div>
        </div>

        <header className="login-heading">
          <h1 id="login-title">{isSignup ? "회원가입" : "로그인"}</h1>
          <p>{isSignup ? "사용할 계정 정보를 입력해 주세요." : "계정으로 로그인해 업무를 시작하세요."}</p>
        </header>

        <div className="login-mode" role="group" aria-label="계정 메뉴">
          <button type="button" aria-pressed={!isSignup} disabled={busy} onClick={() => changeMode(false)}>로그인</button>
          <button type="button" aria-pressed={isSignup} disabled={busy} onClick={() => changeMode(true)}>회원가입</button>
        </div>
        <form className="login-form" onSubmit={handleSubmit} aria-busy={busy}>
          {isSignup && <>
            <label htmlFor="signup-name">이름</label>
            <input id="signup-name" name="name" value={fields.name} onChange={updateField} disabled={busy}
              autoComplete="name" placeholder="이름을 입력하세요" maxLength={30} required />
          </>}
          <label htmlFor="login-id">아이디</label>
          <input id="login-id" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
            value={fields.username} onChange={updateField} disabled={busy} maxLength={20}
            aria-describedby={isSignup ? "signup-id-hint" : undefined} placeholder="아이디를 입력하세요" required />
          {isSignup && <small id="signup-id-hint" className="login-hint">영문·숫자·밑줄 4~20자, 대소문자 구분 없음</small>}

          <label htmlFor="login-password">비밀번호</label>
          {/* 표시 방식만 바꾸며 입력값은 유지합니다. 보기 버튼은 폼을 제출하지 않습니다. */}
          <div className="login-password-field">
          <input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"}
            value={fields.password} onChange={updateField} disabled={busy} maxLength={128} minLength={isSignup ? 8 : undefined}
            aria-describedby={isSignup ? "signup-password-hint" : undefined} placeholder="비밀번호를 입력하세요" required />
          <button type="button" className="login-password-toggle" disabled={busy}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} aria-pressed={showPassword} aria-controls="login-password"
            onClick={() => setShowPassword(current => !current)}>{showPassword ? "숨기기" : "보기"}</button>
          </div>
          {isSignup && <small id="signup-password-hint" className="login-hint">8자 이상 입력해 주세요.</small>}

          <button type="submit" disabled={busy}>{busy ? "처리 중…" : isSignup ? "가입하기" : "로그인"}</button>
          {error && <p className="login-error" role="alert">{error}</p>}
          <p className="login-message" role="status">{message}</p>
        </form>

        <p className="login-footer">GOODS ERP · 함께하는 업무 관리</p>
      </section>
      </div>
    </main>
  );
}
