/*
 * [공부 순서 3] 달력 표시 컴포넌트
 * 일정 저장이나 반복 계산을 하지 않고 부모가 계산한 visibleItems를 화면에 배치합니다.
 * 데이터는 props로 내려오고, 사용자 동작은 on... 콜백으로 부모에게 올라갑니다.
 */
import React from "react";
import {
  groupSchedulesByDate,
  weekDays,
  scheduleStatuses,
  scheduleTypes,
  typeColors,
} from "./scheduleData";
import ScheduleStaffWeek from "./ScheduleStaffWeek";
import { ScheduleEvent } from "./ScheduleItemParts";
import ScheduleIcon from "./ScheduleIcon";

/* 이 컴포넌트는 '보여주기와 클릭 전달'을 담당합니다.
 * function ScheduleCalendar({ view, onViewChange, ... })의 중괄호는 props 객체에서 필요한 값을
 * 이름별로 꺼내는 문법입니다. 부모의 <ScheduleCalendar view={view} ... />가 이 값을 전달합니다.
 * Calendar는 받은 view를 직접 변경하지 않습니다. 탭을 누르면 onViewChange('weekly')를 호출하고,
 * 부모가 state를 바꾼 다음 새 view를 내려주면 그 값으로 주간 화면을 다시 계산합니다.
 *
 * JSX를 읽는 방법:
 * - <div className="sm-card">에서 className은 CSS의 .sm-card와 연결되는 이름입니다.
 * - {periodLabel}처럼 중괄호 안에는 자바스크립트 계산 결과를 넣습니다.
 * - {view === 'monthly' && (...)}는 월별일 때만 괄호 안의 화면을 만듭니다.
 * - {조건 ? A : B}는 조건에 따라 A와 B 중 하나를 선택합니다.
 * - {배열.map(...)}은 각 원소를 화면 요소로 바꿔 여러 개를 나란히 표시합니다.
 * - key는 목록에서 같은 항목을 구분하기 위한 리액트용 표시입니다. 화면 글자로 출력되지 않습니다.
 *
 * 달력의 '선택 날짜'와 '일정 수정'은 다른 동작입니다.
 * 빈 날짜 칸 클릭 → onSelectDate(날짜) → 부모의 선택 날짜 변경.
 * 일정 버튼 클릭 → onOpenSchedule(일정 객체) → 부모가 수정 폼을 엽니다.
 * 이때 일정 버튼의 stopPropagation이 날짜 칸 클릭까지 이어지는 것을 막습니다.
 */
