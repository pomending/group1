/* [재사용 부품의 입력과 출력]
 * item은 표시할 일정 한 건입니다. 같은 부품도 item이 다르면 다른 제목과 시간을 보여줍니다.
 * onEdit 같은 on으로 시작하는 props는 사용자 동작을 부모에게 전달하는 함수입니다.
 * ScheduleEvent는 달력 박스, ScheduleAgendaItem은 선택 날짜 상세 카드, ScheduleFavorite는 별표 버튼입니다.
 * 같은 별표 부품을 재사용하므로 월별·일별·주별·담당자별 화면이 같은 저장 함수를 호출합니다.
 * 별표는 일정 열기 버튼과 형제 요소로 배치합니다. button 안에 또 button을 넣지 않습니다.
 * aria-label은 아이콘처럼 글자가 없는 버튼의 이름, aria-pressed는 별 선택 여부를 보조 기기에 알려줍니다.
 * 화면의 배지 색은 분류를 표현하며 접근 권한을 검사하거나 저장을 실행하는 기능은 아닙니다.
 */
import React from "react";
import { ScheduleConnectionSummary } from "./ScheduleConnections";
import {
  normalizeAttendees,
  scheduleStatuses,
  getScheduleTime,
} from "./scheduleData";

/* 작은 컴포넌트로 나눈 이유
 * 같은 일정이 달력, 검색 결과, 선택 날짜, 전체 목록에 여러 번 등장합니다.
 * 각 화면마다 수정·삭제 버튼과 상태 표시를 다시 작성하면 한쪽만 수정되는 문제가 생기기 쉽습니다.
 * 여기서는 같은 모양과 동작을 부품으로 만들고 item과 콜백만 받아 재사용합니다.
 *
 * 예: <ScheduleActions item={item} onDelete={deleteSchedule} ... />
 * 부모의 deleteSchedule 함수가 자식에서는 onDelete라는 이름으로 들어옵니다.
 * 아래 onClick={() => onDelete(item)}를 실행하면 이 일정 객체를 인자로 부모 함수를 호출합니다.
 * 함수 이름이 달라 보여도 새 저장 기능이 생긴 것이 아니라 같은 함수를 props로 전달한 것입니다.
 *
 * style={{ "--sm-event-color": item.color }}의 바깥 {}는 JSX에 JS 값을 넣는 표시이고,
 * 안쪽 객체는 CSS로 전달할 값을 담습니다. 여기서는 작업 종류별 색상을 CSS 변수로 전달합니다.
 * CSS는 이 색으로 왼쪽 선과 옅은 배경을 만듭니다. 배경을 직접 지정하지 않아 보기별 디자인을
 * CSS 한 곳에서 조정할 수 있습니다. 아래 일정 행의 색상선은 background로 직접 칠합니다.
 * compact=false 같은 매개변수 기본값은 부모가 그 props를 생략했을 때 사용할 값입니다.
 */
