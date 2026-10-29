/* [파일 안내] 월별·주별·일별 달력 표시
 * 입력: Manager에서 계산한 날짜·일정·보기 상태
 * 연결: 일정 카드는 ScheduleItemParts, 담당자별 주간 표는 ScheduleStaffWeek
 * 출력: 날짜 선택·기간 이동·보기 전환·즐겨찾기를 부모 콜백에 전달합니다.
 */

/* 표시 데이터는 Manager에서 받고, 사용자 동작은 콜백으로 전달합니다. 이 파일에서 저장소를 수정하지 않습니다. */
import { ScheduleEvent, ScheduleIcon } from "./ScheduleItemParts";
import React from "react";
import {
  groupSchedulesByDate,
  weekDays,
} from "./scheduleData";
import ScheduleStaffWeek from "./ScheduleStaffWeek";


/* 선택 날짜 이동과 일정 열기는 별도 동작입니다. 날짜 이동은 Manager에 전달하고,
 * 일정 선택은 선택 날짜의 상세 패널을 갱신합니다. 수정 창은 상세 패널의 수정 버튼으로 엽니다. 월·주·일·담당자별 보기를 이 컴포넌트에서 표시합니다.
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
  onClearFilters,
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
  // 월간 날짜 칸·주간 열·일간 목록이 같은 날짜 묶음을 사용합니다.
  // 원본 일정이 여러 날 또는 반복이면 Manager가 이미 날짜별 항목으로 펼쳐서 전달합니다.
  const schedulesByDate = groupSchedulesByDate(visibleItems);
  const dateItems = (date) => schedulesByDate[date] || [];
  const selectedItems = dateItems(selectedDate);
  // 월간 이외 보기의 카드를 만듭니다. 카드 선택은 onSelectSchedule, 별표는 onToggleFavorite로 분리됩니다.
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
            aria-label="공유 구분 필터"
            value={scopeFilter}
            onChange={(event) => onScopeFilterChange(event.target.value)}
          >
            <option value="all">공유 구분 전체</option>
            <option value="shared">회사 공유</option>
            <option value="private">개인 표시</option>
          </select>
          {(query || selectedProject || scopeFilter !== "all") && (
            <button type="button" className="sm-list-all-btn" onClick={onClearFilters}>검색·필터 초기화</button>
          )}
        </div>
      </div>

      {/* 검색 결과는 별도 오른쪽 카드 대신 달력 위의 짧은 안내로 표시합니다. */}
      {query.trim() && (
        <div className="sm-calendar-search-summary">
          <span>검색 결과 {visibleItems.length}건</span>
        </div>
      )}

      {/* 보기 탭의 선택값은 view가 관리하며, role·aria-selected로 선택 상태를 알립니다. */}
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

      {/* 담당자별 주간 보기에는 계산된 발생 일정과 팀원 목록을 전달합니다. 표 내부 펼침 상태는 보기 전환 시 초기화됩니다. */}
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
          {selectedItems.length === 0 && <p className="sm-empty">
            {query.trim() || selectedProject || scopeFilter !== "all"
              ? "선택한 날짜에 조건과 일치하는 일정이 없습니다. 검색어나 필터를 변경해 주세요."
              : "선택한 날짜에 일정이 없습니다. 일정 등록 버튼으로 추가해 보세요."}
          </p>}
        </div>
      )}
    </section>
  );
}
