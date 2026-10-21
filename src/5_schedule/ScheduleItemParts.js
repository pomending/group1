import React from "react";
import {
  normalizeAttendees,
  normalizeStatus,
  scheduleStatuses,
} from "./scheduleData";

// 공통 상태 정의로 배지와 선택창의 문구를 맞춥니다. 색상만으로 구분하지 않고 텍스트도 표시합니다.
export function ScheduleStatus({ status, compact = false }) {
  const option = scheduleStatuses.find(
    (entry) => entry.value === normalizeStatus(status),
  );
  return (
    <span className={`sm-status-badge ${option.value}`} title={option.label}>
      {compact ? option.shortLabel : option.label}
    </span>
  );
}

// 달력·주간 표에서 같은 버튼을 사용합니다. compact이면 월간 칸처럼 제목만 표시합니다.
// 클릭 전파를 여기서 막아 내부 일정 버튼이 바깥 날짜 칸의 선택 동작까지 실행하지 않게 합니다.
export function ScheduleEvent({ item, onOpen, compact = false, roleLabel }) {
  return (
    <button
      type="button"
      className="sm-event"
      style={{ background: item.color }}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(item);
      }}
      aria-label={`${item.date} ${item.time} ${item.title} 상세 내용 확인 및 수정`}
      title={`${item.title} · ${scheduleStatuses.find((entry) => entry.value === normalizeStatus(item.status)).label}`}
    >
      {compact ? (
        <>
          <ScheduleStatus status={item.status} compact /> {item.title}
        </>
      ) : (
        <>
          <time>{item.time}</time>
          <span>{item.title}</span>
          <small>{roleLabel || item.person}</small>
          <ScheduleStatus status={item.status} compact />
        </>
      )}
    </button>
  );
}

// 부모의 콜백과 item만 바꿔 전달해 목록/사이드바의 수정·삭제 처리를 공통으로 유지합니다.
export function ScheduleActions({ item, onEdit, onDelete, onStatusChange }) {
  return (
    <div className="sm-item-actions">
      {onStatusChange && (
        <select
          className={`sm-status-select ${normalizeStatus(item.status)}`}
          aria-label={`${item.title} 업무 진행 상태`}
          title={
            item.repeatType !== "none" && !item.occurrenceDate
              ? "전체 반복 일정의 기본 상태 변경"
              : "이 일정의 상태 변경"
          }
          value={normalizeStatus(item.status)}
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
  const Tag = paragraph ? "p" : "small";
  return names ? (
    <Tag className={paragraph ? "sm-attendees" : undefined}>
      참석자: {names}
    </Tag>
  ) : null;
}
