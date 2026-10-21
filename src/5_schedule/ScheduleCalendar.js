import React from "react";
import { weekDays } from "./scheduleData";

// 부모(ScheduleManager)에서 받은 날짜·일정 데이터를 달력으로 보여줍니다.
// 월 이동, 검색 입력, 날짜 선택은 전달받은 함수를 호출해 부모 상태를 변경합니다.
export default function ScheduleCalendar({
  monthLabel,
  onChangeMonth,
  query,
  onQueryChange,
  holidayInfo,
  calendarYear,
  holidayDates,
  calendarDays,
  visibleItems,
  selectedDate,
  todayKey,
  onSelectDate,
  onShowMore,
}) {
  return (
    <section className="sm-card">
      <div className="sm-calendar-head">
        <div className="sm-month">
          <h2>{monthLabel}</h2>
          <div className="sm-arrows">
            <button
              aria-label="이전 달"
              className="sm-icon-btn"
              onClick={() => onChangeMonth(-1)}
            >
              ‹
            </button>
            <button
              aria-label="다음 달"
              className="sm-icon-btn"
              onClick={() => onChangeMonth(1)}
            >
              ›
            </button>
          </div>
        </div>
        <input
          className="sm-search"
          placeholder="일정 또는 담당자 검색"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      <div className="sm-holiday-error" role="status">
        {holidayInfo.year === calendarYear && holidayInfo.error
          ? "공휴일 정보를 불러오지 못했습니다."
          : ""}
      </div>

      <div className="sm-grid">
        {weekDays.map((day, index) => (
          <div
            className={`sm-weekday ${index === 5 ? "saturday" : ""} ${index === 6 ? "sunday" : ""}`}
            key={day}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="sm-grid">
        {calendarDays.map((cell, index) => {
          // 해당 월이 아닌 앞뒤 칸은 날짜가 없으므로 빈칸으로 표시합니다.
          if (!cell) {
            return (
              <div
                key={`blank-${index}`}
                className="sm-day"
                aria-hidden="true"
              />
            );
          }

          const holidayName = holidayDates[cell.key];
          const weekday = cell.date.getDay();
          // 공휴일은 빨간색을 우선 적용하고, 일요일은 빨강·토요일은 파랑으로 표시합니다.
          const dateColor = holidayName
            ? "holiday"
            : weekday === 0
              ? "sunday"
              : weekday === 6
                ? "saturday"
                : "";
          const dayItems = visibleItems.filter(
            (item) => item.date === cell.key,
          );

          return (
            <div
              key={cell.key}
              onClick={() => onSelectDate(cell.key)}
              className={`sm-day ${selectedDate === cell.key ? "selected" : ""} ${cell.key === todayKey ? "today" : ""}`}
            >
              <div
                className={`sm-day-num ${dateColor}`}
                title={holidayName || undefined}
              >
                {cell.date.getDate()}
              </div>
              {holidayName && (
                <div className="sm-holiday-name" title={holidayName}>
                  {holidayName}
                </div>
              )}
              {/* 달력 칸이 복잡해지지 않도록 일정은 2개까지만 표시합니다. */}
              {dayItems.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="sm-event"
                  style={{ background: item.color }}
                >
                  {item.title}
                </div>
              ))}
              {dayItems.length > 2 && (
                <button
                  type="button"
                  className="sm-more-events"
                  onClick={(event) => {
                    event.stopPropagation();
                    onShowMore(cell.key);
                  }}
                >
                  + 더보기
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
