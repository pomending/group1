import React, { useEffect, useMemo, useState } from "react";
import ScheduleCalendar from "./ScheduleCalendar";
import ScheduleFormModal from "./ScheduleFormModal";
import ScheduleListModal from "./ScheduleListModal";
import ScheduleSidebar from "./ScheduleSidebar";
import {
  createEmptyForm,
  dateKey,
  getTodayKey,
  scheduleTypes,
  typeColors,
} from "./scheduleData";
import "./scheduleStyles.css";

// 브라우저에 저장된 JSON과 일정 필수 항목을 검사해 안전한 배열로 돌려줍니다.
function loadSchedules() {
  try {
    const savedItems = JSON.parse(
      localStorage.getItem("made-mate-schedules") || "[]",
    );
    if (!Array.isArray(savedItems)) return [];

    return savedItems
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          ["string", "number"].includes(typeof item.id) &&
          /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
          typeof item.time === "string" &&
          typeof item.title === "string",
      )
      .map((item) => ({
        ...item,
        project: typeof item.project === "string" ? item.project : "",
        person: typeof item.person === "string" ? item.person : "",
        type: scheduleTypes.includes(item.type) ? item.type : "기획",
        color: typeColors[item.type] || typeColors["기획"],
      }));
  } catch {
    // JSON이 깨졌거나 브라우저 저장소 접근이 막혀 있으면 빈 일정으로 시작합니다.
    return [];
  }
}

