import React, { useEffect, useRef, useState } from "react";
import ScheduleCalendar from "./ScheduleCalendar";
import ScheduleFormModal from "./ScheduleFormModal";
import ScheduleListModal from "./ScheduleListModal";
import ScheduleSidebar from "./ScheduleSidebar";
import ScheduleIcon from "./ScheduleIcon";
import { loadTeamMembers } from "./ScheduleTeamEditor";
import {
  createScheduleForm,
  compareSchedules,
  excludeOccurrence,
  getWeekDates,
  getScheduleFocusDate,
  getUpcomingSchedules,
  expandSchedules,
  dateKey,
  getTodayKey,
  normalizeAttendees,
  getSchedulePeople,
  scheduleTypes,
  normalizeStatus,
  getRepeatInterval,
  typeColors,
  isValidScheduleDate,
  isValidScheduleTime,
  MAX_REPEAT_INTERVAL,
} from "./scheduleData";
import "./scheduleStyles.css";

/* 이 파일에서 만나는 리액트 용어
 *
 * [렌더링] 컴포넌트 함수를 실행해 현재 값으로 어떤 화면을 보여줄지 계산하는 과정입니다.
 *           리액트는 이 계산 결과를 이전 결과와 비교하고 실제 화면에서 필요한 부분을 갱신합니다.
 * [state]  클릭·입력에 따라 바뀌고, 다음 렌더링에도 기억해야 하는 값입니다. useState로 만듭니다.
 * [props]  부모가 자식에게 전달하는 입력값입니다. 값뿐 아니라 함수도 전달할 수 있습니다.
 * [이벤트] 클릭(onClick), 입력 변경(onChange), 제출(onSubmit)처럼 사용자 동작에 연결한 처리입니다.
 * [Hook]   useState/useEffect/useRef처럼 함수 컴포넌트에서 리액트 기능을 사용하는 함수입니다.
 *           이 코드에서는 조건문이나 반복문 안이 아니라 컴포넌트의 위쪽에서 같은 순서로 호출합니다.
 *
 * 화면 동작을 하나 따라가 보세요: 검색창에 '김담당' 입력
 * ① Calendar의 onChange → 부모가 전달한 setQuery('김담당') 실행
 * ② query state가 바뀌어 Manager가 다시 렌더링됨
 * ③ filteredItems가 담당자 이름 등을 검색하고 visibleItems가 표시 기간의 반복 날짜를 계산함
 * ④ 새 배열을 props로 받은 Calendar와 Sidebar가 같은 검색 결과를 표시함
 * 검색은 원본 items를 바꾸지 않습니다. 저장할 일정과 화면에 보여줄 결과를 구분하는 것이 핵심입니다.
 */
