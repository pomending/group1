/* [파일 안내] 일정 카드·배지·즐겨찾기·동작 버튼 공통 부품
 * 사용처: Calendar·Sidebar·FormModal·StaffWeek·Directory
 * 입력: 일정 item과 부모에서 받은 콜백
 * 출력: 선택·즐겨찾기·수정·삭제·상태 변경 요청을 부모로 전달합니다.
 * 화면 모양은 scheduleStyles.css의 같은 sm- 클래스에서 수정합니다.
 */

/* 카드 선택과 별표는 형제 버튼으로 분리합니다. 배지는 표시용이며 접근 권한을 제한하지 않습니다. */
import React from "react";
import {
  normalizeAttendees,
  scheduleStatuses,
  getScheduleTime,
} from "./scheduleData";

/* 여러 보기가 같은 카드·배지·조작 부품을 사용합니다. 색상은 --sm-event-color로 전달하며 데이터 변경은 부모 콜백에 맡깁니다. */
// 상태 코드로 표시 문구를 찾습니다. 없는 코드면 첫 항목인 '예정'을 사용합니다.
// 배지·툴팁·선택창이 이 함수를 공유하므로 같은 상태를 서로 다르게 표시하지 않습니다.
function getStatusOption(status) {
  for (const option of scheduleStatuses) {
    if (option.value === status) return option;
  }
  return scheduleStatuses[0];
}

// 공통 상태 정의로 배지와 선택창의 문구를 맞춥니다. 색상만으로 구분하지 않고 텍스트도 표시합니다.
export function ScheduleStatus({ status }) {
  const option = getStatusOption(status);
  return (
    <span className={`sm-status-badge ${option.value}`} title={option.label}>
      {option.label}
    </span>
  );
}

// 공개 범위는 진행 상태와 다른 정보입니다. 색뿐 아니라 글자로도 구분합니다.
// 이 배지는 저장된 분류를 표시하며, 로그인 사용자별 접근 권한을 검사하는 기능은 아닙니다.
export function ScheduleVisibility({ visibility }) {
  let label = "회사 공유";
  let scopeClass = "sm-visibility";
  if (visibility === "private") {
    label = "개인 표시";
    scopeClass = "sm-visibility private";
  }
  return <span className={scopeClass} title={`공유 구분: ${label}`}>{label}</span>;
}

// 별표는 여러 화면에서 같은 저장 함수를 사용합니다. 클릭이 날짜 칸으로 전파되지 않게 막습니다.
export function ScheduleFavorite({ item, onToggleFavorite }) {
  return (
    <button type="button" className="sm-favorite-btn" aria-pressed={Boolean(item.isFavorite)}
      aria-label={`${item.title} 즐겨찾기 ${item.isFavorite ? "해제" : "추가"}`}
      title={item.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      onDoubleClick={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onToggleFavorite(item);
      }}>
      <ScheduleIcon name="star" />
    </button>
  );
}

