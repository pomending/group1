import React, { useState } from "react";
import ScheduleTeamEditor from "./ScheduleTeamEditor";
import ScheduleIcon from "./ScheduleIcon";

/* props와 state를 이 화면에 대입해 보기
 * - props의 items: 부모가 보관하는 전체 일정입니다. 이 컴포넌트에서 마음대로 수정하지 않습니다.
 * - props의 mode: 프로젝트 목록인지 팀원 목록인지 결정하는 값입니다.
 * - props의 selectedProject: 부모가 선택해 둔 프로젝트입니다. 선택한 카드 색을 표시하는 데 사용합니다.
 * - state의 selectedPerson: 이 목록에서 현재 펼쳐 둔 팀원입니다. 펼침 상태는 이 파일만 필요합니다.
 *
 * 팀원 '김담당'을 누르는 경우:
 * ① selectedPerson이 null이었다면 setSelectedPerson('김담당')으로 바꿉니다.
 * ② 다시 렌더링하면서 for문으로 담당자가 '김담당'인 일정을 찾습니다.
 * ③ 그 일정의 프로젝트명을 배열에 모으고 uniqueNames로 중복을 없앱니다.
 * ④ selectedPerson === name이 참인 팀원 아래에만 프로젝트 버튼을 표시합니다.
 *
 * 그 아래 프로젝트를 누르는 경우:
 * ① onSelectProject(project)로 부모에게 프로젝트명을 전달합니다.
 * ② Manager가 이동할 날짜를 계산하고 selectedProject와 selectedDate를 바꿉니다.
 * ③ 새 props를 받은 이 목록의 선택 배경과 Sidebar의 '선택한 날짜 일정'이 함께 바뀝니다.
 * 자식이 부모에게 직접 접근하는 대신 부모가 준 함수를 호출하는 방식입니다.
 */
/* 목록의 데이터 흐름
 * 프로젝트는 원본 items에서 추리고, 팀원은 별도 teamMembers에서 가져옵니다.
 * 이 파일은 어떤 팀원을 펼칠지만 관리하며, 날짜 이동과 프로젝트 선택은 Manager가 처리합니다.
 */
// 팀원은 별도 등록 목록만 표시합니다. 다른 파트의 프로젝트/직원 데이터를 수정하지 않습니다.
// 이미 결과 배열에 있는 이름은 넣지 않습니다. 마지막 sort는 한글 이름순으로 정렬합니다.
function uniqueNames(names) {
  const result = [];
  for (const name of names) {
    if (name && !result.includes(name)) result.push(name);
  }
  return result.sort((a, b) => a.localeCompare(b, "ko"));
}

export default function ScheduleDirectory({ mode, items, teamMembers, onAddTeamMember, onRemoveTeamMember, selectedProject, onSelectProject, onClose }) {
  // null이면 모두 접힌 상태입니다. 이름 하나만 저장하므로 여러 팀원이 동시에 펼쳐지지 않습니다.
  const [selectedPerson, setSelectedPerson] = useState(null);
  // 프로젝트명은 일정에서 모으고, 사람 이름은 별도 등록 목록을 사용합니다.
  const isPeople = mode === "people";
  const listNames = [];
  const assignedNames = [];
  for (const item of items) {
    if (!isPeople) listNames.push(item.project);
    if (item.person.trim() === selectedPerson) assignedNames.push(item.project);
  }
  let names = uniqueNames(listNames);
  if (isPeople) names = teamMembers;
  // '담당 프로젝트'는 등록한 팀원의 이름과 담당자 필드가 일치하는 것만 셉니다.
  // 참석만 한 프로젝트를 담당 프로젝트로 잘못 표시하지 않기 위해 두 역할을 구분합니다.
  const assignedProjects = uniqueNames(assignedNames);
  function togglePerson(name) {
    if (selectedPerson === name) setSelectedPerson(null);
    else setSelectedPerson(name);
  }
  // 프로젝트명만 나열하는 대신 저장된 일정 수와 담당자를 요약합니다.
  // 반복 일정은 원본 규칙 한 건으로 세며, 버튼은 두 목록에서 같은 이동 콜백을 호출합니다.
  const renderProject = (project) => {
    // ===로 이름 전체를 비교합니다. 예를 들어 test 선택에 test2의 일정은 포함되지 않습니다.
    const schedules = items.filter((item) => item.project === project);
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
    <section className="sm-card sm-directory" aria-labelledby="sm-directory-title">
      <div className="sm-panel-title">
        <h3 id="sm-directory-title">{isPeople ? "팀원 목록" : "프로젝트 목록"}</h3>
        <button type="button" className="sm-close" aria-label="목록 닫기" onClick={onClose}>×</button>
      </div>
      <p className="sm-search-summary">{isPeople ? `등록된 팀원 ${names.length}명 · 이름을 누르면 담당 프로젝트가 표시됩니다.` : `일정에 등록된 프로젝트 ${names.length}개`}</p>
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
                  {/* slice(0, 1)은 이름의 첫 글자만 꺼냅니다. 별도 사진을 저장하지 않고도 각 팀원을
                      찾기 쉽게 만드는 장식입니다. 전체 이름은 다음 span에 그대로 보여 주므로
                      첫 글자는 aria-hidden으로 숨겨 화면 읽기 도구가 이름을 두 번 읽지 않게 합니다. */}
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
                    {assignedProjects.length === 0 && <p>담당자로 배정된 프로젝트가 없습니다.</p>}
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
      {!names.length && <div className="sm-empty">{isPeople ? "등록된 팀원이 없습니다." : "일정에 등록된 프로젝트가 없습니다."}</div>}
    </section>
  );
}