// 보기 방식에 맞는 일정 표를 보여주고 선택과 검색을 부모에게 전달합니다.
export default function ScheduleCalendar({
  containerRef,
  selectedProject,
  onClearProject,
  view,
  onViewChange,
  onChangePeriod,
  periodLabel,
  weekDates,
  scopeFilter,
  onScopeFilterChange,
  statusFilter,
  onStatusFilterChange,
  query,
  onQueryChange,
  holidayError,
  holidayDates,
  calendarDays,
  visibleItems,
  // Manager가 검색·공개 필터를 통과한 전체 일정에서 추린 사람 이름 목록입니다.
  // visibleItems는 표시 기간의 일정 목록이라 이번 주 0건인 사람을 만들 때 이 별도 목록이 필요합니다.
  staffPeople,
  staffPersonSearch,
  selectedDate,
  todayKey,
  onSelectDate,
  onShowMore,
  onOpenSchedule,
  onToggleFavorite,
}) {
  // 한 번 정렬해 날짜별로 묶습니다. 날짜 칸이 늘어도 전체 배열을 매번 filter/sort하지 않습니다.
  const schedulesByDate = groupSchedulesByDate(visibleItems);
  const dateItems = (date) => schedulesByDate[date] || [];
  const selectedItems = dateItems(selectedDate);
  // 숫자를 하나씩 넣어 시간대별 화면에 사용할 0~23시를 만듭니다.
  const hours = [];
  for (let hour = 0; hour < 24; hour += 1) hours.push(hour);
  const renderItems = (items) =>
    items.map((item) => (
      <ScheduleEvent key={item.id} item={item} onOpen={onOpenSchedule} />
    ));

  return (
    <section className="sm-card sm-calendar-card" ref={containerRef} tabIndex={-1} aria-label="일정 달력">
      {/* 프로젝트는 오른쪽 정보만 바꾸는 조건이 아니라 메인 달력에도 적용되는 필터입니다.
          선택 이름과 해제 버튼을 달력 위에 표시해 어떤 프로젝트를 보고 있는지 알 수 있게 합니다. */}
      {selectedProject && (
        <div className="sm-calendar-project" role="status">
          <span><ScheduleIcon name="projects" /> <strong>{selectedProject}</strong> 프로젝트 일정</span>
          <button type="button" className="sm-list-all-btn" onClick={onClearProject}>전체 프로젝트 보기</button>
        </div>
      )}
      <div className="sm-calendar-head">
        <div className="sm-month">
          <div>
            <div className="sm-section-kicker">우리 팀의 캘린더</div>
            <h2>{periodLabel}</h2>
          </div>
          <div className="sm-arrows">
            <button
              aria-label="이전 기간"
              className="sm-icon-btn"
              onClick={() => onChangePeriod(-1)}
            >
              <ScheduleIcon name="chevronLeft" />
            </button>
            <button
              aria-label="다음 기간"
              className="sm-icon-btn"
              onClick={() => onChangePeriod(1)}
            >
              <ScheduleIcon name="chevronRight" />
            </button>
          </div>
        </div>
        {/* value는 부모의 현재 값입니다. onChange가 부모를 갱신하면 새 value가 props로 다시 내려옵니다. */}
        <div className="sm-calendar-filters">
          {/* label이 입력창과 아이콘을 하나의 검색 영역으로 묶습니다.
              화면에 보이는 순서대로 JSX를 배치해 Tab 키도 검색 → 필터 순으로 이동합니다.
              검색 값과 onChange는 그대로 두고, 외형만 공통 입력 영역으로 꾸밉니다. */}
          <label className="sm-search-field">
            <ScheduleIcon name="search" />
            <input
              className="sm-search"
              placeholder="일정·프로젝트·담당자·참석자 검색"
              aria-label="일정 검색"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </label>
          <select
            aria-label="일정 구분"
            value={scopeFilter}
            onChange={(event) => onScopeFilterChange(event.target.value)}
          >
            <option value="all">전체 일정</option>
            <option value="shared">회사 공유</option>
            <option value="private">개인 일정</option>
          </select>
          <select
            aria-label="업무 상태 필터"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
          >
            <option value="all">모든 업무 상태</option>
            {scheduleStatuses.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 검색 결과는 별도 오른쪽 카드 대신 달력 위의 짧은 안내로 표시합니다. */}
      {query.trim() && (
        <div className="sm-calendar-search-summary">
          <span>검색 결과 {visibleItems.length}건</span>
          <button type="button" className="sm-list-all-btn" onClick={() => onQueryChange("")}>검색 초기화</button>
        </div>
      )}

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

      {/* 현재 필터로 표시 중인 일정의 작업 종류를 설명합니다. 색상과 글자를 함께 제공해
          색을 구별하기 어려운 경우에도 의미를 알 수 있고, 필터 동작은 추가하지 않습니다. */}
      <div className="sm-calendar-legend" aria-label="일정 색상 안내">
        {scheduleTypes.map((type) => (
          <span key={type}><i style={{ background: typeColors[type] }} aria-hidden="true" />{type}</span>
        ))}
      </div>
      <div className="sm-holiday-error" role="status">
        {holidayError ? "공휴일 정보를 불러오지 못했습니다." : ""}
      </div>

      {/* 조건부 렌더링: view가 monthly일 때만 월간 표를 만듭니다.
          요일과 날짜 격자를 같은 div에 넣어 가로 스크롤할 때 열 위치가 함께 움직이게 합니다. */}
      {view === "monthly" && (
        <div
          className="sm-month-view"
          role="region"
          aria-label="월간 달력"
          tabIndex={0}
        >
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
              // 공휴일 조건을 먼저 검사해 공휴일 색상이 주말 색상보다 우선하게 합니다.
              // getDay()는 일요일=0, 토요일=6입니다. 앞의 weekDays 배열 인덱스와는 순서가 다릅니다.
              let dateColor = "";
              if (holidayName) dateColor = "holiday";
              else if (weekday === 0) dateColor = "sunday";
              else if (weekday === 6) dateColor = "saturday";
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
                      onToggleFavorite={onToggleFavorite}
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
        </div>
      )}

      {/* 주간 날짜는 부모가 월요일부터 7개로 계산해 전달합니다.
          날짜 헤더/빈 공간은 날짜 선택, 내부 일정 버튼은 내용 수정으로 구분됩니다. */}
      {view === "weekly" && (
        <div className="sm-week-view">
          {weekDates.map(({ date, key }, index) => {
            const dayItems = dateItems(key);
            let dayClass = "";
            if (index === 5) dayClass = "saturday";
            else if (index === 6) dayClass = "sunday";
            return (
              <div
                className={`sm-week-column ${selectedDate === key ? "selected" : ""}`}
                key={key}
                onClick={() => onSelectDate(key)}
              >
                <button
                  type="button"
                  className={`sm-week-date ${dayClass}`}
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
          보기만 바꾸며 일정을 새로 저장하거나 복제하지 않습니다.
          key에 이름 검색값을 넣어 검색이 바뀌면 펼침 상태를 새 검색 결과 기준으로 초기화합니다. */}
      {view === "staff" && (
        <ScheduleStaffWeek
          key={staffPersonSearch || "all"}
          people={staffPeople}
          personSearch={staffPersonSearch}
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
          {view === "hourly" && hours.map((hour) => {
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
            })}
          {/* 중첩 삼항 연산자 대신 조건을 나눕니다. 일별일 때만 일정 또는 빈 안내를 표시합니다. */}
          {view === "daily" && renderItems(selectedItems)}
          {view === "daily" && selectedItems.length === 0 && (
            <p className="sm-empty">선택한 날짜에 등록된 일정이 없습니다.</p>
          )}
        </div>
      )}
    </section>
  );
}
