/* [파일 안내] 프로젝트·팀원 목록과 팀원 등록 입력
 * 입력: Manager의 일정·팀원 목록과 등록·제외 콜백
 * 구성: 위쪽은 목록, 아래 ScheduleTeamEditor는 이 화면 전용 입력 부품입니다.
 * 출력: 프로젝트 선택·팀원 등록·제외 → Manager → 관련 상태 훅
 */

/* [목록의 이름과 실제 저장 자료를 구분하기]
 * 프로젝트 목록은 일정에 적힌 프로젝트명을 모은 결과입니다. 다른 파트의 프로젝트 데이터베이스가 아닙니다.
 * 팀원 목록은 별도로 등록된 teamMembers 배열이며, 단순히 과거 일정에 이름이 있다고 자동 등록하지 않습니다.
 * uniqueNames는 빈 이름과 중복을 제거하고 한글 이름순으로 정렬하는 작은 함수입니다.
 * 선택한 사람의 담당 프로젝트를 찾을 때는 person을 비교하며 참석자만인 경우에는 포함하지 않습니다.
 * 프로젝트 버튼은 이름 전체가 같은 항목으로 이동하므로 test와 test2를 서로 다른 프로젝트로 처리합니다.
 */
import React, { useState } from "react";
import { ScheduleIcon } from "./ScheduleItemParts";