// 새 일정과 반복에서 분리한 일정 모두 같은 방식으로 ID를 만듭니다.
// 시간에 난수를 더해 같은 밀리초에 여러 건을 만들어도 ID가 겹칠 가능성을 줄입니다.
const createScheduleId = () =>
  `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// 브라우저에 저장된 JSON과 일정 필수 항목을 검사해 안전한 배열로 돌려줍니다.
// localStorage는 문자열만 저장합니다. JSON.parse가 저장 문자열을 배열·객체로 복원합니다.
// 이 목록은 현재 브라우저에만 저장되며 MySQL 서버에서 가져오는 데이터는 아닙니다.
function loadSchedules() {
  // try 안에서 저장소 접근이나 JSON 해석이 실패하면 catch로 이동합니다.
  // JSON은 배열·객체를 문자열로 표현하는 형식입니다. parse는 문자열을 다시 JS 값으로 바꿉니다.
  // '[]'는 빈 배열을 나타내는 JSON 문자열이며, 아직 저장한 자료가 없을 때 기본값으로 사용합니다.
  try {
    const raw = localStorage.getItem("made-mate-schedules");
    const savedItems = JSON.parse(raw || "[]");
    if (!Array.isArray(savedItems)) throw new Error("Invalid schedule data");

    // 저장 항목을 하나씩 검사합니다. continue를 만나면 그 항목을 건너뛰고 다음 항목을 검사합니다.
    // 날짜·시간과 반복 제외일도 검사해 잘못된 저장 자료가 달력 계산을 멈추지 않게 합니다.
    const normalized = [];
    let needsBackup = false;
    for (const item of savedItems) {
      if (!item || typeof item !== "object") continue;
      if (typeof item.id !== "string" && typeof item.id !== "number") continue;
      if (!isValidScheduleDate(item.date)) continue;
      if (!isValidScheduleTime(item.time) || typeof item.title !== "string") continue;
      const excludedDates = [];
      if (Array.isArray(item.excludedDates)) {
        for (const date of item.excludedDates) {
          if (isValidScheduleDate(date) && !excludedDates.includes(date)) excludedDates.push(date);
          else needsBackup = true;
        }
      } else if (item.excludedDates !== undefined && item.excludedDates !== null) {
        needsBackup = true;
      }
      let endTime = "17:00";
      if (isValidScheduleTime(item.endTime)) endTime = item.endTime;
      else if (item.endTime) needsBackup = true;
      normalized.push({
        // 원본을 먼저 복사하고 아래 속성으로 덮어써 과거 데이터의 누락값도 보완합니다.
        ...item,
        // 기존 일정에 종료 시간이 없으면 17:00을 채웁니다. 저장 effect가 보완된 자료를 기록합니다.
        endTime,
        excludedDates,
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
      });
    }
    // 이전 버전에서 날짜별로 저장한 반복 항목은 하나의 반복 규칙으로 합칩니다.
    // 이미 읽은 seriesId는 배열에 기억하고, 같은 그룹을 다시 만나면 건너뜁니다.
    const seenSeries = [];
    const items = [];
    normalized.sort((a, b) => a.date.localeCompare(b.date));
    for (const item of normalized) {
      if (item.seriesId && item.repeatType !== "none") {
        if (seenSeries.includes(item.seriesId)) continue;
        seenSeries.push(item.seriesId);
      }
      // 복사본에서 과거 버전의 속성만 제거합니다. 반복 간격은 위에서 이미 새 형식으로 읽었습니다.
      const schedule = { ...item };
      delete schedule.repeatUntil;
      delete schedule.seriesId;
      delete schedule.biweekly;
      items.push(schedule);
    }
    // 일부 항목이 잘못되어 제외되더라도 정리 전 원본은 복구할 수 있게 남깁니다.
    if (needsBackup || normalized.length !== savedItems.length) {
      localStorage.setItem(`made-mate-schedules-backup-${Date.now()}`, raw);
    }
    return { items, readError: false };
  } catch {
    // 읽기 실패 시 자동 저장을 막아 기존 원본을 빈 배열로 덮어쓰지 않습니다.
    return { items: [], readError: true };
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
  /* useState를 읽는 법: const [query, setQuery] = useState('');
   * useState('')는 처음 값을 빈 문자열로 정하고 [현재 값, 값을 바꾸는 함수]를 반환합니다.
   * 대괄호는 그 두 값을 각각 query/setQuery라는 이름으로 꺼내는 '배열 구조 분해'입니다.
   * setQuery('회의')를 호출하면 다음 렌더링의 query가 '회의'가 됩니다.
   * 호출한 줄 바로 아래에서 기존 query 변수가 즉시 '회의'로 바뀌는 방식은 아닙니다.
   * query를 일반 변수처럼 직접 바꾸면 리액트가 화면 갱신을 예약하지 못하므로 setter를 사용합니다.
   *
   * useState(getTodayKey)는 함수를 전달해 초기값을 계산하게 하는 방식입니다.
   * useState(getTodayKey())처럼 호출 결과를 전달하면 컴포넌트 실행 때마다 날짜 함수를 먼저 호출합니다.
   * 함수로 전달하는 초기화는 일반 재렌더링마다 반복되지 않습니다.
   * 다만 개발용 StrictMode에서는 초기화 함수가 순수한지 확인하려고 추가 호출될 수 있습니다.
   */
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
  // 날짜만으로는 오늘 이미 지난 작업을 구별할 수 없어 현재 시각도 따로 기억합니다.
  const [currentTime, setCurrentTime] = useState(Date.now);
  // ref는 달력의 실제 HTML 요소를 가리킵니다. 프로젝트 선택 후 화면 이동과 초점에 사용합니다.
  const calendarRef = useRef(null);
  // selectedDate는 선택한 날짜를 YYYY-MM-DD 문자열로 보관합니다.
  const [selectedDate, setSelectedDate] = useState(todayKey);
  // query=검색 문자열, view=시간/일/주/월 보기, scopeFilter=전체/공유/개인 분류입니다.
  // 개인/공유는 화면 분류 값이며 사용자별 접근 권한을 검사하는 기능은 아닙니다.
  const [query, setQuery] = useState("");
  const [view, setView] = useState("monthly");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  // null은 목록을 닫은 상태, projects/people은 오른쪽에 열 목록의 종류입니다.
  const [directoryMode, setDirectoryMode] = useState(null);
  // 프로젝트 이름은 부분 검색과 달리 정확히 일치시켜 test와 test2가 섞이지 않게 합니다.
  const [selectedProject, setSelectedProject] = useState(null);
  // 저장값 중 형식이 올바른 일정만 state로 불러옵니다.
  const [loadedSchedules] = useState(loadSchedules);
  const [items, setItems] = useState(loadedSchedules.items);
  const [loadedTeam] = useState(loadTeamMembers);
  const [teamMembers, setTeamMembers] = useState(loadedTeam.members);
  const [teamStorageError, setTeamStorageError] = useState(false);
  const [storageError, setStorageError] = useState(false);
  // 등록 창, 전체 일정 창, 수정 중인 일정의 ID도 화면 상태로 관리합니다.
  const [listOpen, setListOpen] = useState(false);
  // null이면 원본 전체 목록, 날짜 문자열이면 그날에 실제 발생하는 목록을 표시합니다.
  const [listDateFilter, setListDateFilter] = useState(null);
  // form=null이면 닫힌 상태입니다. 열림 여부를 별도 state로 중복 보관하지 않습니다.
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  // null이면 신규 등록, 객체이면 수정할 원본 ID와 특정 반복 날짜를 함께 보관합니다.
  const [editing, setEditing] = useState(null);
  const calendarYear = month.getFullYear();
  const [holidayInfo, setHolidayInfo] = useState({
    year: null,
    dates: {},
    error: false,
  });

  // 선택한 프로젝트의 마지막 일정을 지웠다면 더 이상 없는 프로젝트 필터도 함께 해제합니다.
  useEffect(() => {
    if (!selectedProject) return;
    const exists = items.some((item) => item.project === selectedProject);
    if (!exists) setSelectedProject(null);
  }, [items, selectedProject]);

  // 팀원은 일정과 별도 목록으로 저장합니다. 이름을 일정에 썼다고 직원이 되는 것은 아닙니다.
  useEffect(() => {
    if (loadedTeam.readError) return;
    try {
      localStorage.setItem("made-mate-schedule-team", JSON.stringify(teamMembers));
      setTeamStorageError(false);
    } catch {
      setTeamStorageError(true);
    }
  }, [teamMembers, loadedTeam.readError]);

  function addTeamMember(value) {
    if (loadedTeam.readError) return "팀원 목록을 읽지 못했습니다. 기존 저장 자료를 확인해 주세요.";
    const name = value.trim();
    if (!name) return "팀원 이름을 입력해 주세요.";
    if (name.length > 30) return "팀원 이름은 30자 이내로 입력해 주세요.";
    if (teamMembers.includes(name)) return "이미 등록된 팀원입니다.";
    setTeamMembers((current) => [...current, name].sort((a, b) => a.localeCompare(b, "ko")));
    return "";
  }

  function removeTeamMember(name) {
    // 일정 기록을 삭제하는 동작이 아닙니다. 다시 같은 이름을 등록하면 기존 담당 기록도 연결됩니다.
    const message = `${name}님을 팀원 목록에서 제외할까요? 기존 일정의 담당·참석 기록은 유지됩니다.`;
    if (!window.confirm(message)) return;
    setTeamMembers((current) => current.filter((person) => person !== name));
  }

  function toggleAttendee(name) {
    setFormError("");
    setForm((current) => {
      const attendees = normalizeAttendees(current.attendees);
      let next;
      if (attendees.includes(name)) next = attendees.filter((person) => person !== name);
      else next = [...attendees, name];
      return { ...current, attendees: next.join(", ") };
    });
  }

  const selectedDateObject = new Date(`${selectedDate}T00:00:00`);
  // 선택 날짜나 표시 연도와 공휴일 데이터의 연도가 다르면 공휴일 이름을 표시하지 않습니다.
  const selectedHoliday =
    holidayInfo.year === selectedDateObject.getFullYear()
      ? holidayInfo.dates[selectedDate]
      : "";
  const holidayDates =
    holidayInfo.year === calendarYear ? holidayInfo.dates : {};

  // 일정 목록이 바뀔 때 브라우저 저장소를 갱신해 새로고침 뒤에도 유지합니다.
  /* useEffect는 화면 계산과 별도로 필요한 외부 작업을 연결할 때 사용합니다.
   * 여기서는 브라우저 저장소 기록, 아래에서는 타이머 설정과 공휴일 서버 요청을 담당합니다.
   * 마지막의 [items, loadedSchedules.readError]를 '의존성 배열'이라고 부릅니다.
   * 처음 화면에 붙었을 때 실행하고, 이후 이 값 중 하나가 달라졌을 때 다시 실행합니다.
   * 따라서 query만 바뀌는 검색 입력에서는 불필요하게 저장하지 않습니다.
   * JSON.stringify(items)는 parse의 반대이며, 배열을 저장 가능한 문자열로 바꿉니다.
   */
  useEffect(() => {
    if (loadedSchedules.readError) return;
    try {
      // 펼친 반복 날짜가 아닌 원본 items만 JSON 문자열로 바꾸어 저장합니다.
      localStorage.setItem("made-mate-schedules", JSON.stringify(items));
      setStorageError(false);
    } catch {
      // 용량 초과나 저장소 차단 시에도 화면을 유지하고 저장 실패를 안내합니다.
      setStorageError(true);
    }
    // 의존성 배열의 items가 바뀔 때 실행되므로 검색이나 보기 전환만으로는 저장하지 않습니다.
  }, [items, loadedSchedules.readError]);

  // 다음 자정에 오늘 날짜를 갱신합니다. 오늘을 보고 있었다면 새 날짜를 선택합니다.
  /* effect 안에서 return하는 함수는 화면에 표시할 JSX가 아니라 '정리 함수'입니다.
   * 이전 effect를 다시 실행하기 전이나 컴포넌트를 없앨 때 리액트가 호출합니다.
   * 타이머를 해제하지 않으면 이전 선택 날짜를 기억한 타이머와 새 타이머가 함께 실행될 수 있습니다.
   * 이 effect는 selectedDate도 의존하므로 사용자가 날짜를 바꿀 때 새 선택값으로 타이머를 설정합니다.
   */
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
      // 오늘을 선택한 경우에만 날짜와 표시 월을 함께 이동합니다.
      // 다른 날짜를 보고 있다면 월말·연말 자정에도 현재 화면을 유지합니다.
      if (selectedDate === todayKey) {
        setSelectedDate(nextTodayKey);
        setMonth(new Date(`${nextTodayKey}T00:00:00`));
      }
    }, nextMidnight.getTime() - now.getTime());

    // effect 재실행 전이나 화면이 사라질 때 이전 타이머를 지워 중복 실행을 막습니다.
    // 선택 날짜가 바뀌면 최신 선택을 기준으로, 오늘이 바뀌면 다음 자정으로 다시 설정합니다.
    return () => window.clearTimeout(timer);
  }, [todayKey, selectedDate]);

  /* 분이 바뀌거나 다른 탭에서 돌아오면 다가오는 일정을 다시 계산합니다.
   * 새로고침 없이 시작 시각이 지난 작업을 목록에서 빼기 위한 타이머입니다.
   * Date.now()%60000은 이번 분에서 흐른 밀리초이며, 남은 시간 뒤에 다음 분을 갱신합니다.
   * cleanup은 타이머와 이벤트 연결을 해제해 화면을 닫은 뒤에도 갱신하지 않게 합니다. */
  useEffect(() => {
    const refreshTime = () => setCurrentTime(Date.now());
    const timer = window.setTimeout(refreshTime, 60000 - (Date.now() % 60000));
    document.addEventListener("visibilitychange", refreshTime);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refreshTime);
    };
  }, [currentTime]);

  // 현재 연도의 한국 공휴일을 가져와 날짜별로 빠르게 찾을 수 있게 정리합니다.
  /* fetch는 서버 응답을 기다리는 동안 화면 전체를 멈추지 않고 Promise를 반환합니다.
   * async 함수 안의 await는 응답을 받은 뒤 다음 줄을 실행하게 합니다. 화면 전체를 멈추지는 않습니다.
   * try 안에서 요청하거나 해석하다 실패하면 catch로 이동해 오류 안내를 표시합니다.
   * 예를 들어 2026년 요청 후 곧바로 2027년으로 이동하면 2026년 응답이 더 늦게 올 수도 있습니다.
   * active는 이 effect 실행만의 변수입니다. 정리 함수가 이전 실행의 active를 false로 바꾸면
   * 이전 응답이 도착해도 새 연도의 상태를 덮어쓰지 않습니다. 요청 자체를 취소하는 것은 아닙니다.
   */
  useEffect(() => {
    // 이번 effect의 응답을 반영해도 되는지 표시합니다. 요청 자체를 취소하는 값은 아닙니다.
    // 연도를 바꾸면 cleanup에서 false로 바꿔 이전 요청이 늦게 도착해도 무시하게 합니다.
    let active = true;

    async function loadHolidays() {
      try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${calendarYear}/KR`);
        // fetch는 HTTP 오류여도 응답할 수 있어 ok를 직접 확인합니다.
        // throw는 catch로 보내고, 정상 응답은 response.json()으로 비동기 변환합니다.
        if (!response.ok) throw new Error("Holiday request failed");
        const holidays = await response.json();
        // API 응답 배열을 { 날짜: 공휴일 이름 } 형태로 바꾸어 달력에서 조회합니다.
        // 날짜를 속성 이름으로 사용합니다. 예: dates["2026-10-09"] = "한글날".
        // 달력에서는 날짜 문자열을 키로 사용해 공휴일 이름을 바로 찾습니다.
        const dates = {};
        for (const holiday of holidays) {
          dates[holiday.date] = holiday.localName || holiday.name;
        }
        if (active) setHolidayInfo({ year: calendarYear, dates, error: false });
      } catch {
        if (active)
          setHolidayInfo({ year: calendarYear, dates: {}, error: true });
      }
    }
    loadHolidays();

    // 연도를 바꾼 뒤 늦게 도착한 이전 요청이 상태를 덮어쓰지 않게 합니다.
    return () => {
      active = false;
    };
  }, [calendarYear]);

  /* 화면용 자료는 저장용 items에서 매번 새로 계산합니다.
   * 별도의 state나 최적화 Hook 없이 위에서 아래로 읽을 수 있도록 작성했습니다.
   * 조건에 맞지 않으면 continue로 건너뛰고, 모든 검사를 통과한 일정만 결과에 넣습니다.
   * 검색 결과가 없어도 items는 건드리지 않으므로 저장된 일정은 그대로 남습니다. */
  const keyword = query.trim().toLowerCase();
  const filteredItems = [];
  for (const item of items) {
    if (selectedProject && item.project !== selectedProject) continue;
    if (scopeFilter !== "all" && item.visibility !== scopeFilter) continue;
    if (statusFilter !== "all" && item.status !== statusFilter) continue;
    const people = getSchedulePeople(item).join(" ");
    const searchText = `${item.title} ${item.project} ${people}`.toLowerCase();
    if (!searchText.includes(keyword)) continue;
    filteredItems.push(item);
  }

  // 보기마다 필요한 날짜 범위를 먼저 정하고, 반복 일정을 그 범위에서만 펼칩니다.
  // 월별은 해당 월 전체, 주별/담당자별은 월요일~일요일, 일별/시간대별은 선택 날짜입니다.
  // 달력과 검색 목록이 이 배열을 함께 사용하므로 기간 계산을 두 번 하지 않습니다.
  let from = selectedDate;
  let to = selectedDate;
  if (view === "monthly") {
    from = dateKey(new Date(month.getFullYear(), month.getMonth(), 1));
    to = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  } else if (view === "weekly" || view === "staff") {
    const days = getWeekDates(new Date(`${selectedDate}T00:00:00`));
    from = days[0].key;
    to = days[6].key;
  }
  const visibleItems = expandSchedules(filteredItems, from, to);
  // 선택 날짜가 표시 월 밖일 수도 있어 선택 날짜 패널은 별도 하루 범위로 계산합니다.
  const selectedItems = expandSchedules(filteredItems, selectedDate, selectedDate);

  // 해당 월의 날짜를 월요일 시작 달력 격자에 맞춰 계산합니다.
  const calendarDays = [];
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  // JS의 일요일 시작 인덱스를 월요일 시작 달력에 맞는 빈칸 수로 바꿉니다.
  // 월요일(1)은 (1+6)%7=0칸, 일요일(0)은 6칸이 되어 월요일 시작 표에 맞습니다.
  const startOffset = (first.getDay() + 6) % 7;
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  // 날짜 수에 앞뒤 빈칸을 더하고, 행 수를 7의 배수로 맞춰 달력 칸을 만듭니다.
  // ceil은 올림입니다. 앞 빈칸+날짜가 32개면 5주 * 7=35칸을 생성합니다.
  // null은 빈칸, { date, key }는 실제 날짜 칸입니다. key는 검색·React 식별에 사용합니다.
  const cellCount = Math.ceil((startOffset + dayCount) / 7) * 7;
  for (let index = 0; index < cellCount; index += 1) {
    const day = index - startOffset + 1;
    if (day < 1 || day > dayCount) {
      calendarDays.push(null);
    } else {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      calendarDays.push({ date, key: dateKey(date) });
    }
  }

  // 달력의 월 이동, 날짜 선택과 폼 입력을 처리하는 함수입니다.
  // 기존 Date를 직접 수정하지 않고 새 객체로 교체해 React가 변경을 알 수 있게 합니다.
  const changeMonth = (delta) => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    // 31일에서 짧은 달로 이동하면 해당 월 말일을 선택합니다.
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(selectedDateObject.getDate(), lastDay));
    selectDate(dateKey(next));
  };
  // 자식은 -1/+1만 전달합니다. 이 함수에서 현재 보기의 이동 단위를 정합니다.
  const changePeriod = (delta) => {
    if (view === "monthly") {
      changeMonth(delta);
      return;
    }
    const date = new Date(`${selectedDate}T00:00:00`);
    // 주별과 담당자별 주간(staff)은 같은 7일 범위를 쓰므로 둘 다 한 주씩 이동합니다.
    let step = 1;
    if (view === "weekly" || view === "staff") step = 7;
    date.setDate(date.getDate() + delta * step);
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
  const updateForm = (event) => {
    setFormError("");
    const name = event.target.name;
    let value = event.target.value;
    if (event.target.type === "number" && value !== "") value = Number(value);
    setForm((current) => {
      // state 객체를 직접 바꾸지 않고 복사한 뒤, 입력한 항목 하나만 바꿉니다.
      const nextForm = { ...current };
      nextForm[name] = value;
      if (name === "repeatType") nextForm.repeatInterval = 1;
      return nextForm;
    });
  };
  // item이 없으면 빈 폼, 있으면 수정용 폼입니다. 목록에서 수정해도 같은 함수를 사용합니다.
  const openScheduleForm = (item) => {
    setFormError("");
    setEditing(item || null);
    const nextForm = createScheduleForm(item);
    // 수정은 저장된 날짜를 사용합니다. 새 등록일 때만 현재 선택한 날짜를 넣습니다.
    if (!item) nextForm.date = selectedDate;
    setForm(nextForm);
    setListOpen(false);
  };
  const closeScheduleForm = () => {
    setFormError("");
    setForm(null);
    setEditing(null);
  };

  // 즐겨찾기는 일정 안에 저장하므로 새로고침에도 유지되고 일정 삭제 시 함께 없어집니다.
  // 반복 발생일도 원본 ID를 공유합니다. 별표는 반복 전체를 고정하는 의미입니다.
  function toggleFavorite(item) {
    setItems((current) => current.map((schedule) => {
      if (schedule.id === item.id) return { ...schedule, isFavorite: !schedule.isFavorite };
      return schedule;
    }));
  }

  // 입력값은 이 시점에 저장 형태로 바꿉니다. 참석자 미입력은 []이며 필수 항목이 아닙니다.
  const addSchedule = (event) => {
    // 브라우저는 form 제출 시 페이지 이동을 시도합니다. preventDefault로 막고 아래 state 갱신으로 처리합니다.
    event.preventDefault();
    const title = form.title.trim();
    const project = form.project.trim();
    if (!title) {
      setFormError("일정 이름을 입력해 주세요. 공백만 사용할 수 없습니다.");
      return;
    }
    if (!project) {
      setFormError("프로젝트명을 입력해 주세요. 공백만 사용할 수 없습니다.");
      return;
    }
    if (!isValidScheduleDate(form.date) || !isValidScheduleTime(form.time) || !isValidScheduleTime(form.endTime)) {
      setFormError("올바른 날짜와 시작·종료 시간을 입력해 주세요.");
      return;
    }
    if (form.repeatType !== "none") {
      const interval = Number(form.repeatInterval);
      if (!Number.isInteger(interval) || interval < 1 || interval > MAX_REPEAT_INTERVAL) {
        setFormError(`반복 간격은 1~${MAX_REPEAT_INTERVAL} 사이의 정수로 입력해 주세요.`);
        return;
      }
    }
    // HH:mm은 자릿수가 같아 문자열 비교로도 시간 순서를 확인할 수 있습니다.
    // 같은 날짜 안의 일정이므로 종료 시간은 시작 시간보다 늦어야 합니다.
    if (!form.endTime || form.endTime <= form.time) {
      setFormError("종료 시간은 시작 시간보다 늦게 입력해 주세요.");
      return;
    }
    // 과거 미등록 이름은 수정하지 않았다면 보존합니다. 새 이름을 일정에서 직원으로 만들지는 않습니다.
    if (!teamMembers.includes(form.person) && (!editing || editing.person !== form.person)) {
      setFormError("담당자는 등록된 팀원 중에서 선택해 주세요.");
      return;
    }
    const previousAttendees = normalizeAttendees(editing && editing.attendees);
    for (const name of normalizeAttendees(form.attendees)) {
      if (!teamMembers.includes(name) && !previousAttendees.includes(name)) {
        setFormError("참석자는 등록된 팀원 중에서 선택해 주세요.");
        return;
      }
    }
    // 수정 대상을 먼저 확인합니다. 새 등록이면 editing은 null이라 이 검사를 건너뜁니다.
    let occurrenceDate = null;
    if (editing) occurrenceDate = editing.occurrenceDate;

    // 먼저 새 일정 한 건을 만듭니다. 일반 수정인 경우에만 기존 ID와 제외 날짜를 이어받습니다.
    const item = {
      ...form,
      title,
      project,
      id: createScheduleId(),
      attendees: normalizeAttendees(form.attendees),
      color: typeColors[form.type],
      excludedDates: [],
      isFavorite: false,
    };
    if (editing && !occurrenceDate) {
      item.id = editing.id;
      item.excludedDates = editing.excludedDates || [];
      item.isFavorite = Boolean(editing.isFavorite);
    }

    setItems((current) => {
      // current는 최신 저장 목록입니다. 결과를 담을 next만 수정하고 current는 직접 바꾸지 않습니다.
      // 저장 방법을 세 경우로 나눠 읽습니다: 1. 새 등록  2. 반복 한 번 수정  3. 일반/전체 수정.
      let next;
      if (!editing) {
        next = [...current, item];
      } else if (occurrenceDate) {
        // 원래 반복 규칙에서 그 날짜를 제외한 뒤, 수정한 일정 한 건을 따로 추가합니다.
        next = current.map((schedule) => {
          if (schedule.id === editing.id) return excludeOccurrence(schedule, occurrenceDate);
          return schedule;
        });
        next.push(item);
      } else {
        // 같은 ID의 일정만 새 내용으로 교체합니다. 다른 일정은 그대로 돌려줍니다.
        next = current.map((schedule) => {
          if (schedule.id === editing.id) return item;
          return schedule;
        });
      }
      return next.sort(compareSchedules);
    });
    selectDate(form.date);
    // 저장 후 프로젝트명·상태·공개 범위가 바뀌어도 방금 저장한 일정이 필터에 가리지 않게 합니다.
    setQuery("");
    setSelectedProject(null);
    setScopeFilter("all");
    setStatusFilter("all");
    closeScheduleForm();
  };
  // 날짜별 반복 항목의 상태를 바꾸면 그날만 일반 항목으로 분리합니다.
  // 원본 규칙의 status를 바꾸지 않아 다음 주/다음 달의 업무까지 완료되지 않습니다.
  const changeScheduleStatus = (item, value) => {
    const status = normalizeStatus(value);
    if (status === item.status) return;
    setItems((current) => {
      if (!item.occurrenceDate) {
        return current.map((schedule) => {
          if (schedule.id === item.id) return { ...schedule, status };
          return schedule;
        });
      }
      const updated = current.map((schedule) => {
        if (schedule.id === item.id) return excludeOccurrence(schedule, item.occurrenceDate);
        return schedule;
      });
      // 그날 일정만 복사해 일반 일정으로 저장합니다. occurrenceDate는 화면용 표시라 제거합니다.
      const singleSchedule = { ...item };
      delete singleSchedule.occurrenceDate;
      singleSchedule.id = createScheduleId();
      singleSchedule.status = status;
      singleSchedule.repeatType = "none";
      singleSchedule.repeatInterval = 1;
      singleSchedule.excludedDates = [];
      // 한 번의 상태 변경으로 원본 즐겨찾기가 복제되지 않게 새 발생일은 별표 없이 만듭니다.
      singleSchedule.isFavorite = false;
      updated.push(singleSchedule);
      return updated.sort(compareSchedules);
    });
  };

  // 특정 반복 날짜 삭제는 excludedDates에 날짜를 추가해 이후 계산에서 제외합니다.
  // 원본/일반 항목 삭제는 filter로 ID를 제거합니다. 확인 문구도 삭제 범위를 구분합니다.
  const deleteSchedule = (item) => {
    const repeated =
      item.repeatType === "weekly" || item.repeatType === "monthly";
    let label = "일정";
    if (item.occurrenceDate) label = item.date + "의 일정";
    else if (repeated) label = "전체 반복 일정";
    if (!window.confirm("'" + item.title + "' " + label + "을 삭제할까요?"))
      return;
    setItems((current) => {
      if (item.occurrenceDate) {
        return current.map((schedule) => {
          if (schedule.id === item.id) return excludeOccurrence(schedule, item.occurrenceDate);
          return schedule;
        });
      }
      return current.filter((schedule) => schedule.id !== item.id);
    });
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

  // 상단 통계는 전체 데이터를 세므로 이동할 때도 검색·필터를 해제해 같은 기준으로 보여줍니다.
  const showCurrentPeriod = (nextView, date = getTodayKey()) => {
    // 프로젝트 선택도 별도 필터이므로 함께 해제합니다. getTodayKey()는 클릭한 시점의 오늘입니다.
    setSelectedProject(null);
    selectDate(date);
    setView(nextView);
    setQuery("");
    setScopeFilter("all");
    setStatusFilter("all");
    setDirectoryMode(null);
  };

  // 다른 화면 아래에서 프로젝트나 다가오는 일정을 눌러도 결과가 있는 메인 달력을 바로 보여줍니다.
  const focusCalendar = () => {
    calendarRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    calendarRef.current?.focus({ preventScroll: true });
  };

  // 프로젝트 목록과 팀원의 담당 프로젝트가 같은 이동 함수를 공유합니다.
  // 필터 때문에 선택한 일정이 숨지 않게 초기화하고, 반복을 포함한 가까운 발생일로 이동합니다.
  const showProjectSchedules = (project) => {
    const projectItems = items.filter((item) => item.project === project);
    const date = getScheduleFocusDate(projectItems, Date.now());
    // 목록이 열린 뒤 데이터가 바뀌어 프로젝트 일정이 없어졌다면 잘못된 날짜로 이동하지 않습니다.
    if (!date) return;
    setSelectedProject(project);
    setQuery("");
    setScopeFilter("all");
    setStatusFilter("all");
    // 가까운 일정이 있는 날짜를 일별 화면으로 열면 월별 칸의 말줄임 없이 바로 확인할 수 있습니다.
    // 목록을 접어 오른쪽 날짜 정보도 위로 올리고, 작은 화면에서는 메인 달력으로 이동합니다.
    selectDate(date);
    setView("daily");
    setDirectoryMode(null);
    focusCalendar();
  };

  // 통계는 검색과 무관합니다. 팀원 수는 별도 등록 목록을 기준으로 셉니다.
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
  // 이 목록은 달력의 검색·선택 프로젝트와 무관하게 전체 일정 중 가까운 5건을 보여줍니다.
  const upcomingSchedules = getUpcomingSchedules(items, currentTime);
  const favoriteItems = items.filter((item) => item.isFavorite);
  // 상태별 진행 수가 아니라 일정에 입력된 서로 다른 프로젝트명 개수입니다.
  // 이름을 처음 만났을 때만 배열에 넣습니다. 배열 길이가 중복을 뺀 프로젝트/팀원 수입니다.
  const projectNames = [];
  for (const item of items) {
    if (item.project && !projectNames.includes(item.project)) projectNames.push(item.project);
  }
  const projectCount = projectNames.length;
  const assigneeCount = teamMembers.length;
  const todayWorkCount = expandSchedules(items, todayKey, todayKey).length;
  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`;
  const weekDates = getWeekDates(selectedDateObject);
  // staff도 weekly와 같은 첫날~마지막 날 제목을 사용합니다. 보기만 바뀌고 날짜 기준은 같습니다.
  let periodLabel = monthLabel;
  if (view === "weekly" || view === "staff") {
    const firstDay = weekDates[0].date;
    const lastDay = weekDates[6].date;
    // dateKey의 YYYY-MM-DD에서 MM-DD만 꺼내 구분자를 바꾸면 항상 두 자리씩 표시됩니다.
    const firstLabel = dateKey(firstDay).slice(5).replace("-", "/");
    const lastLabel = dateKey(lastDay).slice(5).replace("-", "/");
    periodLabel = `${firstLabel} – ${lastLabel}`;
  } else if (view === "daily" || view === "hourly") {
    const weekday = "일월화수목금토"[selectedDateObject.getDay()];
    periodLabel = `${selectedDateObject.getFullYear()}년 ${selectedDateObject.getMonth() + 1}월 ${selectedDateObject.getDate()}일 (${weekday})`;
  }

  // 직원 행은 별도 등록 목록을 기준으로 합니다. 일정에만 적힌 미등록 이름은 행으로 만들지 않습니다.
  let staffPeople = [...teamMembers];
  // 이름을 검색했다면 함께 참석한 다른 사람의 행까지 늘어나지 않게 검색한 사람만 남깁니다.
  // 이름과 일치하는 사람이 없으면 프로젝트/일정명 검색으로 보고 기존 행을 그대로 사용합니다.
  let staffPersonSearch = "";
  if (keyword !== "") {
    const matchingPeople = [];
    for (const person of staffPeople) {
      const name = person.toLowerCase();
      if (!name.includes(keyword)) continue;
      if (name === keyword) matchingPeople.unshift(person);
      else matchingPeople.push(person);
    }
    if (matchingPeople.length > 0) {
      staffPeople = matchingPeople;
      staffPersonSearch = query.trim();
    } else {
      staffPeople = teamMembers.filter((person) => {
        for (const item of filteredItems) {
          if (getSchedulePeople(item).includes(person)) return true;
        }
        return false;
      });
    }
  }

  // 순서로 의미를 외우는 배열 대신 이름이 붙은 속성을 사용합니다. card.count는 숫자입니다.
  const statCards = [
    { label: "일정 등록 프로젝트", count: projectCount, unit: "", icon: "projects", action: "projects",
      buttonLabel: "일정 등록 프로젝트 목록 보기", hint: "프로젝트별 일정 살펴보기" },
    { label: "오늘의 작업", count: todayWorkCount, unit: "건", icon: "clock", action: "daily",
      buttonLabel: "오늘의 작업 일별 보기", hint: "오늘의 흐름에 집중하기" },
    { label: "이번 주 마감", count: weekDeadlineCount, unit: "건", icon: "flag", action: "weekly",
      buttonLabel: "이번 주 마감 주별 보기", hint: "이번 주 마감 확인하기" },
    { label: "등록된 팀원", count: assigneeCount, unit: "명", icon: "people", action: "people",
      buttonLabel: "등록된 팀원 목록 보기", hint: "팀원별 담당 프로젝트 보기" },
  ];

  function handleStatClick(action) {
    if (action === "daily" || action === "weekly") {
      showCurrentPeriod(action);
    } else if (directoryMode === action) {
      setDirectoryMode(null);
    } else {
      setDirectoryMode(action);
    }
  }

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
            {/* todayKey는 자정이 지나면 부모의 날짜 갱신 로직으로 바뀝니다.
                time의 dateTime은 기계가 읽는 원본 날짜, 내부 글자는 사람이 읽는 표시입니다. */}
            <time className="sm-today-label" dateTime={todayKey}>{todayKey.replaceAll("-", ".")}</time>
            <div className="sm-avatar">민</div>
          </div>
        </header>

        <section className="sm-heading">
          <div>
            <div className="sm-eyebrow">TEAM PLANNER</div>
            <h1>일정 관리</h1>
            <p>함께 만드는 프로젝트, 한눈에 이어지는 팀의 일정.</p>
          </div>
          <div className="sm-heading-actions">
            <button className="sm-secondary-btn" onClick={showAllSchedules}>
              <ScheduleIcon name="calendar" />
              전체 일정 ({items.length})
            </button>
            <button className="sm-btn" onClick={() => openScheduleForm()}>
              <ScheduleIcon name="plus" /> 일정 등록
            </button>
          </div>
        </section>

        {(storageError || loadedSchedules.readError) && (
          <p className="sm-storage-warning" role="alert">
            {loadedSchedules.readError
              ? "저장된 일정을 읽지 못해 기존 데이터 보호를 위해 자동 저장을 중지했습니다. 현재 화면의 변경 내용은 저장되지 않습니다. 저장소 접근 또는 원본 데이터를 확인한 뒤 새로고침하세요."
              : "브라우저에 일정을 저장하지 못했습니다. 새로고침하면 변경 내용이 사라질 수 있습니다."}
          </p>
        )}
        {(teamStorageError || loadedTeam.readError) && (
          <p className="sm-storage-warning" role="alert">팀원 목록을 저장하거나 읽지 못했습니다. 기존 자료를 보호하기 위해 저장소를 확인해 주세요.</p>
        )}

        {/* 현재 일정 데이터에서 요약 숫자를 만들어 표시합니다. */}
        <section className="sm-stats">
          {/* map은 준비한 카드 정보 하나마다 화면의 카드 하나를 만듭니다. */}
          {statCards.map((card) => {
            let expanded;
            if (card.action === "projects" || card.action === "people") {
              expanded = directoryMode === card.action;
            }
            return (
              <div className={`sm-stat sm-stat-${card.action}`} key={card.label}>
                <div>
                  <div className="sm-stat-label">{card.label}</div>
                  <div className="sm-stat-value">
                    {card.count}
                    {card.unit && <span className="sm-muted"> {card.unit}</span>}
                  </div>
                </div>
                {/* 아이콘도 button으로 만들어 Tab과 Enter로 실행할 수 있습니다.
                    목록 아이콘은 펼침 상태를, 달력 아이콘은 이동할 보기를 설명합니다. */}
                <button
                  type="button"
                  className="sm-stat-icon"
                  aria-label={card.buttonLabel}
                  aria-expanded={expanded}
                  onClick={() => handleStatClick(card.action)}
                >
                  <ScheduleIcon name={card.icon} />
                </button>
                {/* 안내 문구는 별도 행에 놓아 좁은 화면에서도 카드 전체 폭을 사용합니다. */}
                <p className="sm-stat-hint">{card.hint}</p>
              </div>
            );
          })}
        </section>

        {/* 달력과 오른쪽 일정 패널을 각각 별도 컴포넌트로 표시합니다. */}
        <div className="sm-layout">
          {/* 부모의 값과 함수를 props로 전달합니다. 자식은 함수를 호출해 부모 state 변경을 요청합니다. */}
          <ScheduleCalendar
            containerRef={calendarRef}
            selectedProject={selectedProject}
            onClearProject={() => setSelectedProject(null)}
            onOpenSchedule={openScheduleForm}
            onToggleFavorite={toggleFavorite}
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
            staffPersonSearch={staffPersonSearch}
            selectedDate={selectedDate}
            todayKey={todayKey}
            onSelectDate={selectDate}
            onShowMore={showDateSchedules}
          />
          {/* 원본 items는 전체 프로젝트·팀원 목록용, visibleItems는 현재 기간의 검색 결과용입니다.
              selectedProject는 선택 표시용 값, onSelectProject는 클릭 시 상태를 바꾸는 함수입니다. */}
          <ScheduleSidebar
            directoryMode={directoryMode}
            directoryItems={items}
            teamMembers={teamMembers}
            onAddTeamMember={addTeamMember}
            onRemoveTeamMember={removeTeamMember}
            selectedProject={selectedProject}
            onSelectProject={showProjectSchedules}
            onClearProject={() => setSelectedProject(null)}
            onCloseDirectory={() => setDirectoryMode(null)}
            favoriteItems={favoriteItems}
            onToggleFavorite={toggleFavorite}
            onSelectFavorite={(item) => {
              const date = getScheduleFocusDate([item], Date.now());
              if (!date) return;
              showCurrentPeriod("daily", date);
              focusCalendar();
            }}
            selectedDate={selectedDate}
            selectedDateObject={selectedDateObject}
            selectedHoliday={selectedHoliday}
            selectedItems={selectedItems}
            upcomingSchedules={upcomingSchedules}
            currentTime={currentTime}
            onSelectUpcoming={(date) => {
              // 전체 자료에서 고른 일정이 현재 프로젝트/검색 조건에 가려지지 않게 초기화합니다.
              showCurrentPeriod("daily", date);
              focusCalendar();
            }}
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
          teamMembers={teamMembers}
          onAddTeamMember={addTeamMember}
          onToggleAttendee={toggleAttendee}
          error={formError}
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
              ? expandSchedules(filteredItems, listDateFilter, listDateFilter)
              : items
          }
          filterDate={listDateFilter}
          totalCount={items.length}
          onStatusChange={changeScheduleStatus}
          onToggleFavorite={toggleFavorite}
          onClearDateFilter={() => setListDateFilter(null)}
          onDelete={deleteSchedule}
          onEdit={openScheduleForm}
          onClose={() => setListOpen(false)}
        />
      )}
    </main>
  );
}
