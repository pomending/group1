import React, { useEffect, useMemo, useState } from "react";
import ScheduleCalendar from "./ScheduleCalendar";
import ScheduleFormModal from "./ScheduleFormModal";
import ScheduleListModal from "./ScheduleListModal";
import ScheduleSidebar from "./ScheduleSidebar";
import {
  createScheduleForm,
  compareSchedules,
  excludeOccurrence,
  getWeekDates,
  expandSchedules,
  dateKey,
  getTodayKey,
  normalizeAttendees,
  getSchedulePeople,
  scheduleTypes,
  normalizeStatus,
  getRepeatInterval,
  typeColors,
} from "./scheduleData";
import "./scheduleStyles.css";

// 브라우저에 저장된 JSON과 일정 필수 항목을 검사해 안전한 배열로 돌려줍니다.
// localStorage는 문자열만 저장합니다. JSON.parse가 저장 문자열을 배열·객체로 복원합니다.
// 이 목록은 현재 브라우저에만 저장되며 MySQL 서버에서 가져오는 데이터는 아닙니다.
function loadSchedules() {
  try {
    const savedItems = JSON.parse(
      localStorage.getItem("made-mate-schedules") || "[]",
    );
    if (!Array.isArray(savedItems)) return [];

    // filter는 최소 형태가 맞는 항목만 남기고 map은 각 항목에 기본값을 채웁니다.
    // 날짜 정규식은 YYYY-MM-DD 모양만 검사하며 실제 존재하는 날짜까지 확인하는 것은 아닙니다.
    const normalized = savedItems
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
        // 원본을 먼저 복사하고 아래 속성으로 덮어써 과거 데이터의 누락값도 보완합니다.
        ...item,
        project: typeof item.project === "string" ? item.project : "",
        person: typeof item.person === "string" ? item.person : "",
        // 이전 일정에는 attendees가 없을 수 있습니다. []로 보완하면 새 표에서도 안전하게 읽습니다.
        // 저장 배열에 중복/공백이 있더라도 불러오는 시점에 같은 정리 규칙을 다시 적용합니다.
        attendees: normalizeAttendees(item.attendees),
        description:
          typeof item.description === "string" ? item.description : "",
        type: scheduleTypes.includes(item.type) ? item.type : "기획",
        // 과거 저장 데이터에는 status가 없으므로 진행 전으로 보완합니다.
        status: normalizeStatus(item.status),
        visibility: item.visibility === "private" ? "private" : "shared",
        repeatInterval: getRepeatInterval(item),
        repeatType: ["weekly", "monthly"].includes(item.repeatType)
          ? item.repeatType
          : "none",
        color: typeColors[item.type] || typeColors["기획"],
      }));
    // 이전 버전에서 날짜별로 저장한 반복 항목은 하나의 반복 규칙으로 합칩니다.
    // Set은 중복 값을 저장하지 않습니다. 날짜순으로 읽어 같은 seriesId의 첫 항목만 남깁니다.
    // 마지막 map은 구조 분해로 이전 종료일·그룹 필드를 빼고 나머지 속성만 반환합니다.
    const seenSeries = new Set();
    return normalized
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter((item) => {
        if (!item.seriesId || item.repeatType === "none") return true;
        if (seenSeries.has(item.seriesId)) return false;
        seenSeries.add(item.seriesId);
        return true;
      })
      .map(({ repeatUntil, seriesId, biweekly, ...item }) => item);
  } catch {
    // JSON이 깨졌거나 브라우저 저장소 접근이 막혀 있으면 빈 일정으로 시작합니다.
    return [];
  }
}

/*
 * [공부 순서 2] 상태와 화면이 연결되는 흐름
 * loadSchedules → items state → 검색 필터 → 반복 날짜 계산 → 자식 컴포넌트의 props 순서입니다.
 * 자식에서 입력·클릭하면 부모가 전달한 함수를 호출하고, 그 함수가 state를 바꿉니다.
 * React는 바뀐 state로 다시 렌더링하며, 저장 effect는 새 원본 목록을 localStorage에 기록합니다.
 * items는 저장 원본, filteredItems는 검색 결과, visibleItems는 날짜별 반복 계산 결과입니다.
 */
