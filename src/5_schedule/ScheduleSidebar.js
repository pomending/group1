import React from "react";
import { normalizeAttendees, weekDays } from "./scheduleData";

// [공부 순서 5] 선택 날짜의 결과를 보여 주는 영역입니다.
// 검색·공개 필터와 반복 계산은 이미 부모에서 처리되므로 여기서는 받은 배열만 표시합니다.
// 부모가 넘겨준 선택 날짜의 일정과 마감 예정 목록을 보여줍니다.
// 수정·삭제·마감 선택은 실제 데이터 처리를 하는 부모 함수에 맡깁니다.
export default function ScheduleSidebar({
  selectedDate,
  selectedDateObject,
  selectedHoliday,
  selectedItems,
  upcomingDeadlines,
  onSelectDate,
  onDelete,
  onEdit,
}) {
  return (
    <aside className="sm-sidebar">
      <section className="sm-card">
        <div className="sm-panel-title">
          <h3>선택한 날짜 일정</h3>
          <span className="sm-muted">{selectedItems.length}건</span>
        </div>
        {/* replaceAll은 저장 형식을 바꾸지 않고 표시용 점 구분 날짜를 만듭니다.
            getDay의 일요일=0을 월요일 시작 배열에 맞추려 (요일+6)%7로 변환합니다. */}
        <div className="sm-agenda-date">
          <span className="sm-date-subtitle">
            {selectedDate.replaceAll("-", ".")} (
            {weekDays[(selectedDateObject.getDay() + 6) % 7]})
            {selectedHoliday && (
              <>
                {" "}
                · <strong>{selectedHoliday}</strong>
              </>
            )}
          </span>
        </div>
        {/* 일정이 있으면 항목을 반복하고, 없으면 빈 상태 안내를 표시합니다. */}
        {selectedItems.length ? (
          selectedItems.map((item) => (
            <div className="sm-agenda-item" key={item.id}>
              <div className="sm-time">{item.time}</div>
              {/* 작업 구분에 맞는 color를 작은 세로선에 넣습니다. 문자열 색상을 style 객체로 전달합니다. */}
              <div className="sm-line" style={{ background: item.color }} />
              <div>
                <button type="button" className="sm-detail-link" onClick={() => onEdit(item)}>
                  <strong>{item.title}</strong>
                </button>
                <small>
                  {item.type} · {item.project} · {item.person}
                </small>
                {/* 참석자 값이 없는 과거 일정도 normalizeAttendees가 []로 바꿉니다.
                    length > 0일 때만 안내를 만들고 join(", ")으로 이름 배열을 읽기 쉬운 한 문자열로 표시합니다.
                    여기서는 화면 표시만 하며 원본 배열이나 수정 폼 값은 바꾸지 않습니다. */}
                {normalizeAttendees(item.attendees).length > 0 && (
                  <p className="sm-attendees">참석자: {normalizeAttendees(item.attendees).join(", ")}</p>
                )}
                {/* 빈 문자열이면 내용 문단을 만들지 않습니다. JSX는 텍스트를 표시하므로 입력을 HTML로 실행하지 않습니다.
                    CSS의 pre-wrap은 저장 문자열의 줄바꿈을 보존하고 긴 줄은 화면 폭에 맞춰 줄바꿈합니다. */}
                {item.description && <p className="sm-description">{item.description}</p>}
              </div>
              <div className="sm-item-actions">
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
            </div>
          ))
        ) : (
          <div className="sm-empty">등록된 일정이 없습니다.</div>
        )}
      </section>

      <section className="sm-card">
        <div className="sm-panel-title">
          <h3>다가오는 마감</h3>
          <span className="sm-muted">{upcomingDeadlines.length}건</span>
        </div>
        {/* 이 목록은 부모가 오늘 포함 4일 범위로 계산한 결과입니다. 브라우저 알림을 보내는 기능은 아닙니다.
            마감 항목을 누르면 onSelectDate가 부모의 선택 날짜와 표시 월을 갱신합니다. */}
        {upcomingDeadlines.map((item) => (
          <button
            className="sm-deadline"
            key={item.id}
            onClick={() => onSelectDate(item.date)}
          >
            <div className="sm-deadline-dot" />
            <div>
              <strong>{item.title}</strong>
              <small>
                {item.date.slice(5).replace("-", ".")} · {item.project}
              </small>
            </div>
          </button>
        ))}
        {!upcomingDeadlines.length && (
          <div className="sm-empty">예정된 마감이 없습니다.</div>
        )}
      </section>
    </aside>
  );
}
