/*
 * [공부 순서 3] 달력 표시 컴포넌트
 * 일정 저장이나 반복 계산을 하지 않고 부모가 계산한 visibleItems를 화면에 배치합니다.
 * 데이터는 props로 내려오고, 사용자 동작은 on... 콜백으로 부모에게 올라갑니다.
 */
import React from "react";
import { weekDays } from "./scheduleData";
import ScheduleStaffWeek from "./ScheduleStaffWeek";

// 보기 방식에 맞는 일정 표를 보여주고 선택과 검색을 부모에게 전달합니다.
export default function ScheduleCalendar({
  monthLabel,
  view,
  onViewChange,
  onChangePeriod,
  periodLabel,
  weekDates,
  scopeFilter,
  onScopeFilterChange,
  query,
  onQueryChange,
  holidayInfo,
  calendarYear,
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
  // props를 { ... }로 구조 분해하면 props.onSelectDate 대신 onSelectDate로 사용할 수 있습니다.
  // 실제 선택 상태는 부모에 있습니다. 이 함수는 부모의 변경 함수를 호출할 뿐 직접 저장하지 않습니다.
  const openDate = (date) => onSelectDate(date);
  // filter로 해당 날짜만 추린 새 배열에 sort를 적용하므로 부모 배열은 바뀌지 않습니다.
  // HH:mm은 자릿수가 같아 "09:00"이 "15:00"보다 먼저 정렬됩니다.
  const dateItems = (date) =>
    visibleItems
      .filter((item) => item.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  // map은 데이터 배열의 각 요소를 JSX 버튼으로 바꿉니다. 주/일/시간 화면에서 같은 표시를 재사용합니다.
  // key는 React가 형제 목록의 항목을 식별하는 값입니다. 색상은 각 데이터의 color를 inline style로 전달합니다.
  // 일정 버튼은 부모 날짜 칸 안에 있으므로 stopPropagation으로 날짜 선택 클릭까지 전달되지 않게 합니다.
  // onOpenSchedule(item)은 부모의 editSchedule을 호출해 해당 내용이 채워진 폼을 엽니다.
  const renderItems = (items) =>
    items.map((item) => (
      <button type="button" className="sm-event" key={item.id} style={{ background: item.color }}
        onClick={(event) => { event.stopPropagation(); onOpenSchedule(item); }}
        aria-label={`${item.title} 상세 내용 확인 및 수정`}>
        <time>{item.time}</time> {item.title}
        <small>{item.person}</small>
      </button>
    ));

  return (
    <section className="sm-card">
      <div className="sm-calendar-head">
        <div className="sm-month">
          <h2>{view === "monthly" ? monthLabel : periodLabel}</h2>
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
        {holidayInfo.year === calendarYear && holidayInfo.error
          ? "공휴일 정보를 불러오지 못했습니다."
          : ""}
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
                return <div key={`blank-${index}`} className="sm-day" aria-hidden="true" />;
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
                  onClick={() => openDate(cell.key)}
                  className={`sm-day ${selectedDate === cell.key ? "selected" : ""} ${cell.key === todayKey ? "today" : ""}`}
                >
                  <div className={`sm-day-num ${dateColor}`} title={holidayName || undefined}>
                    {cell.date.getDate()}
                  </div>
                  {holidayName && <div className="sm-holiday-name">{holidayName}</div>}
                  {/* slice(0, 2)는 원본을 수정하지 않고 처음 두 건만 복사합니다.
                      남은 일정은 아래 더보기에서 해당 날짜의 목록을 열어 확인합니다. */}
                  {dayItems.slice(0, 2).map((item) => (
                    <button type="button" key={item.id} className="sm-event" style={{ background: item.color }}
                      onClick={(event) => { event.stopPropagation(); onOpenSchedule(item); }}
                      aria-label={`${item.title} 상세 내용 확인 및 수정`}>
                      {item.title}
                    </button>
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
          {weekDates.map(({ date, key }, index) => (
            <div
              className={`sm-week-column ${selectedDate === key ? "selected" : ""}`}
              key={key}
              onClick={() => openDate(key)}
            >
              <button type="button" className={`sm-week-date ${index === 5 ? "saturday" : index === 6 ? "sunday" : ""}`} onClick={() => openDate(key)}>
                {weekDays[index]} {date.getDate()}
              </button>
              {dateItems(key).length ? renderItems(dateItems(key)) : <span className="sm-muted">일정 없음</span>}
            </div>
          ))}
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
          onSelectDate={openDate}
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
              const hourItems = dateItems(selectedDate).filter(
                (item) => Number(item.time.slice(0, 2)) === hour,
              );
              return (
                <div className="sm-hour-row" key={hour}>
                  <time>{String(hour).padStart(2, "0")}:00</time>
                  <div>{renderItems(hourItems)}</div>
                </div>
              );
            })
          ) : dateItems(selectedDate).length ? (
            renderItems(dateItems(selectedDate))
          ) : (
            <p className="sm-empty">선택한 날짜에 등록된 일정이 없습니다.</p>
          )}
        </div>
      )}
    </section>
  );
}
