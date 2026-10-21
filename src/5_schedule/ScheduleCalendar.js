/*
 * [공부 순서 3] 달력 표시 컴포넌트
 * 일정 저장이나 반복 계산을 하지 않고 부모가 계산한 visibleItems를 화면에 배치합니다.
 * 데이터는 props로 내려오고, 사용자 동작은 on... 콜백으로 부모에게 올라갑니다.
 */
import React from "react";
import { groupSchedulesByDate, weekDays } from "./scheduleData";
import ScheduleStaffWeek from "./ScheduleStaffWeek";
import { ScheduleEvent } from "./ScheduleItemParts";

// 보기 방식에 맞는 일정 표를 보여주고 선택과 검색을 부모에게 전달합니다.
export default function ScheduleCalendar({
  view,
  onViewChange,
  onChangePeriod,
  periodLabel,
  weekDates,
  scopeFilter,
  onScopeFilterChange,
  query,
  onQueryChange,
  holidayError,
  holidayDates,
  calendarDays,
  visibleItems,
  // Manager가 검색·공개 필터를 통과한 전체 일정에서 추린 사람 이름 목록입니다.
  // visibleItems는 표시 기간의 일정 목록이라 이번 주 0건인 사람을 만들 때 이 별도 목록이 필요합니다.
  staffPeople,
  selectedDate,
  todayKey,
  onSelectDate,
  onShowMore,
  onOpenSchedule,
}) {
  // 한 번 정렬해 날짜별로 묶습니다. 날짜 칸이 늘어도 전체 배열을 매번 filter/sort하지 않습니다.
  const schedulesByDate = groupSchedulesByDate(visibleItems);
  const dateItems = (date) => schedulesByDate[date] || [];
  const selectedItems = dateItems(selectedDate);
  const renderItems = (items) =>
    items.map((item) => (
      <ScheduleEvent key={item.id} item={item} onOpen={onOpenSchedule} />
    ));

  return (
    <section className="sm-card">
      <div className="sm-calendar-head">
        <div className="sm-month">
          <h2>{periodLabel}</h2>
          <div className="sm-arrows">
            <button
              aria-label="이전 기간"
              className="sm-icon-btn"
              onClick={() => onChangePeriod(-1)}
            >
              ‹
            </button>
            <button
              aria-label="다음 기간"
              className="sm-icon-btn"
              onClick={() => onChangePeriod(1)}
            >
              ›
            </button>
          </div>
        </div>
        {/* value는 부모의 현재 값입니다. onChange가 부모를 갱신하면 새 value가 props로 다시 내려옵니다. */}
        <div className="sm-calendar-filters">
          <select
            aria-label="일정 구분"
            value={scopeFilter}
            onChange={(event) => onScopeFilterChange(event.target.value)}
          >
            <option value="all">전체 일정</option>
            <option value="shared">회사 공유</option>
            <option value="private">개인 일정</option>
          </select>
          <input
            className="sm-search"
            placeholder="일정·담당자·참석자 검색"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
      </div>

      {/* [내부 값, 표시 이름] 배열을 구조 분해해 탭을 만듭니다. 선택 여부는 view와 비교합니다.
          onClick={() => ...}는 함수를 넘기는 문법입니다. 렌더링 중이 아니라 클릭했을 때 실행됩니다.
          role과 aria-selected는 보조 기기에 탭과 선택 상태를 설명합니다. */}
      <div className="sm-view-tabs" role="tablist" aria-label="일정 보기 방식">
        {[
          ["hourly", "시간대별"],
          ["daily", "일별"],
          ["weekly", "주별"],
          ["staff", "담당자별 주간"],
          ["monthly", "월별"],
        ].map(([key, label]) => (
          <button
            type="button"
            role="tab"
            aria-selected={view === key}
            className={view === key ? "active" : ""}
            key={key}
            onClick={() => onViewChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="sm-holiday-error" role="status">
        {holidayError ? "공휴일 정보를 불러오지 못했습니다." : ""}
      </div>

      {/* 조건부 렌더링: view가 monthly일 때만 월간 표를 만듭니다.
          <>...</>는 Fragment이며 실제 DOM 요소를 추가하지 않고 두 격자를 하나로 묶습니다. */}
      {view === "monthly" && (
        <>
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
              // 부모가 만든 null 칸은 월 앞뒤의 빈자리입니다. 실제 날짜처럼 선택하지 않게 만듭니다.
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
              // 삼항 연산자를 순서대로 검사하므로 공휴일 색상이 주말 색상보다 우선합니다.
              // getDay()는 일요일=0, 토요일=6입니다. 앞의 weekDays 배열 인덱스와는 순서가 다릅니다.
              const dateColor = holidayName
                ? "holiday"
                : weekday === 0
                  ? "sunday"
                  : weekday === 6
                    ? "saturday"
                    : "";
              const dayItems = dateItems(cell.key);

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
                    <div className="sm-holiday-name">{holidayName}</div>
                  )}
                  {/* slice(0, 2)는 원본을 수정하지 않고 처음 두 건만 복사합니다.
                      남은 일정은 아래 더보기에서 해당 날짜의 목록을 열어 확인합니다. */}
                  {dayItems.slice(0, 2).map((item) => (
                    <ScheduleEvent
                      key={item.id}
                      item={item}
                      compact
                      onOpen={onOpenSchedule}
                    />
                  ))}
                  {dayItems.length > 2 && (
                    <button
                      type="button"
                      className="sm-more-events"
                      onClick={(event) => {
                        // 더보기 클릭이 날짜 칸 onClick으로 전파되지 않도록 막습니다.
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
        </>
      )}

      {/* 주간 날짜는 부모가 월요일부터 7개로 계산해 전달합니다.
          날짜 헤더/빈 공간은 날짜 선택, 내부 일정 버튼은 내용 수정으로 구분됩니다. */}
      {view === "weekly" && (
        <div className="sm-week-view">
          {weekDates.map(({ date, key }, index) => {
            const dayItems = dateItems(key);
            return (
              <div
                className={`sm-week-column ${selectedDate === key ? "selected" : ""}`}
                key={key}
                onClick={() => onSelectDate(key)}
              >
                <button
                  type="button"
                  className={`sm-week-date ${index === 5 ? "saturday" : index === 6 ? "sunday" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectDate(key);
                  }}
                >
                  {weekDays[index]} {date.getDate()}
                </button>
                {dayItems.length ? (
                  renderItems(dayItems)
                ) : (
                  <span className="sm-muted">일정 없음</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* view=staff일 때만 사람별 표 컴포넌트를 만듭니다.
          people은 행 이름, weekDates는 7개 열, items는 이미 반복 계산·검색 필터를 거친 발생 항목입니다.
          날짜 선택/내용 수정 콜백은 기존 달력과 공유하므로 어느 보기에서 눌러도 같은 부모 상태가 바뀝니다.
          보기만 바꾸며 일정을 새로 저장하거나 복제하지 않습니다. */}
      {view === "staff" && (
        <ScheduleStaffWeek
          people={staffPeople}
          weekDates={weekDates}
          items={visibleItems}
          selectedDate={selectedDate}
          holidayDates={holidayDates}
          onSelectDate={onSelectDate}
          onOpenSchedule={onOpenSchedule}
        />
      )}

      {/* 일별은 선택 날짜의 모든 일정을 시간순으로, 시간대별은 같은 목록을 시간별로 나눠 표시합니다. */}
      {(view === "daily" || view === "hourly") && (
        <div className="sm-day-view">
          {view === "hourly" ? (
            // 0~23 인덱스로 하루의 24개 행을 만듭니다. _는 사용하지 않는 첫 번째 인자를 뜻합니다.
            Array.from({ length: 24 }, (_, hour) => {
              // "15:30"에서 앞 두 글자 "15"만 잘라 숫자로 바꾸면 15시 행에 배치됩니다.
              // 분 정보는 없애지 않으며 renderItems가 원본 time 전체를 표시합니다.
              const hourItems = selectedItems.filter(
                (item) => Number(item.time.slice(0, 2)) === hour,
              );
              return (
                <div className="sm-hour-row" key={hour}>
                  <time>{String(hour).padStart(2, "0")}:00</time>
                  <div>{renderItems(hourItems)}</div>
                </div>
              );
            })
          ) : selectedItems.length ? (
            renderItems(selectedItems)
          ) : (
            <p className="sm-empty">선택한 날짜에 등록된 일정이 없습니다.</p>
          )}
        </div>
      )}
    </section>
  );
}