// compact이면 월간 칸에 맞춰 제목과 시간·별표를 나누고, 나머지 보기는 한 버튼으로 만듭니다.
export function ScheduleEvent({ item, onSelect, compact = false, roleLabel, onToggleFavorite }) {
  const isProjectMilestone = Boolean(item.isProjectMilestone);
  const status = getStatusOption(item.status);
  const time = getScheduleTime(item);
  const label = `${item.date} ${time} ${item.title} 선택한 날짜 일정에서 보기`;
  const help = item.scope === "개인 일정용"
    ? `${item.title} · ${time}`
    : `${item.title} · ${time} · ${item.project} · ${item.person} · ${status.label}`;
  // 일정 상자를 누르면 날짜 칸 클릭은 막고, 선택한 날짜 일정 패널을 갱신합니다.
  // 카드 안의 선택 클릭이 달력 날짜 칸까지 전파되지 않게 막습니다.
  // 전체 이름 펼치기와 별표는 별도 핸들러에서 전파를 막으므로 이 선택을 실행하지 않습니다.
  function selectSchedule(event) {
    event.stopPropagation();
    onSelect(item);
  }
  // 버튼 안에 별 버튼을 중첩하지 않고, 일정 박스 안에 제목 버튼과 별 버튼을 나란히 둡니다.
  // 제목은 상세창, 별은 즐겨찾기만 실행하므로 서로의 동작이 섞이지 않습니다.
  if (compact) {
    return (
      <div className={"sm-event sm-event-compact " + (isProjectMilestone ? "sm-event-project" : "")} style={{ "--sm-event-color": item.color }}
        onClick={selectSchedule} title={help}>
        {/* 일정 영역을 누르면 상세 패널을 선택하고, 별 버튼은 즐겨찾기만 바꿉니다. */}
        <button type="button" className="sm-event-open"
          aria-label={label} title={help} onClick={selectSchedule}>
          <strong className="sm-event-title">{item.title}</strong>
        </button>
        {/* 터치·키보드에서도 달력을 떠나지 않고 전체 이름을 펼칠 수 있습니다. */}
        <details className="sm-event-full-title" onClick={event => event.stopPropagation()}>
          <summary>전체 이름</summary>
          <p>{item.title}</p>
        </details>
        <div className="sm-event-time-row">
          <time>{time}</time>
          {!isProjectMilestone && <ScheduleFavorite item={item} onToggleFavorite={onToggleFavorite} />}
        </div>
        <span className="sm-event-meta">
          {isProjectMilestone
            ? <span className="sm-project-milestone-tag">프로젝트 {item.milestoneType}</span>
            : <>{item.scope !== "개인 일정용" && <ScheduleStatus status={item.status} />}<ScheduleVisibility visibility={item.visibility} /></>}
        </span>
      </div>
    );
  }
  const eventButton = (
    <button
      type="button"
      className={"sm-event " + (isProjectMilestone ? "sm-event-project" : "")}
      style={{ "--sm-event-color": item.color }}
      onClick={selectSchedule}
      aria-label={label}
      title={help}
    >
      <time>{time}</time>
      <span>{item.title}</span>
      <small>{isProjectMilestone ? "프로젝트" : (roleLabel || item.person)}</small>
      {!isProjectMilestone && item.scope !== "개인 일정용" && <ScheduleStatus status={item.status} />}
      {isProjectMilestone
        ? <span className="sm-project-milestone-tag">{item.milestoneType}</span>
        : <ScheduleVisibility visibility={item.visibility} />}
    </button>
  );
  // 별표를 일정 선택 버튼 바깥에 둡니다.
  return (
    <div className={"sm-event-shell " + (isProjectMilestone ? "sm-event-project-shell" : "")} style={{ "--sm-event-color": item.color }}>
      {eventButton}
      {!isProjectMilestone && <ScheduleFavorite item={item} onToggleFavorite={onToggleFavorite} />}
    </div>
  );
}

