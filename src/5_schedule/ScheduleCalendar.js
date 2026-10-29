/* [파일 안내] 월별·주별·일별 달력 표시
 * 입력: Manager에서 계산한 날짜·일정·보기 상태
 * 연결: 일정 카드는 ScheduleItemParts, 담당자별 주간 표는 ScheduleStaffWeek
 * 출력: 날짜 선택·기간 이동·보기 전환·즐겨찾기를 부모 콜백에 전달합니다.
 */

/* [달력에서 누른 버튼이 데이터를 바꾸는 과정]
 * 이 파일은 부모가 준 일정을 표시합니다. 여기서 localStorage를 직접 수정하지 않습니다.
 * 예를 들어 별표를 누르면 자식 부품 → onToggleFavorite(item) → Manager의 원본 변경으로 이어집니다.
 * Manager가 새 원본을 계산해 다시 전달하면 달력의 별 색깔도 그 값에 맞춰 다시 표시됩니다.
 * view가 monthly면 월간, weekly면 주간, daily면 하루, staff면 사람별 주간 화면을 만듭니다.
 * 조건 && JSX는 조건이 참일 때만 해당 화면 조각을 생성한다는 뜻입니다.
 * 날짜 칸과 내부 버튼 모두 클릭 처리가 있으므로 stopPropagation으로 한 클릭이 두 동작을 실행하지 않게 합니다.
 */
import { ScheduleEvent, ScheduleIcon } from "./ScheduleItemParts";
/* 부모가 계산한 일정을 표시하고 클릭 결과를 콜백으로 전달합니다. */
import React from "react";
import {
  groupSchedulesByDate,
  weekDays,
} from "./scheduleData";
import ScheduleStaffWeek from "./ScheduleStaffWeek";


/* 선택 날짜 이동과 일정 열기는 별도 동작입니다. 날짜 이동은 Manager에 전달하고,
 * 일정 선택은 수정 창을 엽니다. 월·주·일·담당자별 보기를 이 컴포넌트에서 표시합니다.
 */
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
  onSelectSchedule,
  onToggleFavorite,
}) {
  // 한 번 정렬해 날짜별로 묶습니다. 날짜 칸이 늘어도 전체 배열을 매번 filter/sort하지 않습니다.
  const schedulesByDate = groupSchedulesByDate(visibleItems);
  const dateItems = (date) => schedulesByDate[date] || [];
  const selectedItems = dateItems(selectedDate);
  const renderItems = (items) =>
    items.map((item) => (
      <ScheduleEvent key={item.id} item={item} onSelect={onSelectSchedule}
        onToggleFavorite={onToggleFavorite} />
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
          {/* div가 입력창과 아이콘 버튼을 하나의 검색 영역으로 묶습니다.
              화면에 보이는 순서대로 JSX를 배치해 Tab 키도 검색 → 필터 순으로 이동합니다.
              검색 값과 onChange는 그대로 두고, 외형만 공통 입력 영역으로 꾸밉니다. */}
          <div className="sm-search-field">
            <ScheduleIcon name="search" />
            <input
              className="sm-search"
              placeholder="일정·프로젝트·담당자·참석자 검색"
              aria-label="일정 검색"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
            {/* 검색어만 비웁니다. 기간·공개 범위·업무 상태는 변경하지 않습니다. */}
            <button type="button" className="sm-search-reset" aria-label="검색 초기화"
              title="검색 초기화" disabled={!query} onClick={() => onQueryChange("")}>
              <ScheduleIcon name="reset" />
            </button>
          </div>
          <select
            aria-label="일정 구분"
            value={scopeFilter}
            onChange={(event) => onScopeFilterChange(event.target.value)}
          >
            <option value="all">전체 일정</option>
            <option value="shared">회사 공유</option>
            <option value="private">개인 일정</option>
          </select>
        </div>
      </div>

      {/* 검색 결과는 별도 오른쪽 카드 대신 달력 위의 짧은 안내로 표시합니다. */}
      {query.trim() && (
        <div className="sm-calendar-search-summary">
          <span>검색 결과 {visibleItems.length}건</span>
        </div>
      )}

      {/* [내부 값, 표시 이름] 배열을 구조 분해해 탭을 만듭니다. 선택 여부는 view와 비교합니다.
          onClick={() => ...}는 함수를 넘기는 문법입니다. 렌더링 중이 아니라 클릭했을 때 실행됩니다.
          role과 aria-selected는 보조 기기에 탭과 선택 상태를 설명합니다. */}
      <div className="sm-view-tabs" role="tablist" aria-label="일정 보기 방식">
        {[
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
          요일과 날짜 격자를 같은 div에 넣어 가로 스크롤할 때 열 위치가 함께 움직이게 합니다. */}
      {view === "monthly" && (
        <div
          className="sm-month-view"
          role="region"
          aria-label="월간 달력"
          tabIndex={0}
        >
          <div className="sm-grid">
            {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
              <div
                className={`sm-weekday ${index === 6 ? "saturday" : ""} ${index === 0 ? "sunday" : ""}`}
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
              // getDay()는 일요일=0, 토요일=6이며 월별 헤더의 순서와 같습니다. 주간용 weekDays 배열은 월요일 시작입니다.
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
                      onSelect={onSelectSchedule}
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
          onToggleFavorite={onToggleFavorite}
          people={staffPeople}
          personSearch={staffPersonSearch}
          weekDates={weekDates}
          items={visibleItems}
          selectedDate={selectedDate}
          holidayDates={holidayDates}
          onSelectDate={onSelectDate}
          onSelectSchedule={onSelectSchedule}
        />
      )}

      {/* 일별은 선택 날짜의 일정을 시간순으로 보여줍니다. */}
      {view === "daily" && (
        <div className="sm-day-view">
          {renderItems(selectedItems)}
          {selectedItems.length === 0 && <p className="sm-empty">선택한 날짜에 등록된 일정이 없습니다.</p>}
        </div>
      )}
    </section>
  );
}