// 빈 값·중복 이름을 제거하고 한글 이름순으로 정렬합니다. 앞뒤 공백 정리는 이 함수에서 하지 않습니다.
function uniqueNames(names) {
  return [...new Set(names.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
}

export default function ScheduleDirectory({
  mode,
  items,
  teamMembers,
  onAddTeamMember,
  onRemoveTeamMember,
  selectedProject,
  onSelectProject,
  onClose,
}) {
  // null이면 모두 접힌 상태입니다. 이름 하나만 저장하므로 여러 팀원이 동시에 펼쳐지지 않습니다.
  const [selectedPerson, setSelectedPerson] = useState(null);
  // 프로젝트명은 일정에서 모으고, 사람 이름은 별도 등록 목록을 사용합니다.
  const isPeople = mode === "people";
  const names = isPeople ? teamMembers : uniqueNames(items.map(item => item.project));
  // filter는 담당 일정만 남기고 map은 그 일정의 프로젝트 이름을 꺼냅니다.
  // 참석한 일정은 담당 프로젝트에 포함하지 않습니다.
  const assignedProjects = uniqueNames(items
    .filter((item) => item.person.trim() === selectedPerson)
    .map((item) => item.project));
  // 팀원 이름을 누르면 해당 팀원의 담당 프로젝트만 펼칩니다. 다시 누르면 접습니다.
  // 이 상태는 목록의 펼침 표시용이며 실제 팀원·일정 데이터에는 저장되지 않습니다.
  function togglePerson(name) {
    setSelectedPerson(current => current === name ? null : name);
  }
  // 프로젝트명만 나열하는 대신 저장된 일정 수와 담당자를 요약합니다.
  // 반복 일정은 원본 규칙 한 건으로 세며, 버튼은 두 목록에서 같은 이동 콜백을 호출합니다.
  // 프로젝트별 목록을 한 번 만들어 카드마다 전체 일정을 다시 검색하지 않습니다.
  const schedulesByProject = new Map();
  for (const item of items) {
    if (!schedulesByProject.has(item.project)) schedulesByProject.set(item.project, []);
    schedulesByProject.get(item.project).push(item);
  }
  const renderProject = (project) => {
    // ===로 이름 전체를 비교합니다. 예를 들어 test 선택에 test2의 일정은 포함되지 않습니다.
    const schedules = schedulesByProject.get(project) || [];
    const people = uniqueNames(schedules.map((item) => item.person));
    // aria-pressed는 현재 선택 여부를 보조 기기에 알려 주며 CSS의 선택 배경에도 사용합니다.
    // () => ...로 함수를 감싸야 렌더링할 때가 아니라 실제 클릭할 때 부모 함수가 실행됩니다.
    return (
      <button
        type="button"
        className="sm-directory-project-button"
        aria-label={`${project} 프로젝트 일정 보기`}
        aria-pressed={selectedProject === project}
        onClick={() => onSelectProject(project)}
      >
        {/* ScheduleIcon은 여러 곳에서 같은 모양의 아이콘을 쓰기 위한 작은 화면 부품입니다.
            name에 projects를 전달하면 프로젝트 아이콘을 그립니다. 프로젝트 이름은 옆에 이미
            글자로 있으므로 aria-hidden으로 장식 아이콘을 음성 안내에서 제외합니다. */}
        <span className="sm-directory-project-symbol" aria-hidden="true"><ScheduleIcon name="projects" /></span>
        <span className="sm-directory-project-info">
          <strong>{project}</strong>
          {/* join은 이름 배열을 표시용 문자열로 합칩니다. 빈 배열이면 || 뒤의 안내를 사용합니다. */}
          <small>등록 일정 {schedules.length}건 · {people.join(", ") || "담당자 미지정"}</small>
        </span>
        <span className="sm-directory-project-arrow" aria-hidden="true"><ScheduleIcon name="arrow" /></span>
      </button>
    );
  };

  return (
    <section className="sm-card" aria-labelledby="sm-directory-title">
      <div className="sm-panel-title">
        <h3 id="sm-directory-title">{isPeople ? "팀원 목록" : "프로젝트 목록"}</h3>
        <button type="button" className="sm-close" aria-label="목록 닫기" onClick={onClose}>×</button>
      </div>
      <p className="sm-search-summary">{isPeople ? `등록된 팀원 ${names.length}명 · 이름을 누르면 담당 프로젝트가 표시됩니다.` : `직접 등록한 일정의 프로젝트 ${names.length}개 · 프로젝트 관리의 전체 목록과는 다릅니다.`}</p>
      {isPeople && <ScheduleTeamEditor onAdd={onAddTeamMember} />}
      <ul className="sm-directory-list">
        {/* uniqueNames로 이름 중복을 제거했으므로 name을 각 li의 고유 key로 사용할 수 있습니다.
            팀원 모드에서는 이름 버튼과 담당 프로젝트를, 프로젝트 모드에서는 프로젝트 카드를 만듭니다. */}
        {names.map((name) => (
          <li key={name}>
            {isPeople && (
              <>
                <button
                  type="button"
                  className="sm-directory-person"
                  aria-expanded={selectedPerson === name}
                  // 같은 사람을 다시 누르면 접고, 다른 사람을 누르면 그 사람을 펼칩니다.
                  onClick={() => togglePerson(name)}
                >
                  {/* 첫 글자 아바타는 장식이므로 숨기고, 옆의 전체 이름만 화면 읽기 도구에 전달합니다. */}
                  <span className="sm-person-avatar" aria-hidden="true">{name.slice(0, 1)}</span>
                  <span className="sm-person-name">{name}</span>
                  <span aria-hidden="true">{selectedPerson === name ? "−" : "+"}</span>
                </button>
                {/* 선택한 한 사람의 프로젝트만 펼칩니다. 같은 이름을 다시 누르면 접힙니다. */}
                {selectedPerson === name && (
                  <div className="sm-directory-projects">
                    <strong>담당 프로젝트 {assignedProjects.length}개</strong>
                    {assignedProjects.length > 0 && (
                      <ul>{assignedProjects.map((project) => <li key={project}>{renderProject(project)}</li>)}</ul>
                    )}
                    {assignedProjects.length === 0 && <p>담당자로 등록된 프로젝트 일정이 없습니다.</p>}
                    <button type="button" className="sm-delete-btn" aria-label={`${name} 팀원 목록에서 제외`}
                      onClick={() => onRemoveTeamMember(name)}>팀원 목록에서 제외</button>
                  </div>
                )}
              </>
            )}
            {!isPeople && renderProject(name)}
          </li>
        ))}
      </ul>
      {/* 배열 길이가 0일 때만 안내합니다. 빈 목록도 오류 없이 하나의 정상 화면으로 취급합니다. */}
      {!names.length && <div className="sm-empty">{isPeople
        ? "등록된 팀원이 없습니다. 위의 새 팀원 이름 입력란에서 등록해 주세요."
        : "일정에 등록된 프로젝트가 없습니다. 업무 일정의 프로젝트 분류에서 추가해 주세요."}</div>}
    </section>
  );
}

/* 일정 입력과 팀원 등록은 다른 작업입니다.
 * 이름을 입력하고 등록 버튼을 눌렀을 때만 부모가 팀원 목록에 추가합니다.
 * onAdd는 성공하면 빈 문자열, 실패하면 안내 문장을 돌려줍니다. */
function ScheduleTeamEditor({ onAdd }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // 팀원 등록 버튼 또는 Enter → 부모의 onAdd 검증 → 오류 표시 또는 입력창 비우기 순서입니다.
  // 이름을 타이핑하는 것만으로는 등록하지 않습니다.
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
