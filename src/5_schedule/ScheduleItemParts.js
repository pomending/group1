import React from "react";
import ScheduleIcon from "./ScheduleIcon";
import {
  normalizeAttendees,
  normalizeStatus,
  scheduleStatuses,
  getScheduleTime,
} from "./scheduleData";

/* 작은 컴포넌트로 나눈 이유
 * 같은 일정이 달력, 검색 결과, 선택 날짜, 전체 목록에 여러 번 등장합니다.
 * 각 화면마다 수정·삭제 버튼과 상태 표시를 다시 작성하면 한쪽만 수정되는 문제가 생기기 쉽습니다.
 * 여기서는 같은 모양과 동작을 부품으로 만들고 item과 콜백만 받아 재사용합니다.
 *
 * 예: <ScheduleActions item={item} onEdit={openScheduleForm} ... />
 * 부모의 openScheduleForm 함수가 자식에서는 onEdit이라는 이름으로 들어옵니다.
 * 아래 onClick={() => onEdit(item)}를 실행하면 이 일정 객체를 인자로 부모 함수를 호출합니다.
 * 함수 이름이 달라 보여도 새 저장 기능이 생긴 것이 아니라 같은 함수를 props로 전달한 것입니다.
 *
 * style={{ "--sm-event-color": item.color }}의 바깥 {}는 JSX에 JS 값을 넣는 표시이고,
 * 안쪽 객체는 CSS로 전달할 값을 담습니다. 여기서는 작업 종류별 색상을 CSS 변수로 전달합니다.
 * CSS는 이 색으로 왼쪽 선과 옅은 배경을 만듭니다. 배경을 직접 지정하지 않아 보기별 디자인을
 * CSS 한 곳에서 조정할 수 있습니다. 아래 일정 행의 색상선은 background로 직접 칠합니다.
 * compact=false 같은 매개변수 기본값은 부모가 그 props를 생략했을 때 사용할 값입니다.
 */
// 상태 코드로 표시 문구를 찾습니다. 알 수 없는 값은 normalizeStatus가 pending으로 바꿉니다.
// 배지·툴팁·선택창이 이 함수를 공유하므로 같은 상태를 서로 다르게 표시하지 않습니다.
function getStatusOption(status) {
  const statusCode = normalizeStatus(status);
  for (const option of scheduleStatuses) {
    if (option.value === statusCode) return option;
  }
  return scheduleStatuses[0];
}

// 공통 상태 정의로 배지와 선택창의 문구를 맞춥니다. 색상만으로 구분하지 않고 텍스트도 표시합니다.
export function ScheduleStatus({ status, compact = false }) {
  const option = getStatusOption(status);
  return (
    <span className={`sm-status-badge ${option.value}`} title={option.label}>
      {compact ? option.shortLabel : option.label}
    </span>
  );
}

// 공개 범위는 진행 상태와 다른 정보입니다. 색뿐 아니라 글자로도 구분합니다.
// 이 배지는 저장된 분류를 표시하며, 로그인 사용자별 접근 권한을 검사하는 기능은 아닙니다.
export function ScheduleVisibility({ visibility }) {
  let label = "회사 공유";
  let scopeClass = "sm-visibility shared";
  if (visibility === "private") {
    label = "개인 일정";
    scopeClass = "sm-visibility private";
  }
  return <span className={scopeClass}>{label}</span>;
}

