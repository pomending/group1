/* [팀원 등록 입력칸의 상태]
 * name은 지금 입력 중인 이름, error는 등록 실패 안내입니다. 둘 다 이 입력칸 안에서만 사용합니다.
 * onAdd(name)는 부모에게 등록을 부탁하고 결과 문구를 받습니다. 빈 문자열이면 성공이라는 약속입니다.
 * 성공했을 때만 입력칸을 비우며, 실패하면 이름을 남겨 사용자가 바로 고칠 수 있게 합니다.
 * 한글 조합 중 Enter는 글자 완성에 쓰일 수 있으므로 isComposing일 때 등록을 실행하지 않습니다.
 * 이 부품은 팀원 목록의 직접 등록용입니다. 일정 폼에서는 일정 저장 성공 시 새 담당자를 별도로 등록합니다.
 * 아래 loadTeamMembers는 이미 저장된 명단을 읽는 함수이며 과거 일정의 이름을 마음대로 팀원으로 옮기지 않습니다.
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

// 저장된 등록 명단(members)과 제외 명단(excluded)을 함께 읽습니다. 없으면 각각 빈 배열입니다.
// 제외한 이름은 새 일정을 저장해도 자동 등록되지 않고, 팀원 목록에서 직접 재등록해야 합니다.
// 자료를 읽지 못하면 readError=true로 돌려줘 Manager가 손상된 원본에 자동 저장하지 않게 합니다.
export function loadTeamMembers() {
  try {
    const saved = JSON.parse(localStorage.getItem("made-mate-schedule-team") || "[]");
    if (!Array.isArray(saved)) throw new Error("Invalid team data");
    const excluded = JSON.parse(localStorage.getItem("made-mate-excluded-team") || "[]");
    if (!Array.isArray(excluded) || excluded.some(name => typeof name !== "string")) throw new Error("Invalid excluded team");
    const members = [];
    for (const name of saved) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 30) {
        throw new Error("Invalid team member");
      }
      if (!members.includes(name.trim())) members.push(name.trim());
    }
    members.sort((a, b) => a.localeCompare(b, "ko"));
    return { members, excluded, readError: false };
  } catch {
    return { members: [], excluded: [], readError: true };
  }
}