// 상태 코드로 표시 문구를 찾습니다. 없는 코드면 첫 항목인 '진행 전'을 사용합니다.
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
    label = "개인 일정";
    scopeClass = "sm-visibility private";
  }
  return <span className={scopeClass}>{label}</span>;
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
  const status = getStatusOption(item.status);
  const time = getScheduleTime(item);
  const label = `${item.date} ${time} ${item.title} 선택한 날짜 일정에서 보기`;
  const help = item.scope === "개인 일정용"
    ? `${item.title} · ${time}`
    : `${item.title} · ${time} · ${item.project} · ${item.person} · ${status.label}`;
  // 일정 상자를 누르면 날짜 칸 클릭은 막고, 선택한 날짜 일정 패널을 갱신합니다.
  function selectSchedule(event) {
    event.stopPropagation();
    onSelect(item);
  }
  // 버튼 안에 별 버튼을 중첩하지 않고, 일정 박스 안에 제목 버튼과 별 버튼을 나란히 둡니다.
  // 제목은 상세창, 별은 즐겨찾기만 실행하므로 서로의 동작이 섞이지 않습니다.
  if (compact) {
    return (
      <div className="sm-event sm-event-compact" style={{ "--sm-event-color": item.color }}
        onClick={selectSchedule} title={help}>
        {/* 일정 영역을 누르면 상세 패널을 선택하고, 별 버튼은 즐겨찾기만 바꿉니다. */}
        <button type="button" className="sm-event-open"
          aria-label={label} title={help} onClick={selectSchedule}>
          <strong className="sm-event-title">{item.title}</strong>
        </button>
        <div className="sm-event-time-row">
          <time>{time}</time>
          <ScheduleFavorite item={item} onToggleFavorite={onToggleFavorite} />
        </div>
        <span className="sm-event-meta">
          {item.scope !== "개인 일정용" && <ScheduleStatus status={item.status} />}
          <ScheduleVisibility visibility={item.visibility} />
        </span>
      </div>
    );
  }
  const eventButton = (
    <button
      type="button"
      className="sm-event"
      style={{ "--sm-event-color": item.color }}
      onClick={selectSchedule}
      aria-label={label}
      title={help}
    >
      <time>{time}</time>
      <span>{item.title}</span>
      <small>{roleLabel || item.person}</small>
      {item.scope !== "개인 일정용" && <ScheduleStatus status={item.status} />}
      <ScheduleVisibility visibility={item.visibility} />
    </button>
  );
  // 별표를 일정 선택 버튼 바깥에 둡니다.
  return (
    <div className="sm-event-shell" style={{ "--sm-event-color": item.color }}>
      {eventButton}
      <ScheduleFavorite item={item} onToggleFavorite={onToggleFavorite} />
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
  return (
    <article className="sm-agenda-item sm-favorite-item" style={{ "--sm-event-color": item.color }}>
      {/* 즐겨찾기와 같은 배치를 재사용합니다. 제목과 별을 분리하고 정보마다 이름을 붙입니다. */}
      <div className="sm-favorite-heading">
        <strong className="sm-favorite-title">{item.title}</strong>
        <ScheduleFavorite item={item} onToggleFavorite={onToggleFavorite} />
      </div>
      <div className="sm-favorite-time-row">
        <span className="sm-favorite-time"><ScheduleIcon name="clock" /><time>{getScheduleTime(item)}</time></span>
        <ScheduleVisibility visibility={item.visibility} />
      </div>
      <dl className="sm-favorite-info">
        <dt>일정 종류</dt><dd>{item.scope || "업무용"}</dd>
        {item.scope !== "개인 일정용" && <><dt>분류</dt><dd>{item.category || (item.project ? "프로젝트" : "업무")}</dd></>}
        {item.scope !== "개인 일정용" && item.project && <><dt>프로젝트</dt><dd>{item.project}</dd></>}
        {item.scope !== "개인 일정용" && <><dt>담당자</dt><dd>{item.person}</dd></>}
        {item.category === "프로젝트" && <><dt>작업 구분</dt><dd>{item.type}</dd></>}
      </dl>
      <ScheduleAttendees item={item} paragraph />
      {item.scope !== "개인 일정용" && <ScheduleConnectionSummary value={item.connections} />}
      {/* 메모가 있을 때만 별도 영역을 만들고 입력한 줄바꿈을 그대로 보여 줍니다. */}
      {item.description && <p className="sm-description">{item.description}</p>}
      <ScheduleActions item={item} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
    </article>
  );
}



/* 화면에서 반복해서 사용하는 작은 선 아이콘입니다.
 * SVG는 사진 파일 대신 선의 좌표로 그림을 그려서 크기를 바꿔도 선명하게 보입니다.
 * paths 객체에서 name에 맞는 그림만 꺼내므로 버튼마다 같은 SVG 설정을 복사하지 않아도 됩니다.
 * currentColor는 부모 버튼의 글자색을 따라갑니다. 색상과 크기는 scheduleStyles.css에서 정합니다.
 * 아이콘은 장식이고 실제 버튼 이름은 글자나 aria-label로 제공하므로,
 * aria-hidden으로 화면 읽기 프로그램이 그림을 중복해서 읽지 않게 합니다.
 */
const paths = {
  reset: <><path d="M3 10a9 9 0 1 1 2 9M3 4v6h6" /></>,
  projects: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M8 4v16M8 10h13M13 14h4M13 17h3" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2" /></>,
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
