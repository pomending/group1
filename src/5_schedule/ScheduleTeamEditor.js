/* 팀원 추가 입력 폼입니다.
 * 입력값을 상위 컴포넌트의 검증 함수에 전달하고 오류 메시지를 표시합니다.
 */
import React, { useState } from "react";

/* 일정 입력과 팀원 등록은 다른 작업입니다.
 * 이름을 입력하고 등록 버튼을 눌렀을 때만 부모가 팀원 목록에 추가합니다.
 * onAdd는 성공하면 빈 문자열, 실패하면 안내 문장을 돌려줍니다. */
export default function ScheduleTeamEditor({ onAdd }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function addMember() {
    const message = onAdd(name);
    setError(message);
    if (!message) setName("");
  }

  return (
    <div className="sm-team-editor">
      <label>새 팀원 이름
        <input value={name} maxLength={30} onKeyDown={(event) => {
          // 등록창 안에서도 Enter가 일정 저장으로 이어지지 않고 팀원 등록만 실행되게 합니다.
          if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
          event.preventDefault();
          addMember();
        }} onChange={(event) => {
          setName(event.target.value);
          setError("");
        }} />
      </label>
      <button type="button" className="sm-secondary-btn" onClick={addMember}>팀원 등록</button>
      {error && <p className="sm-form-error" role="alert">{error}</p>}
    </div>
  );
}