export default function ScheduleManager() {
  // 화면에서 변하는 값은 useState로 저장합니다. 상태가 바뀌면 React가 화면을 다시 그립니다.
  // month는 달력에서 보고 있는 달의 첫 날짜를 보관합니다.
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  // 오늘 날짜를 state로 두어 자정이 지난 뒤에도 최신 날짜 기준을 유지합니다.
  const [todayKey, setTodayKey] = useState(getTodayKey);
  // selectedDate는 선택한 날짜를 YYYY-MM-DD 문자열로 보관합니다.
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [query, setQuery] = useState("");
  // 저장값 중 형식이 올바른 일정만 state로 불러옵니다.
  const [items, setItems] = useState(loadSchedules);
  const [storageError, setStorageError] = useState(false);
  // 등록 창, 전체 일정 창, 수정 중인 일정의 ID도 화면 상태로 관리합니다.
  const [formOpen, setFormOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [listDateFilter, setListDateFilter] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState(null);
  const calendarYear = month.getFullYear();
  const [holidayInfo, setHolidayInfo] = useState({
    year: null,
    dates: {},
    error: false,
  });

  const selectedDateObject = new Date(`${selectedDate}T00:00:00`);
  // 선택 날짜나 표시 연도와 공휴일 데이터의 연도가 다르면 공휴일 이름을 표시하지 않습니다.
  const selectedHoliday =
    holidayInfo.year === selectedDateObject.getFullYear()
      ? holidayInfo.dates[selectedDate]
      : "";
  const holidayDates =
    holidayInfo.year === calendarYear ? holidayInfo.dates : {};

  // 일정 목록이 바뀔 때 브라우저 저장소를 갱신해 새로고침 뒤에도 유지합니다.
  useEffect(() => {
    try {
      localStorage.setItem("made-mate-schedules", JSON.stringify(items));
      setStorageError(false);
    } catch {
      // 용량 초과나 저장소 차단 시에도 화면을 유지하고 저장 실패를 안내합니다.
      setStorageError(true);
    }
  }, [items]);

  // 다음 자정에 오늘 날짜를 갱신합니다. 오늘을 보고 있었다면 새 날짜를 선택합니다.
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );
    const timer = window.setTimeout(() => {
      const nextTodayKey = getTodayKey();
      setTodayKey(nextTodayKey);
      setSelectedDate((current) =>
        current === todayKey ? nextTodayKey : current,
      );
      setMonth((current) => {
        const oldToday = new Date(`${todayKey}T00:00:00`);
        if (
          current.getFullYear() === oldToday.getFullYear() &&
          current.getMonth() === oldToday.getMonth()
        ) {
          return new Date(
            nextMidnight.getFullYear(),
            nextMidnight.getMonth(),
            1,
          );
        }
        return current;
      });
    }, nextMidnight.getTime() - now.getTime());

    return () => window.clearTimeout(timer);
  }, [todayKey]);

  // 현재 연도의 한국 공휴일을 가져와 날짜별로 빠르게 찾을 수 있게 정리합니다.
  useEffect(() => {
    let active = true;

    fetch(`https://date.nager.at/api/v3/PublicHolidays/${calendarYear}/KR`)
      .then((response) => {
        if (!response.ok) throw new Error("Holiday request failed");
        return response.json();
      })
      .then((holidays) => {
        // API 응답 배열을 { 날짜: 공휴일 이름 } 형태로 바꾸어 달력에서 조회합니다.
        const dates = Object.fromEntries(
          holidays.map((holiday) => [
            holiday.date,
            holiday.localName || holiday.name,
          ]),
        );
        if (active) setHolidayInfo({ year: calendarYear, dates, error: false });
      })
      .catch(() => {
        if (active)
          setHolidayInfo({ year: calendarYear, dates: {}, error: true });
      });

    // 연도를 바꾼 뒤 늦게 도착한 이전 요청이 상태를 덮어쓰지 않게 합니다.
    return () => {
      active = false;
    };
  }, [calendarYear]);

  // 검색어와 일치하는 일정만 달력과 선택 날짜 목록에 표시합니다.
  const visibleItems = items.filter((item) =>
    `${item.title} ${item.project} ${item.person}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const selectedItems = visibleItems.filter(
    (item) => item.date === selectedDate,
  );

  // 해당 월의 날짜를 월요일 시작 달력 격자에 맞춰 계산합니다.
  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    // JS의 일요일 시작 인덱스를 월요일 시작 달력에 맞는 빈칸 수로 바꿉니다.
    const startOffset = (first.getDay() + 6) % 7;
    const dayCount = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();

    // 날짜 수에 앞뒤 빈칸을 더하고, 행 수를 7의 배수로 맞춰 달력 칸을 만듭니다.
    return Array.from(
      { length: Math.ceil((startOffset + dayCount) / 7) * 7 },
      (_, index) => {
        const day = index - startOffset + 1;
        if (day < 1 || day > dayCount) return null;

        const date = new Date(month.getFullYear(), month.getMonth(), day);
        return { date, key: dateKey(date) };
      },
    );
  }, [month]);

  // 달력의 월 이동, 날짜 선택과 폼 입력을 처리하는 함수입니다.
  const changeMonth = (delta) =>
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  const selectDate = (date) => {
    setSelectedDate(date);
    setMonth(new Date(`${date}T00:00:00`));
  };
  const updateForm = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  // 폼 제출 시 새 일정이면 추가하고, 수정 중이면 같은 ID의 일정만 교체합니다.
  const addSchedule = (event) => {
    event.preventDefault();
    const item = {
      ...form,
      id: editingId ?? Date.now(),
      color: typeColors[form.type],
    };

    setItems((current) =>
      (editingId
        ? current.map((schedule) =>
            schedule.id === editingId ? item : schedule,
          )
        : [...current, item]
      ).sort((first, second) =>
        `${first.date} ${first.time}`.localeCompare(
          `${second.date} ${second.time}`,
        ),
      ),
    );
    selectDate(form.date);
    setQuery("");
    setForm(createEmptyForm());
    setEditingId(null);
    setFormOpen(false);
  };
  // 등록 버튼은 이전 수정 상태를 비우고 빈 폼으로 엽니다.
  const openNewSchedule = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setFormOpen(true);
  };
  const closeScheduleForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(createEmptyForm());
  };
  // 선택한 일정 정보를 폼에 채워 수정 화면을 엽니다.
  const editSchedule = (item) => {
    setEditingId(item.id);
    setForm({
      date: item.date,
      time: item.time,
      title: item.title,
      project: item.project,
      person: item.person,
      type: item.type,
    });
    setListOpen(false);
    setFormOpen(true);
  };
  // 삭제 전에 확인을 받고, 선택한 일정만 목록에서 제거합니다.
  const deleteSchedule = (item) => {
    if (!window.confirm(`'${item.title}' 일정을 삭제할까요?`)) return;
    setItems((current) =>
      current.filter((schedule) => schedule.id !== item.id),
    );
  };
  // 달력에서 더보기를 누르면 해당 날짜 일정만 필터링한 목록을 엽니다.
  const showDateSchedules = (date) => {
    setSelectedDate(date);
    setListDateFilter(date);
    setListOpen(true);
  };
  // 상단 전체 일정 버튼은 날짜 필터를 해제하고 모든 일정을 보여줍니다.
  const showAllSchedules = () => {
    setListDateFilter(null);
    setListOpen(true);
  };

  // 대시보드 통계는 저장된 전체 일정에서 계산합니다.
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekStartKey = dateKey(weekStart);
  const weekEndKey = dateKey(weekEnd);
  // 마감 통계에는 작업 구분이 '마감' 또는 '출고'인 일정만 포함합니다.
  const isDeadline = (item) => item.type === "마감" || item.type === "출고";
  const weekDeadlineCount = items.filter(
    (item) =>
      isDeadline(item) && item.date >= weekStartKey && item.date <= weekEndKey,
  ).length;
  // 오늘을 포함해 4일 동안의 마감만 골라 날짜·시간 순서로 보여줍니다.
  const deadlineWindowEnd = new Date(`${todayKey}T00:00:00`);
  deadlineWindowEnd.setDate(deadlineWindowEnd.getDate() + 3);
  const deadlineWindowEndKey = dateKey(deadlineWindowEnd);
  const upcomingDeadlines = items
    .filter(
      (item) =>
        isDeadline(item) &&
        item.date >= todayKey &&
        item.date <= deadlineWindowEndKey,
    )
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  // 상태별 진행 수가 아니라 일정에 입력된 서로 다른 프로젝트명 개수입니다.
  const projectCount = new Set(
    items.map((item) => item.project).filter(Boolean),
  ).size;
  const assigneeCount = new Set(
    items.map((item) => item.person).filter(Boolean),
  ).size;
  const todayWorkCount = items.filter((item) => item.date === todayKey).length;
  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`;

  return (
    <main className="schedule-app">
      <div className="sm-shell">
        {/* 회사와 사용자 정보를 보여주는 상단 영역 */}
        <header className="sm-top">
          <div className="sm-brand">
            <div className="sm-mark">✦</div>메이드메이트{" "}
            <span className="sm-muted">WORKSPACE</span>
          </div>
          <div className="sm-top-right">
            <span>굿즈 제작 운영팀</span>
            <span>도움말</span>
            <div className="sm-avatar">민</div>
          </div>
        </header>

        <section className="sm-heading">
          <div>
            <div className="sm-eyebrow">WORK MANAGEMENT</div>
            <h1>일정 관리</h1>
            <p>프로젝트와 팀의 일정을 한눈에 확인하세요.</p>
          </div>
          <div className="sm-heading-actions">
            <button className="sm-secondary-btn" onClick={showAllSchedules}>
              전체 일정 ({items.length})
            </button>
            <button className="sm-btn" onClick={openNewSchedule}>
              ＋ 일정 등록
            </button>
          </div>
        </section>

        {storageError && (
          <p className="sm-storage-warning" role="alert">
            브라우저에 일정을 저장하지 못했습니다. 새로고침하면 변경 내용이
            사라질 수 있습니다.
          </p>
        )}

        {/* 현재 일정 데이터에서 요약 숫자를 만들어 표시합니다. */}
        <section className="sm-stats">
          <div className="sm-stat">
            <div>
              <div className="sm-stat-label">일정 등록 프로젝트</div>
              <div className="sm-stat-value">{projectCount}</div>
            </div>
            <div className="sm-stat-icon">▦</div>
          </div>
          <div className="sm-stat">
            <div>
              <div className="sm-stat-label">오늘의 작업</div>
              <div className="sm-stat-value">
                {todayWorkCount}
                <span className="sm-muted"> 건</span>
              </div>
            </div>
            <div className="sm-stat-icon">◷</div>
          </div>
          <div className="sm-stat">
            <div>
              <div className="sm-stat-label">이번 주 마감</div>
              <div className="sm-stat-value">
                {weekDeadlineCount}
                <span className="sm-muted"> 건</span>
              </div>
            </div>
            <div className="sm-stat-icon">⚑</div>
          </div>
          <div className="sm-stat">
            <div>
              <div className="sm-stat-label">배정된 팀원</div>
              <div className="sm-stat-value">
                {assigneeCount}
                <span className="sm-muted"> 명</span>
              </div>
            </div>
            <div className="sm-stat-icon">♙</div>
          </div>
        </section>

        {/* 달력과 오른쪽 일정 패널을 각각 별도 컴포넌트로 표시합니다. */}
        <div className="sm-layout">
          <ScheduleCalendar
            monthLabel={monthLabel}
            onChangeMonth={changeMonth}
            query={query}
            onQueryChange={setQuery}
            holidayInfo={holidayInfo}
            calendarYear={calendarYear}
            holidayDates={holidayDates}
            calendarDays={calendarDays}
            visibleItems={visibleItems}
            selectedDate={selectedDate}
            todayKey={todayKey}
            onSelectDate={setSelectedDate}
            onShowMore={showDateSchedules}
          />
          <ScheduleSidebar
            selectedDate={selectedDate}
            selectedDateObject={selectedDateObject}
            selectedHoliday={selectedHoliday}
            selectedItems={selectedItems}
            upcomingDeadlines={upcomingDeadlines}
            onSelectDate={selectDate}
            onDelete={deleteSchedule}
            onEdit={editSchedule}
          />
        </div>
      </div>

      {/* 등록 폼은 열려 있을 때만 별도 모달 컴포넌트로 보여줍니다. */}
      {formOpen && (
        <ScheduleFormModal
          form={form}
          onChange={updateForm}
          onSubmit={addSchedule}
          onClose={closeScheduleForm}
          isEditing={editingId !== null}
        />
      )}
      {listOpen && (
        <ScheduleListModal
          items={items}
          filterDate={listDateFilter}
          onClearDateFilter={() => setListDateFilter(null)}
          onSelectDate={(date) => {
            selectDate(date);
            setListOpen(false);
          }}
          onDelete={deleteSchedule}
          onEdit={editSchedule}
          onClose={() => setListOpen(false)}
        />
      )}
    </main>
  );
}
