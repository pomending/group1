import React from "react";
import { weekDays } from "./scheduleData";

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
              <div className="sm-line" style={{ background: item.color }} />
              <div>
                <strong>{item.title}</strong>
                <small>
                  {item.type} · {item.project} · {item.person}
                </small>
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
        {/* 마감 항목을 누르면 부모가 해당 날짜를 선택합니다. */}
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