// 달력·주간 표에서 같은 버튼을 사용합니다. compact이면 월간 칸에 맞춰 제목과 보조 정보를 나눕니다.
// 클릭 전파를 여기서 막아 내부 일정 버튼이 바깥 날짜 칸의 선택 동작까지 실행하지 않게 합니다.
// 별표는 여러 화면에서 같은 저장 함수를 사용합니다. 클릭이 날짜 칸으로 전파되지 않게 막습니다.
export function ScheduleFavorite({ item, onToggleFavorite }) {
  return (
    <button type="button" className="sm-favorite-btn" aria-pressed={Boolean(item.isFavorite)}
      aria-label={`${item.title} 즐겨찾기 ${item.isFavorite ? "해제" : "추가"}`}
      title={item.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      onClick={(event) => {
        event.stopPropagation();
        onToggleFavorite(item);
      }}>
      <ScheduleIcon name="star" />
    </button>
  );
}

export function ScheduleEvent({ item, onOpen, compact = false, roleLabel, onToggleFavorite }) {
  let eventClass = "sm-event";
  if (compact) eventClass += " sm-event-compact";
  const status = getStatusOption(item.status);
  // 버튼 안에 별 버튼을 중첩하지 않고, 일정 박스 안에 제목 버튼과 별 버튼을 나란히 둡니다.
  // 제목은 상세창, 별은 즐겨찾기만 실행하므로 서로의 동작이 섞이지 않습니다.
  if (compact) {
    return (
      <div className={eventClass} style={{ "--sm-event-color": item.color }}>
        <button type="button" className="sm-event-open"
          aria-label={`${item.date} ${getScheduleTime(item)} ${item.title} 상세 내용 확인 및 수정`}
          title={`${item.title} · ${getScheduleTime(item)} · ${item.project} · ${item.person} · ${status.label}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(item);
          }}>
          <strong className="sm-event-title">{item.title}</strong>
        </button>
        <div className="sm-event-time-row">
          <time>{getScheduleTime(item)}</time>
          {onToggleFavorite && <ScheduleFavorite item={item} onToggleFavorite={onToggleFavorite} />}
        </div>
        <span className="sm-event-meta">
          <ScheduleStatus status={item.status} compact />
          <ScheduleVisibility visibility={item.visibility} />
        </span>
      </div>
    );
  }
  return (
    <button
      type="button"
      className={eventClass}
      style={{ "--sm-event-color": item.color }}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(item);
      }}
      aria-label={`${item.date} ${getScheduleTime(item)} ${item.title} 상세 내용 확인 및 수정`}
      title={`${item.title} · ${getScheduleTime(item)} · ${item.project} · ${item.person} · ${status.label}`}
    >
        <>
          <time>{getScheduleTime(item)}</time>
          <span>{item.title}</span>
          <small>{roleLabel || item.person}</small>
          <ScheduleStatus status={item.status} compact />
          <ScheduleVisibility visibility={item.visibility} />
        </>
    </button>
  );
}

// 부모의 콜백과 item만 바꿔 전달해 목록/사이드바의 수정·삭제 처리를 공통으로 유지합니다.
export function ScheduleActions({ item, onEdit, onDelete, onStatusChange, onToggleFavorite }) {
  const status = getStatusOption(item.status);
  let statusHelp = "이 일정의 상태 변경";
  if (item.repeatType !== "none" && !item.occurrenceDate) {
    statusHelp = "전체 반복 일정의 기본 상태 변경";
  }
  return (
    <div className="sm-item-actions">
      {onToggleFavorite && (
        <ScheduleFavorite item={item} onToggleFavorite={onToggleFavorite} />
      )}
      {onStatusChange && (
        <select
          className={`sm-status-select ${status.value}`}
          aria-label={`${item.title} 업무 진행 상태`}
          title={statusHelp}
          value={status.value}
          onChange={(event) => onStatusChange(item, event.target.value)}
        >
          {scheduleStatuses.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        className="sm-edit-btn"
        onClick={() => onEdit(item)}
        aria-label={`${item.title} 일정 수정`}
      >
        수정
      </button>
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

// 검색 결과와 선택 날짜 패널은 같은 일정 행을 사용합니다.
// detailed=true인 선택 날짜 패널에만 작업 구분과 상세 메모를 추가합니다.
// 실제 수정·삭제는 이 컴포넌트가 하지 않고 부모가 전달한 함수에 item을 넘깁니다.
export function ScheduleAgendaItem({ item, detailed = false, onEdit, onDelete, onStatusChange, onToggleFavorite }) {
  return (
    <article className="sm-agenda-item">
      <time className="sm-time">{getScheduleTime(item)}</time>
      {/* 색상은 작업 종류를, 상태 선택창은 업무 진행 상태를 나타냅니다. */}
      <div className="sm-line" style={{ background: item.color }} />
      <div>
        <button type="button" className="sm-detail-link" onClick={() => onEdit(item)}>
          <strong>{item.title}</strong>
        </button>
        <small>{detailed && `${item.type} · `}{item.project} · {item.person}</small>
        <ScheduleVisibility visibility={item.visibility} />
        <ScheduleAttendees item={item} paragraph />
        {/* &&는 조건이 참일 때만 문단을 만듭니다. pre-wrap 스타일이 메모의 줄바꿈을 보존합니다. */}
        {detailed && item.description && <p className="sm-description">{item.description}</p>}
      </div>
      <ScheduleActions item={item} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} onToggleFavorite={onToggleFavorite} />
    </article>
  );
}