export default function ScheduleManager() {
  // 화면에서 변하는 값은 useState로 저장합니다. 상태가 바뀌면 React가 화면을 다시 그립니다.
  // month는 표시할 연·월을 결정하는 Date입니다. 초기값은 1일이고, 날짜 선택 시 선택 날짜로 바뀔 수 있습니다.
  // useState에 초기화 함수를 전달하면 일반 재렌더링마다 초기값을 다시 계산하지 않습니다.
  // [현재 값, 변경 함수] 형태로 반환되며 변경 함수를 호출하면 새 화면 계산을 예약합니다.
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  // 오늘 날짜를 state로 두어 자정이 지난 뒤에도 최신 날짜 기준을 유지합니다.
  const [todayKey, setTodayKey] = useState(getTodayKey);
  // selectedDate는 선택한 날짜를 YYYY-MM-DD 문자열로 보관합니다.
  const [selectedDate, setSelectedDate] = useState(todayKey);
  // query=검색 문자열, view=시간/일/주/월 보기, scopeFilter=전체/공유/개인 분류입니다.
  // 개인/공유는 화면 분류 값이며 사용자별 접근 권한을 검사하는 기능은 아닙니다.
  const [query, setQuery] = useState("");
  const [view, setView] = useState("monthly");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  // 저장값 중 형식이 올바른 일정만 state로 불러옵니다.
  const [items, setItems] = useState(loadSchedules);
  const [storageError, setStorageError] = useState(false);
  // 등록 창, 전체 일정 창, 수정 중인 일정의 ID도 화면 상태로 관리합니다.
  const [listOpen, setListOpen] = useState(false);
  // null이면 원본 전체 목록, 날짜 문자열이면 그날에 실제 발생하는 목록을 표시합니다.
  const [listDateFilter, setListDateFilter] = useState(null);
  // form=null이면 닫힌 상태입니다. 열림 여부를 별도 state로 중복 보관하지 않습니다.
  const [form, setForm] = useState(null);
  // null이면 신규 등록, 객체이면 수정할 원본 ID와 특정 반복 날짜를 함께 보관합니다.
  const [editing, setEditing] = useState(null);
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
      // 펼친 반복 날짜가 아닌 원본 items만 JSON 문자열로 바꾸어 저장합니다.
      localStorage.setItem("made-mate-schedules", JSON.stringify(items));
      setStorageError(false);
    } catch {
      // 용량 초과나 저장소 차단 시에도 화면을 유지하고 저장 실패를 안내합니다.
      setStorageError(true);
    }
    // 의존성 배열의 items가 바뀔 때 실행되므로 검색이나 보기 전환만으로는 저장하지 않습니다.
  }, [items]);

  // 다음 자정에 오늘 날짜를 갱신합니다. 오늘을 보고 있었다면 새 날짜를 선택합니다.
  useEffect(() => {
    const now = new Date();
    // 오늘의 다음 날을 만들고 시간을 생략하면 자정입니다. 월말·연말도 Date가 계산합니다.
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

    // effect 재실행 전이나 화면이 사라질 때 이전 타이머를 지워 중복 실행을 막습니다.
    // todayKey가 갱신되면 아래 의존성 때문에 다음 자정 타이머를 다시 설정합니다.
    return () => window.clearTimeout(timer);
  }, [todayKey]);

  // 현재 연도의 한국 공휴일을 가져와 날짜별로 빠르게 찾을 수 있게 정리합니다.
  useEffect(() => {
    // 이번 effect의 응답을 반영해도 되는지 표시합니다. 요청 자체를 취소하는 값은 아닙니다.
    // 연도를 바꾸면 cleanup에서 false로 바꿔 이전 요청이 늦게 도착해도 무시하게 합니다.
    let active = true;

    fetch(`https://date.nager.at/api/v3/PublicHolidays/${calendarYear}/KR`)
      .then((response) => {
        // fetch는 HTTP 오류여도 응답할 수 있어 ok를 직접 확인합니다.
        // throw는 catch로 보내고, 정상 응답은 response.json()으로 비동기 변환합니다.
        if (!response.ok) throw new Error("Holiday request failed");
        return response.json();
      })
      .then((holidays) => {
        // API 응답 배열을 { 날짜: 공휴일 이름 } 형태로 바꾸어 달력에서 조회합니다.
        // map이 [날짜, 이름] 쌍을 만들고 fromEntries가 { 날짜: 이름 } 객체로 바꿉니다.
        // 달력에서는 날짜 문자열을 키로 사용해 공휴일 이름을 바로 찾습니다.
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

  // 검색은 저장 원본에 한 번만 적용합니다. 입력 중 폼 state만 바뀌면 같은 결과 배열을 재사용합니다.
  // 참석자도 이름 검색에 포함되며, 개인/공유는 분류 필터입니다(접근 권한 검사가 아닙니다).
  const filteredItems = useMemo(() => {
    const keyword = query.toLowerCase();
    return items.filter(
      (item) =>
        (scopeFilter === "all" || item.visibility === scopeFilter) &&
        (statusFilter === "all" || item.status === statusFilter) &&
        [item.title, item.project, ...getSchedulePeople(item)]
          .join(" ")
          .toLowerCase()
          .includes(keyword),
    );
  }, [items, query, scopeFilter, statusFilter]);

  // 월 양쪽 7일을 포함해 월 경계의 주별 표도 준비합니다. 반복 규칙은 조회 기간만 펼칩니다.
  const visibleItems = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), -6);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 7);
    return expandSchedules(filteredItems, dateKey(first), dateKey(last));
  }, [filteredItems, month]);
  // 선택 날짜가 표시 월 밖일 수도 있어 선택 날짜 패널은 별도 하루 범위로 계산합니다.
  const selectedItems = useMemo(
    () => expandSchedules(filteredItems, selectedDate, selectedDate),
    [filteredItems, selectedDate],
  );

  // 해당 월의 날짜를 월요일 시작 달력 격자에 맞춰 계산합니다.
  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    // JS의 일요일 시작 인덱스를 월요일 시작 달력에 맞는 빈칸 수로 바꿉니다.
    // 월요일(1)은 (1+6)%7=0칸, 일요일(0)은 6칸이 되어 월요일 시작 표에 맞습니다.
    const startOffset = (first.getDay() + 6) % 7;
    const dayCount = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();

    // 날짜 수에 앞뒤 빈칸을 더하고, 행 수를 7의 배수로 맞춰 달력 칸을 만듭니다.
    // ceil은 올림입니다. 앞 빈칸+날짜가 32개면 5주 * 7=35칸을 생성합니다.
    // null은 빈칸, { date, key }는 실제 날짜 칸입니다. key는 검색·React 식별에 사용합니다.
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
  // current => 새 값 형태는 React가 관리하는 최신 state를 받아 다음 값을 계산합니다.
  // 기존 Date를 직접 수정하지 않고 새 객체로 교체해 React가 변경을 알 수 있게 합니다.
  const changeMonth = (delta) =>
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  // 자식은 -1/+1만 전달합니다. 이 함수에서 현재 보기의 이동 단위를 정합니다.
  const changePeriod = (delta) => {
    if (view === "monthly") {
      changeMonth(delta);
      return;
    }
    const date = new Date(`${selectedDate}T00:00:00`);
    // 주별과 담당자별 주간(staff)은 같은 7일 범위를 쓰므로 둘 다 한 주씩 이동합니다.
    // includes(view)가 true면 7, 일별/시간대별이면 1을 곱합니다.
    date.setDate(
      date.getDate() + delta * (["weekly", "staff"].includes(view) ? 7 : 1),
    );
    selectDate(dateKey(date));
  };
  // 날짜 선택과 표시 월을 같이 바꾸면 다른 달의 날짜로 이동할 때 달력도 따라갑니다.
  const selectDate = (date) => {
    setSelectedDate(date);
    setMonth(new Date(`${date}T00:00:00`));
  };
  // 입력창의 name과 form의 속성 이름을 맞춰 하나의 함수로 모든 입력을 처리합니다.
  // 예: name="title"이면 [event.target.name]이 title이 되어 그 속성만 덮어씁니다.
  // 숫자 입력은 빈칸일 때만 ""로 유지해 편집을 허용하고, 나머지는 숫자로 저장합니다.
  // 주간/월간 단위를 바꾸면 간격을 1로 초기화해 24개월이 24주로 잘못 이어지지 않게 합니다.
  const updateForm = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]:
        event.target.type === "number" && event.target.value !== ""
          ? Number(event.target.value)
          : event.target.value,
      ...(event.target.name === "repeatType" ? { repeatInterval: 1 } : {}),
    }));
  // item이 없으면 빈 폼, 있으면 수정용 폼입니다. 목록에서 수정해도 같은 함수를 사용합니다.
  const openScheduleForm = (item) => {
    setEditing(item || null);
    setForm(createScheduleForm(item));
    setListOpen(false);
  };
  const closeScheduleForm = () => {
    setForm(null);
    setEditing(null);
  };

  // 입력값은 이 시점에 저장 형태로 바꿉니다. 참석자 미입력은 []이며 필수 항목이 아닙니다.
  const addSchedule = (event) => {
    event.preventDefault();
    const occurrence = editing?.occurrenceDate;
    const item = {
      ...form,
      id:
        editing && !occurrence
          ? editing.id
          : "schedule-" +
            Date.now() +
            "-" +
            Math.random().toString(36).slice(2, 8),
      attendees: normalizeAttendees(form.attendees),
      color: typeColors[form.type],
      excludedDates: occurrence ? [] : editing?.excludedDates || [],
    };
    setItems((current) => {
      // 반복 한 번 수정은 원래 날짜를 제외하고 새 일반 일정을 추가합니다.
      // 원본 전체 수정은 같은 ID만 교체하고, 신규 등록은 새 항목을 추가합니다.
      const next = current.map((schedule) => {
        if (schedule.id !== editing?.id) return schedule;
        return occurrence ? excludeOccurrence(schedule, occurrence) : item;
      });
      if (!editing || occurrence) next.push(item);
      return next.sort(compareSchedules);
    });
    selectDate(form.date);
    setQuery("");
    closeScheduleForm();
  };
  // 날짜별 반복 항목의 상태를 바꾸면 그날만 일반 항목으로 분리합니다.
  // 원본 규칙의 status를 바꾸지 않아 다음 주/다음 달의 업무까지 완료되지 않습니다.
  const changeScheduleStatus = (item, value) => {
    const status = normalizeStatus(value);
    if (status === item.status) return;
    setItems((current) => {
      if (!item.occurrenceDate) {
        return current.map((schedule) =>
          schedule.id === item.id ? { ...schedule, status } : schedule,
        );
      }
      const { occurrenceDate, ...occurrence } = item;
      const updated = current.map((schedule) =>
        schedule.id === item.id
          ? excludeOccurrence(schedule, occurrenceDate)
          : schedule,
      );
      return [
        ...updated,
        {
          ...occurrence,
          id:
            "schedule-" +
            Date.now() +
            "-" +
            Math.random().toString(36).slice(2, 8),
          status,
          repeatType: "none",
          repeatInterval: 1,
          excludedDates: [],
        },
      ].sort(compareSchedules);
    });
  };

  // 특정 반복 날짜 삭제는 excludedDates에 날짜를 추가해 이후 계산에서 제외합니다.
  // 원본/일반 항목 삭제는 filter로 ID를 제거합니다. 확인 문구도 삭제 범위를 구분합니다.
  const deleteSchedule = (item) => {
    const repeated =
      item.repeatType === "weekly" || item.repeatType === "monthly";
    const label = item.occurrenceDate
      ? item.date + "의 일정"
      : repeated
        ? "전체 반복 일정"
        : "일정";
    if (!window.confirm("'" + item.title + "' " + label + "을 삭제할까요?"))
      return;
    setItems((current) =>
      item.occurrenceDate
        ? current.map((schedule) =>
            schedule.id === item.id
              ? excludeOccurrence(schedule, item.occurrenceDate)
              : schedule,
          )
        : current.filter((schedule) => schedule.id !== item.id),
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

  // 통계는 검색과 무관합니다. 프로젝트/팀원은 원본의 고유 이름 수를 셉니다.
  // 오늘 작업/주간 마감은 해당 기간에 펼친 실제 발생 횟수이므로 반복 일정도 포함됩니다.
  const currentWeek = getWeekDates(new Date(`${todayKey}T00:00:00`));
  const weekStartKey = currentWeek[0].key;
  const weekEndKey = currentWeek[6].key;
  // 마감 통계에는 작업 구분이 '마감' 또는 '출고'인 일정만 포함합니다.
  const isDeadline = (item) => item.type === "마감" || item.type === "출고";
  const weekDeadlineCount = expandSchedules(
    items,
    weekStartKey,
    weekEndKey,
  ).filter(isDeadline).length;
  // 오늘을 포함해 4일 동안의 마감만 골라 날짜·시간 순서로 보여줍니다.
  const deadlineWindowEnd = new Date(`${todayKey}T00:00:00`);
  deadlineWindowEnd.setDate(deadlineWindowEnd.getDate() + 3);
  const deadlineWindowEndKey = dateKey(deadlineWindowEnd);
  // expandSchedules가 범위 필터와 정렬을 완료하므로 같은 조건을 다시 검사하지 않습니다.
  const upcomingDeadlines = expandSchedules(
    items,
    todayKey,
    deadlineWindowEndKey,
  ).filter(isDeadline);
  // 상태별 진행 수가 아니라 일정에 입력된 서로 다른 프로젝트명 개수입니다.
  // map으로 이름만 추출 → filter(Boolean)으로 빈 이름 제외 → Set으로 중복 제거 → size로 개수 조회.
  const projectCount = new Set(
    items.map((item) => item.project).filter(Boolean),
  ).size;
  // 각 일정의 [담당자, 참석자들] 배열을 flatMap으로 하나로 합친 뒤 Set으로 전체 중복을 제거합니다.
  // 한 사람이 여러 일정에 있거나 담당/참석 역할을 겸해도 상단 팀원 수에는 한 번만 셉니다.
  const assigneeCount = new Set(items.flatMap(getSchedulePeople)).size;
  const todayWorkCount = expandSchedules(items, todayKey, todayKey).length;
  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`;
  const selectedDay = selectedDateObject;
  const weekDates = getWeekDates(selectedDay);
  // staff도 weekly와 같은 첫날~마지막 날 제목을 사용합니다. 보기만 바뀌고 날짜 기준은 같습니다.
  const periodLabel =
    view === "monthly"
      ? monthLabel
      : ["weekly", "staff"].includes(view)
        ? `${weekDates[0].date.getMonth() + 1}/${weekDates[0].date.getDate()} – ${weekDates[6].date.getMonth() + 1}/${weekDates[6].date.getDate()}`
        : `${selectedDay.getFullYear()}년 ${selectedDay.getMonth() + 1}월 ${selectedDay.getDate()}일 (${"일월화수목금토"[selectedDay.getDay()]})`;

  // 날짜 제한 전의 검색 결과에서 사람을 모아 이번 주 0건인 사람도 행으로 유지합니다.
  const staffPeople = [
    ...new Set(filteredItems.flatMap(getSchedulePeople)),
  ].sort((a, b) => a.localeCompare(b, "ko"));

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
            <button className="sm-btn" onClick={() => openScheduleForm()}>
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
          {[
            ["일정 등록 프로젝트", projectCount, "", "▦"],
            ["오늘의 작업", todayWorkCount, "건", "◷"],
            ["이번 주 마감", weekDeadlineCount, "건", "⚑"],
            ["배정된 팀원", assigneeCount, "명", "♙"],
          ].map(([label, count, unit, icon]) => (
            <div className="sm-stat" key={label}>
              <div>
                <div className="sm-stat-label">{label}</div>
                <div className="sm-stat-value">
                  {count}
                  {unit && <span className="sm-muted"> {unit}</span>}
                </div>
              </div>
              <div className="sm-stat-icon">{icon}</div>
            </div>
          ))}
        </section>

        {/* 달력과 오른쪽 일정 패널을 각각 별도 컴포넌트로 표시합니다. */}
        <div className="sm-layout">
          {/* 부모의 값과 함수를 props로 전달합니다. 자식은 함수를 호출해 부모 state 변경을 요청합니다. */}
          <ScheduleCalendar
            onOpenSchedule={openScheduleForm}
            view={view}
            onViewChange={setView}
            onChangePeriod={changePeriod}
            periodLabel={periodLabel}
            weekDates={weekDates}
            scopeFilter={scopeFilter}
            onScopeFilterChange={setScopeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            query={query}
            onQueryChange={setQuery}
            holidayError={
              holidayInfo.year === calendarYear && holidayInfo.error
            }
            holidayDates={holidayDates}
            calendarDays={calendarDays}
            visibleItems={visibleItems}
            staffPeople={staffPeople}
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
            onEdit={openScheduleForm}
            onStatusChange={changeScheduleStatus}
          />
        </div>
      </div>

      {/* form 객체가 있을 때만 폼을 표시합니다. 닫을 때 null로 초기화합니다. */}
      {form && (
        <ScheduleFormModal
          form={form}
          onChange={updateForm}
          onSubmit={addSchedule}
          onClose={closeScheduleForm}
          isEditing={editing !== null}
          isOccurrence={Boolean(editing?.occurrenceDate)}
        />
      )}
      {/* 전체 보기는 원본 규칙을 한 번씩, 날짜 더보기는 해당 날짜에 펼친 결과를 넘깁니다. */}
      {listOpen && (
        <ScheduleListModal
          items={
            listDateFilter
              ? expandSchedules(items, listDateFilter, listDateFilter)
              : items
          }
          filterDate={listDateFilter}
          totalCount={items.length}
          onStatusChange={changeScheduleStatus}
          onClearDateFilter={() => setListDateFilter(null)}
          onDelete={deleteSchedule}
          onEdit={openScheduleForm}
          onClose={() => setListOpen(false)}
        />
      )}
    </main>
  );
}