// 선택 날짜 카드에서 일정 수정·상태 변경·삭제를 실행합니다.
export function ScheduleActions({ item, onEdit, onDelete, onStatusChange }) {
  const status = getStatusOption(item.status);
  let statusHelp = "이 일정의 상태 변경";
  if (item.repeatType !== "none" && !item.occurrenceDate) {
    statusHelp = "전체 반복 일정의 기본 상태 변경";
  }
  return (
    <div className="sm-item-actions">
      <button type="button" className="sm-edit-btn" onClick={() => onEdit(item)} aria-label={`${item.title} 일정 수정`}>수정</button>
      {item.scope !== "개인 일정용" && <select
          className={`sm-status-select ${status.value}`}
          aria-label={`${item.title} 일정 상태`}
          title={statusHelp}
          value={status.value}
          onChange={(event) => onStatusChange(item, event.target.value)}
        >
          {scheduleStatuses.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>}
      <button
        type="button"
        className="sm-delete-btn"
        onClick={() => onDelete(item)}
        aria-label={`${item.title} 일정 삭제`}
      >
        삭제
      </button>
    </div>
  );
}

// 한 번만 정리·연결한 문자열을 사용합니다. 빈 배열의 join 결과는 ""이므로 빈 안내 문구도 만들지 않습니다.
export function ScheduleAttendees({ item, paragraph = false }) {
  const names = normalizeAttendees(item.attendees).join(", ");
  if (!names) return null;
  if (paragraph) return <p className="sm-attendees">참석자: {names}</p>;
  return <small>참석자: {names}</small>;
}

// 선택 날짜 패널의 일정 한 건입니다. 작업 구분·참석자·메모를 함께 표시합니다.
// 실제 수정·삭제는 이 컴포넌트가 하지 않고 부모가 전달한 함수에 item을 넘깁니다.
export function ScheduleAgendaItem({ item, onEdit, onDelete, onStatusChange, onToggleFavorite }) {
  const isProjectMilestone = Boolean(item.isProjectMilestone);
  return (
    <article className={"sm-agenda-item sm-favorite-item " + (isProjectMilestone ? "sm-project-milestone-item" : "")} style={{ "--sm-event-color": item.color }}>
      {/* 즐겨찾기와 같은 배치를 재사용합니다. 제목과 별을 분리하고 정보마다 이름을 붙입니다. */}
      <div className="sm-favorite-heading">
        <strong className="sm-favorite-title">{item.title}</strong>
        {!isProjectMilestone && <ScheduleFavorite item={item} onToggleFavorite={onToggleFavorite} />}
      </div>
      <div className="sm-favorite-time-row">
        <span className="sm-favorite-time"><ScheduleIcon name="clock" /><time>{getScheduleTime(item)}</time></span>
        {!isProjectMilestone && <ScheduleVisibility visibility={item.visibility} />}
      </div>
      <dl className="sm-favorite-info">
        {isProjectMilestone
          ? <><dt>구분</dt><dd>프로젝트 일정</dd><dt>프로젝트</dt><dd>{item.project}</dd><dt>담당자</dt><dd>{item.projectManager || "미지정"}</dd><dt>기준일</dt><dd>{item.milestoneType}</dd></>
          : <>
            <dt>일정 종류</dt><dd>{item.scope || "업무용"}</dd>
            {item.scope !== "개인 일정용" && <><dt>분류</dt><dd>{item.category || (item.project ? "프로젝트" : "업무")}</dd></>}
            {item.scope !== "개인 일정용" && item.project && <><dt>프로젝트</dt><dd>{item.project}</dd></>}
            {item.scope !== "개인 일정용" && <><dt>담당자</dt><dd>{item.person}</dd></>}
            {item.scope !== "개인 일정용" && <><dt>진행 상태</dt><dd><ScheduleStatus status={item.status} /></dd></>}
            {item.category === "프로젝트" && <><dt>업무 유형</dt><dd>{item.type}</dd></>}
          </>}
      </dl>
      {!isProjectMilestone && <ScheduleAttendees item={item} paragraph />}
      {!isProjectMilestone && item.description && <p className="sm-description">{item.description}</p>}
      {isProjectMilestone
        ? <p className="sm-form-note">프로젝트의 시작일·마감일입니다. 날짜 변경은 프로젝트 관리에서 해주세요.</p>
        : <ScheduleActions item={item} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />}
    </article>
  );
}



/* 공통 SVG 아이콘 정의입니다. currentColor로 부모 색상을 따르고, 장식 아이콘은 aria-hidden으로 중복 낭독을 막습니다. */
const paths = {
  reset: <><path d="M3 10a9 9 0 1 1 2 9M3 4v6h6" /></>,
  projects: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M8 4v16M8 10h13M13 14h4M13 17h3" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2M8 18h2" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  star: <path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.5-4.4 6.3-.9Z" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  chevronLeft: <path d="m14 6-6 6 6 6" />,
  chevronRight: <path d="m10 6 6 6-6 6" />,
};

export function ScheduleIcon({ name }) {
  return (
    <svg className="sm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}
