/* [파일 안내] 일정 화면의 상태·계산·사용자 동작 연결
 * 입력: ERPContext의 프로젝트, scheduleHooks의 일정·팀원·공휴일 상태
 * 계산: scheduleData에서 반복 발생일·검색 대상·시간 충돌을 계산합니다.
 * 출력: Calendar·Sidebar·Directory·FormModal에 표시값과 콜백을 전달합니다.
 * 저장 흐름: FormModal → updateForm → addSchedule → setItems → useScheduleStorage
 * 수정 위치: 입력 검증은 addSchedule, 회차 상태 변경은 changeScheduleStatus, 삭제는 deleteSchedule
 */

/* 일정 화면의 상태와 사용자 동작을 연결합니다. */
import React, { useEffect, useRef, useState } from "react";
import { useScheduleClock, useScheduleHolidays, useScheduleStorage, useScheduleTeam, useScheduleDraft } from "./scheduleHooks";
import { loadSchedules } from "./scheduleStorage";
import { createProjectMilestones, getProjectScheduleSummaries } from "./ScheduleProjectBridge";
import ScheduleCalendar from "./ScheduleCalendar";
import ScheduleFormModal, { ScheduleListModal } from "./ScheduleFormModal";
import ScheduleSidebar from "./ScheduleSidebar";
import { ScheduleIcon } from "./ScheduleItemParts";
import { useERP } from "../context/ERPContext";
import {
  createScheduleForm,
  createScheduleCopyForm,
  validateScheduleForm,
  getScheduleDurationFields,
  restoreDeletedSchedule,
  getRepeatEndOptions,
  getScheduleProjectId,
  findScheduleConflicts,
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
  normalizeStatus,
  typeColors,
} from "./scheduleData";
import "./scheduleStyles.css";
const EMPTY_PROJECTS = [];
const saveStatusLabels = {
  saving: "저장 중…",
  saved: "브라우저에 저장 완료",
  error: "저장 실패 · 아래 안내를 확인하세요",
  blocked: "저장 중지 · 아래 안내를 확인하세요",
};
const createScheduleId = () =>
  `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* 화면과 일정 관리 훅을 연결하는 조정 컴포넌트입니다. */
export default function ScheduleManager() {
  // [1. 상태 준비] 프로젝트·일정·팀원·선택 날짜를 준비합니다. 저장 관련 세부 처리는 scheduleHooks에서 확인합니다.
  const erp = useERP();
  const projects = erp?.projects || EMPTY_PROJECTS;
  const updateProject = erp?.updateProject;

  // 월간 달력의 기준 월과 현재 선택 날짜입니다.
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(getTodayKey);
  const { todayKey, currentTime } = useScheduleClock(selectedDate, setSelectedDate, setMonth);
  const calendarRef = useRef(null);

  // 검색·공개·프로젝트 조건으로 달력과 선택 날짜 목록을 계산합니다. 즐겨찾기·다가오는 목록은 별도 기준입니다.
  const [query, setQuery] = useState("");
  const [view, setView] = useState("monthly");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [directoryMode, setDirectoryMode] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const {
    loadedSchedules,
    items,
    setItems,
    editingVersion,
    storageConflict,
    setStorageConflict,
    storageError,
    saveStatus,
    reloadConflictingSchedules,
  } = useScheduleStorage();
  const {
    teamMembers,
    excludedTeamMembers,
    teamStorageUnavailable,
    addTeamMember,
    removeTeamMember,
  } = useScheduleTeam();

  // 모달·알림·수정 중인 일정의 상태입니다.
  const [listOpen, setListOpen] = useState(false);
  const [listDateFilter, setListDateFilter] = useState(null);
  const [form, setForm] = useState(null);
  const restoringDraftRef = useRef(false);
  const [formError, setFormError] = useState("");
  const [reminderNotice, setReminderNotice] = useState(null);
  const firedReminders = useRef(new Set());
  const [editing, setEditing] = useState(null);
  const { draft, draftError, clearDraft } = useScheduleDraft(form, editing !== null);
  // 삭제 기록은 메모리에만 15초 보관합니다. 연속 삭제 시 가장 최근 한 건으로 교체합니다.
  const [deletionNotice, setDeletionNotice] = useState(null);
  useEffect(() => {
    if (!deletionNotice) return;
    const timer = window.setTimeout(() => setDeletionNotice(null), Math.max(0, deletionNotice.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [deletionNotice]);

  const calendarYear = month.getFullYear();
  const holidayInfo = useScheduleHolidays(calendarYear);

  // [다른 파트 데이터 변경: 기존 동작] 5번의 일정 요약을 ERPContext.updateProject로 전달합니다.
  // 변경 대상은 프로젝트의 schedules 배열이며, Context가 erp_projects 저장 및 프로젝트 변경 이력을 처리합니다.
  // 일정 수정·삭제뿐 아니라 5번 화면을 열었을 때 요약이 달라도 실행됩니다. 3번 담당자와 공유할 변경 지점입니다.
  // 프로젝트의 이름·담당자·시작일·마감일은 여기서 수정하지 않습니다. 아래 갱신 범위를 바꿀 때는 사전 확인이 필요합니다.
  // 저장 일정 중 해당 프로젝트에 연결된 항목을 projects[].schedules 요약으로 함께 보관합니다.
  // 새 일정은 프로젝트 ID로 연결하고, ID가 없는 기존 일정은 프로젝트명으로 찾습니다.
  // 비교 후 달라진 경우에만 갱신해 Context 변경으로 인한 반복 업데이트를 막습니다.
  useEffect(() => {
    if (typeof updateProject !== "function") return;
    for (const project of projects) {
      const linkedSchedules = getProjectScheduleSummaries(project, items);
      if (JSON.stringify(project.schedules || []) !== JSON.stringify(linkedSchedules)) {
        updateProject({ id: project.id, schedules: linkedSchedules });
      }
    }
  }, [items, projects, updateProject]);

  // 선택한 프로젝트의 마지막 일정을 지웠다면 더 이상 없는 프로젝트 필터도 함께 해제합니다.
  useEffect(() => {
    if (!selectedProject) return;
    const exists = items.some((item) => item.project === selectedProject);
    if (!exists) setSelectedProject(null);
  }, [items, selectedProject]);

  // 회의 참석자 목록에서 이름을 선택할 때 폼의 문자열을 갱신합니다.
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

  // 선택 날짜의 주간 목록은 날짜 범위·제목·달력에서 함께 사용합니다. 한 번 계산해 아래에 전달합니다.
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`);
  const weekDates = getWeekDates(selectedDateObject);
  const firstDayOfMonth = new Date(calendarYear, month.getMonth(), 1);
  const lastDayOfMonth = new Date(calendarYear, month.getMonth() + 1, 0);
  // 선택 날짜나 표시 연도와 공휴일 데이터의 연도가 다르면 공휴일 이름을 표시하지 않습니다.
  const selectedHoliday =
    holidayInfo.year === selectedDateObject.getFullYear()
      ? holidayInfo.dates[selectedDate]
      : "";
  const holidayDates = holidayInfo.dates;

  // 알림은 컴포넌트가 열린 동안 확인하며, 현재 마운트에서 같은 발생일은 한 번만 표시합니다.
  // 표시 이력은 메모리에만 있어 새로고침하면 초기화됩니다. OS 푸시 알림은 아닙니다.
  useEffect(() => {
    if (reminderNotice) return;
    const now = new Date(currentTime);
    const end = new Date(now); end.setDate(end.getDate() + 2);
    const occurrences = expandSchedules(items, dateKey(now), dateKey(end), holidayDates);
    for (const item of occurrences) {
      if (!item.reminderMinutes || item.status === "completed" || item.multiDayOccurrence) continue;
      // 종일 일정은 표시 발생일 자정을 기준으로 알림 시각을 계산합니다.
      const start = new Date(`${item.date}T${item.isAllDay ? "00:00" : item.time}`).getTime();
      const reminderAt = start - Number(item.reminderMinutes) * 60000;
      // 반복 일정은 원래 회차 날짜를 키로 써 화면 갱신 때 같은 알림을 다시 띄우지 않습니다.
      const key = `${item.id}:${item.occurrenceDate || item.date}`;
      // 알림 시각부터 일정 시작 전까지만 노출하고, 이미 시작한 일정은 건너뜁니다.
      if (currentTime >= reminderAt && currentTime < start && !firedReminders.current.has(key)) {
        firedReminders.current.add(key); setReminderNotice(item); break;
      }
    }
  }, [items, currentTime, holidayDates, reminderNotice]);

  // 검색어, 프로젝트, 공개 범위 조건으로 저장된 일정을 먼저 거릅니다.
  // [2. 표시 데이터 계산] 원본 items → 검색·공개 범위 필터 → 반복 발생일 → 달력·선택 날짜 목록
  const keyword = query.trim().toLowerCase();
  const filteredItems = [];
  for (const item of items) {
    if (selectedProject && item.project !== selectedProject) continue;
    if (scopeFilter !== "all" && item.visibility !== scopeFilter) continue;
    const people = getSchedulePeople(item).join(" ");
    const searchText = `${item.title} ${item.project} ${people}`.toLowerCase();
    if (!searchText.includes(keyword)) continue;
    filteredItems.push(item);
  }

  // 보기마다 필요한 날짜 범위를 먼저 정하고, 반복 일정을 그 범위에서만 펼칩니다.
  // 월별은 해당 월 전체, 주별/담당자별은 월요일~일요일, 일별은 선택 날짜입니다.
  // 달력과 검색 건수는 같은 결과 배열을 사용합니다.
  let from = selectedDate;
  let to = selectedDate;
  if (view === "monthly") {
    from = dateKey(firstDayOfMonth);
    to = dateKey(lastDayOfMonth);
  } else if (view === "weekly" || view === "staff") {
    from = weekDates[0].key;
    to = weekDates[6].key;
  }
  // 프로젝트 날짜도 검색·프로젝트 선택 조건을 따르며, 회사 공유 일정 필터에서만 달력에 표시합니다.
  const projectMilestones = createProjectMilestones(projects).filter((item) => {
    if (selectedProject && item.project !== selectedProject) return false;
    if (scopeFilter === "private") return false;
    return (item.title + " " + item.project).toLowerCase().includes(keyword);
  });
  const visibleProjectMilestones = projectMilestones.filter(
    (item) => item.date >= from && item.date <= to,
  );
  const selectedProjectMilestones = projectMilestones.filter((item) => item.date === selectedDate);
  const visibleItems = [
    ...expandSchedules(filteredItems, from, to, holidayDates),
    ...visibleProjectMilestones,
  ];
  const selectedItems = [
    ...expandSchedules(filteredItems, selectedDate, selectedDate, holidayDates),
    ...selectedProjectMilestones,
  ];

  // 월별 달력은 일요일 시작 격자로 계산합니다. 주간 보기는 기존 월요일 시작을 유지합니다.
  const calendarDays = [];
  // getDay()는 일요일=0부터 토요일=6입니다. 그 숫자만큼 앞을 비우면 일요일 시작 달력이 됩니다.
  const startOffset = firstDayOfMonth.getDay();
  const dayCount = lastDayOfMonth.getDate();

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

  // 자식은 -1/+1만 전달합니다. 월별은 한 달, 주별/담당자별은 7일, 나머지는 하루씩 이동합니다.
  // Date는 계산용 복사본만 바꾸고, 마지막에 selectDate로 선택 날짜와 표시 월을 함께 갱신합니다.
  const changePeriod = (delta) => {
    let nextDate = new Date(selectedDateObject);
    if (view === "monthly") {
      nextDate = new Date(calendarYear, month.getMonth() + delta, 1);
      // 31일에서 짧은 달로 이동하면 해당 월 말일을 선택합니다.
      const lastDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
      nextDate.setDate(Math.min(selectedDateObject.getDate(), lastDay));
    } else {
      let step = 1;
      if (view === "weekly" || view === "staff") step = 7;
      nextDate.setDate(nextDate.getDate() + delta * step);
    }
    selectDate(dateKey(nextDate));
  };
  // 날짜 선택과 표시 월을 같이 바꾸면 다른 달의 날짜로 이동할 때 달력도 따라갑니다.
  // 달력에서 날짜를 누르거나 일정 카드를 선택했을 때 호출됩니다.
  // 선택 날짜를 변경하면 해당 날짜의 일정이 오른쪽 패널에 다시 계산되어 나타납니다.
  const selectDate = (date) => {
    setSelectedDate(date);
    setMonth(new Date(`${date}T00:00:00`));
  };
  // 입력창의 name과 form의 속성 이름을 맞춰 하나의 함수로 모든 입력을 처리합니다.
  // 예: name="title"이면 [event.target.name]이 title이 되어 그 속성만 덮어씁니다.
  // 숫자 입력은 빈칸일 때만 ""로 유지해 편집을 허용하고, 나머지는 숫자로 저장합니다.
  // 반복 선택값은 종류:간격 형식입니다. 예: weekly:2를 선택하면 격주로 설정합니다.
  // [3. 입력 처리] FormModal 입력 이벤트 → form 갱신. 여기서는 아직 일정 목록을 저장하지 않습니다.
  const updateForm = (event) => {
    setFormError("");
    const name = event.target.name;
    let value = event.target.value;
    if (event.target.type === "number" && value !== "") value = Number(value);
    if (event.target.type === "checkbox") value = event.target.checked;
    setForm((current) => {
      if (name === "durationMinutes") return { ...current, ...getScheduleDurationFields(current, Number(value)) };
      // state 객체를 직접 바꾸지 않고 복사한 뒤, 입력한 항목 하나만 바꿉니다.
      const nextForm = { ...current };
      if (name === "repeatPreset") {
        const parts = value.split(":");
        nextForm.repeatType = parts[0];
        nextForm.repeatInterval = Number(parts[1]) || 1;
        // 반복 일정에는 여러 날 종료일을 함께 쓸 수 없으므로 선택 즉시 숨겨진 값을 비웁니다.
        if (parts[0] !== "none") nextForm.endDate = "";
      } else if (name === "monthlyOrdinal" || name === "monthlyWeekday") {
        nextForm[name] = Number(value);
      } else nextForm[name] = value;
      return nextForm;
    });
  };
  // item이 없으면 빈 폼, 있으면 수정용 폼입니다. 목록에서 수정해도 같은 함수를 사용합니다.
  // 상단 일정 등록은 인자 없이, 상세 패널의 수정은 item을 전달해 이 함수를 호출합니다.
  // 새 등록과 수정이 같은 폼을 사용하되 수정 대상과 최초 저장 버전을 별도로 기억합니다.
  const openScheduleForm = (item) => {
    restoringDraftRef.current = !item && Boolean(draft);
    setFormError("");
    setEditing(item || null);
    editingVersion.current = item ? items.find(schedule => schedule.id === item.id) : null;
    const nextForm = !item && draft ? { ...draft } : createScheduleForm(item);
    // 수정은 저장된 날짜를 사용합니다. 새 등록일 때만 현재 선택한 날짜를 넣습니다.
    if (!item && !draft) nextForm.date = selectedDate;
    setForm(nextForm);
    setListOpen(false);
  };
  const closeScheduleForm = () => {
    // 닫기 확인을 승인하거나 새 일정을 저장한 경우에만 새 일정의 임시 보관을 비웁니다.
    if (!editing) clearDraft();
    setFormError("");
    setForm(null);
    setEditing(null);
  };
  const copySchedule = () => {
    if (!editing || editing.isProjectMilestone) return;
    restoringDraftRef.current = false;
    const copy = createScheduleCopyForm(editing);
    setEditing(null);
    editingVersion.current = null;
    setFormError("");
    setForm(copy);
  };

  // 즐겨찾기는 일정의 isFavorite에 기록합니다. 저장소 쓰기가 성공하면 새로고침 후에도 유지됩니다.
  // 원본 일정 전체를 삭제하면 별표도 없어지고, 반복 한 회차만 삭제하면 원본 별표는 유지됩니다.
  // 반복 발생일도 원본 ID를 공유합니다. 별표는 반복 전체를 고정하는 의미입니다.
  // 달력·상세·전체 목록의 별표가 모두 이 함수로 연결됩니다.
  // 원본 항목의 isFavorite만 변경하므로 일정 날짜나 입력 내용은 바뀌지 않습니다.
  function toggleFavorite(item) {
    setItems((current) => current.map((schedule) => {
      if (schedule.id === item.id) return { ...schedule, isFavorite: !schedule.isFavorite };
      return schedule;
    }));
  }

  // 입력값은 이 시점에 저장 형태로 바꿉니다. 참석자 미입력은 []이며 필수 항목이 아닙니다.
  // [4. 저장 처리] 입력 검증 → 시간 충돌 확인 → 팀원 확인 → 일정 생성·교체 → 필터·폼 정리
  const addSchedule = (event) => {
    // 브라우저는 form 제출 시 페이지 이동을 시도합니다. preventDefault로 막고 아래 state 갱신으로 처리합니다.
    event.preventDefault();
    // 수정 시작: 편집창을 열어 둔 사이 다른 탭에서 바뀐 원본도 검사합니다.
    if (editing) {
      const remote = loadSchedules();
      const current = remote.items.find(schedule => schedule.id === editing.id);
      if (remote.readError || JSON.stringify(current) !== JSON.stringify(editingVersion.current)) {
        setStorageConflict(true);
        setFormError("편집 중인 일정이 다른 탭에서 변경되거나 삭제되었습니다. 입력 내용을 확인한 뒤 편집창을 닫고 저장된 일정을 불러와 주세요.");
        return;
      }
    }
    // 수정 끝
    const title = form.title.trim();
    const project = form.project.trim();
    // 새 일정에는 프로젝트 ID도 저장해, 나중에 프로젝트 이름이 바뀌어도 연결을 유지합니다.
    const linkedProject = projects.find((entry) => entry.name === project);
    const validationError = validateScheduleForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const person = form.scope === "업무용" ? form.person.trim() : "";
    const attendees = form.scope === "업무용" && form.category === "회의"
      ? normalizeAttendees(form.attendees)
      : [];
    const previousAttendees = normalizeAttendees(editing && editing.attendees);
    for (const name of attendees) {
      if (name.length > 30) {
        setFormError("참석자 이름은 30자 이내로 입력해 주세요.");
        return;
      }
      if (excludedTeamMembers.includes(name) && !previousAttendees.includes(name)) {
        setFormError("팀원 목록에서 제외된 이름은 참석자로 추가할 수 없습니다.");
        return;
      }
    }

    // 수정 대상을 먼저 확인합니다. 새 등록이면 editing은 null이라 이 검사를 건너뜁니다.
    const occurrenceDate = editing?.occurrenceDate;

    // 저장 전에 중복 일정과 담당자·참석자의 시간 겹침을 확인합니다.
    // 폼 문자열과 체크박스 값을 충돌 비교에 사용할 일정 형태로 정리합니다.
    const candidate = {
      // 폼의 원본 값은 복사하고, 공백 정리·참석자 배열 변환 등이 끝난 값으로 덮어씁니다.
      // 이 객체를 충돌 검사와 실제 저장에서 함께 사용해 서로 다른 값이 검사되는 것을 막습니다.
      ...form,
      endDate: form.endDate || "",
      isAllDay: Boolean(form.isAllDay),
      title,
      description: form.description.trim(),
      person,
      attendees,
      project,
      projectId: getScheduleProjectId({ ...form, project, projectId: linkedProject?.id }),
    };
    // 반복 규칙은 다음 1년을 확인하고, 휴일 이동 설정은 범위 끝에서 밀릴 날짜도 포함합니다.
    let conflictEndKey = form.endDate || form.date;
    if (form.repeatType !== "none") {
      const checkEnd = new Date(`${form.date}T00:00:00`);
      checkEnd.setDate(checkEnd.getDate() + 365 + (form.holidayRule === "keep" ? 0 : 14));
      conflictEndKey = dateKey(checkEnd);
    }
    // 현재 편집 중인 전체 일정 또는 한 회차만 비교 목록에서 제외합니다.
    const overlaps = findScheduleConflicts(
      candidate,
      items,
      form.date,
      conflictEndKey,
      holidayDates,
      editing?.id,
      occurrenceDate,
    );
    if (overlaps.length) {
      const summary = overlaps.slice(0, 3)
        .map(item => `${item.date} · ${item.title}${item.person ? ` (${item.person})` : ""}`)
        .join("\n");
      const more = overlaps.length > 3 ? `\n외 ${overlaps.length - 3}건` : "";
      if (!window.confirm(`중복되거나 담당자 시간이 겹치는 일정이 있습니다.\n${summary}${more}\n그래도 저장할까요?`)) return;
    }

    // 담당자와 새 참석자는 일정 저장과 함께 팀원 후보로 등록합니다.
    const namesToRegister = form.scope === "업무용" ? [...new Set([person, ...attendees])] : [];
    for (const name of namesToRegister) {
      const wasExisting = teamMembers.includes(name)
        || (editing && (editing.person === name || previousAttendees.includes(name)));
      if (wasExisting) continue;
      if (excludedTeamMembers.includes(name)) {
        setFormError("팀원 목록에서 제외된 이름입니다. 다시 등록한 뒤 선택해 주세요.");
        return;
      }
      const message = addTeamMember(name);
      if (message) {
        setFormError(message);
        return;
      }
    }
    // 먼저 새 일정 한 건을 만듭니다. 일반 수정인 경우에만 기존 ID와 제외 날짜를 이어받습니다.
    const item = {
      ...candidate,
      ...getRepeatEndOptions(form),
      // 저장 전용 필드만 추가합니다. 반복 일정에는 여러 날 종료일을 남기지 않습니다.
      endDate: form.repeatType === "none" ? (form.endDate || "") : "",
      reminderMinutes: Number(form.reminderMinutes) || 0,
      status: form.scope === "업무용" ? form.status : "pending",
      id: createScheduleId(),
      color: typeColors[form.type],
      excludedDates: [],
      isFavorite: false,
      // 회차 편집이면 원본 반복 일정과 날짜를 저장하고, 재편집이면 연결을 유지합니다.
      replacesScheduleId: occurrenceDate
        ? editing.id
        : (editing?.replacesScheduleId || ""),
      replacesOccurrenceDate: occurrenceDate
        || (editing?.replacesOccurrenceDate || ""),
    };
    if (editing && !occurrenceDate) {
      item.id = editing.id;
      item.excludedDates = editing.excludedDates || [];
      item.isFavorite = Boolean(editing.isFavorite);
    }

    // 한 회차 수정은 원본에서 제외하고, 새 일정으로 추가합니다.
    setItems((current) => {
      if (!editing) return [...current, item].sort(compareSchedules);
      // 전체 수정은 기존 ID를 교체합니다. 한 회차 수정은 원본에 제외 날짜를 남긴 뒤
      // 새 ID의 일반 일정을 추가하므로 다른 회차의 내용과 반복 규칙은 유지됩니다.
      const next = current.map(schedule => {
        if (schedule.id !== editing.id) return schedule;
        return occurrenceDate ? excludeOccurrence(schedule, occurrenceDate) : item;
      });
      return (occurrenceDate ? [...next, item] : next).sort(compareSchedules);
    });
    selectDate(form.date);
    // 저장 후 프로젝트명·공개 범위가 바뀌어도 방금 저장한 일정이 필터에 가리지 않게 합니다.
    clearScheduleFilters();
    closeScheduleForm();
  };
  // 날짜별 반복 항목의 상태를 바꾸면 그날만 일반 항목으로 분리합니다.
  // 원본 규칙의 status를 바꾸지 않아 다음 주/다음 달의 업무까지 완료되지 않습니다.
  // [5. 저장된 일정 변경] 상태·삭제는 원본 전체인지 한 회차인지 구분한 뒤 setItems로 반영합니다.
  const changeScheduleStatus = (item, value) => {
    const status = normalizeStatus(value);
    if (status === item.status) return;
    setItems((current) => {
      if (!item.occurrenceDate) {
        return current.map(schedule => schedule.id === item.id ? { ...schedule, status } : schedule);
      }
      const updated = current.map(schedule => schedule.id === item.id ? excludeOccurrence(schedule, item.occurrenceDate) : schedule);
      // 그날 일정만 복사해 일반 일정으로 저장합니다. occurrenceDate는 화면용 표시라 제거합니다.
      const singleSchedule = { ...item };
      delete singleSchedule.occurrenceDate;
      singleSchedule.id = createScheduleId();
      singleSchedule.status = status;
      singleSchedule.repeatType = "none";
      singleSchedule.repeatInterval = 1;
      Object.assign(singleSchedule, getRepeatEndOptions(singleSchedule));
      singleSchedule.excludedDates = [];
      singleSchedule.replacesScheduleId = item.id;
      singleSchedule.replacesOccurrenceDate = item.occurrenceDate;
      // 한 번의 상태 변경으로 원본 즐겨찾기가 복제되지 않게 새 발생일은 별표 없이 만듭니다.
      singleSchedule.isFavorite = false;
      updated.push(singleSchedule);
      return updated.sort(compareSchedules);
    });
  };

  // 특정 반복 날짜 삭제는 excludedDates에 날짜를 추가해 이후 계산에서 제외합니다.
  // 원본/일반 항목 삭제는 filter로 ID를 제거합니다. 확인 문구도 삭제 범위를 구분합니다.
  // 삭제 버튼 → 삭제 범위 문구 확인 → 승인한 경우에만 목록 변경 순서입니다.
  // 취소하면 false를 돌려주므로 호출한 수정 창도 그대로 유지할 수 있습니다.
  const deleteSchedule = (item) => {
    const repeated =
      item.repeatType === "weekly" || item.repeatType === "monthly";
    let label = "일정";
    if (item.occurrenceDate) label = item.date + "의 일정";
    else if (repeated) label = "전체 반복 일정";
    if (!window.confirm("'" + item.title + "' " + label + "을 삭제할까요?"))
      return false;
    const before = items.find(schedule => schedule.id === item.id);
    if (!before) return false;
    const after = item.occurrenceDate ? excludeOccurrence(before, item.occurrenceDate) : null;
    setDeletionNotice({ record: { before, after }, message: `${item.title} · ${label} 삭제 · 최근 삭제 1건을 15초 동안 되돌릴 수 있습니다.`, expiresAt: Date.now() + 15000 });
    setItems((current) => {
      if (item.occurrenceDate) {
        return current.map(schedule => schedule.id === item.id ? excludeOccurrence(schedule, item.occurrenceDate) : schedule);
      }
      return current.filter((schedule) => schedule.id !== item.id);
    });
    return true;
  };
  function undoDeletion() {
    if (!deletionNotice?.record || saveStatus !== "saved") return;
    if (Date.now() >= deletionNotice.expiresAt) { setDeletionNotice(null); return; }
    const record = deletionNotice.record;
    // 다른 탭의 같은 ID 변경도 확인합니다. 최종 쓰기는 기존 저장 훅의 충돌 검사를 그대로 거칩니다.
    const remote = loadSchedules();
    const error = remote.readError ? "저장된 일정을 읽지 못해 되돌릴 수 없습니다."
      : restoreDeletedSchedule(remote.items, record).error || restoreDeletedSchedule(items, record).error;
    if (error) {
      setDeletionNotice(current => ({ ...current, message: error }));
      return;
    }
    setItems(current => restoreDeletedSchedule(current, record).items);
    setDeletionNotice({ record: null, message: "삭제 되돌리기를 요청했습니다. 상단 저장 상태를 확인해 주세요.", expiresAt: Date.now() + 15000 });
  }
  // 날짜를 주면 그날의 더보기, 생략하면 전체 목록입니다. 같은 모달의 열기 처리를 한 곳에 둡니다.
  // [6. 화면 이동] 목록·보기·프로젝트 선택을 바꿉니다. 일정 내용의 저장과는 별개입니다.
  const showScheduleList = (date = null) => {
    if (date) setSelectedDate(date);
    setListDateFilter(date);
    setListOpen(true);
  };

  // 여러 이동/저장 동작이 같은 검색·프로젝트·공개 조건을 해제합니다. 한 함수로 모아 빠뜨리는 조건을 없앱니다.
  // 디렉터리 닫기와 날짜 이동은 여기 넣지 않아, 저장 후에는 기존 화면 구성을 유지합니다.
  function clearScheduleFilters() {
    setQuery("");
    setSelectedProject(null);
    setScopeFilter("all");
  }

  // 상단 통계는 전체 데이터를 세므로 이동할 때도 검색·필터를 해제해 같은 기준으로 보여줍니다.
  const showCurrentPeriod = (nextView, date = getTodayKey()) => {
    // getTodayKey()는 클릭한 시점의 오늘입니다. 날짜를 전달했다면 그 날짜를 사용합니다.
    clearScheduleFilters();
    selectDate(date);
    setView(nextView);
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
    const date = getScheduleFocusDate(projectItems, Date.now(), holidayDates);
    // 목록이 열린 뒤 데이터가 바뀌어 프로젝트 일정이 없어졌다면 잘못된 날짜로 이동하지 않습니다.
    if (!date) return;
    // 가까운 일정이 있는 날짜를 일별 화면으로 열면 월별 칸의 말줄임 없이 바로 확인할 수 있습니다.
    // 목록을 접어 오른쪽 날짜 정보도 위로 올리고, 작은 화면에서는 메인 달력으로 이동합니다.
    showCurrentPeriod("daily", date);
    // 공통 이동이 필터를 먼저 해제한 뒤, 이번에 고른 프로젝트 조건만 다시 적용합니다.
    setSelectedProject(project);
    focusCalendar();
  };

  // 통계는 검색과 무관합니다.
  // 오늘 작업은 해당 날짜의 실제 발생 횟수이므로 반복 일정도 포함됩니다.
  // 오늘 일정은 작업 구분과 관계없이 실제 발생하는 모든 일정을 셉니다.
  // [7. 요약·부가 표시] 통계·즐겨찾기·다가오는 일정 등 각 화면에 전달할 값을 만듭니다.
  const todayWorkCount = expandSchedules(items, todayKey, todayKey, holidayDates).length;
  // 다가오는 목록은 검색과 무관하게 오늘 포함 7일 이내의 미완료 발생 일정 중 가까운 5건을 보여줍니다.
  const upcomingSchedules = getUpcomingSchedules(items, currentTime, 5, 7, holidayDates);
  const favoriteItems = items.filter((item) => item.isFavorite);
  // 상태별 진행 수가 아니라 일정에 입력된 서로 다른 프로젝트명 개수입니다.
  // 이름을 처음 만났을 때만 배열에 넣습니다. 배열 길이가 중복을 뺀 프로젝트 수입니다.
  const projectNames = [...new Set(items.map((item) => item.project).filter(Boolean))];
  const projectSuggestions = [...new Set([
    ...projects.map((project) => project.name),
    ...projectNames,
  ].filter((name) => typeof name === "string" && name.trim()).map((name) => name.trim()))];
  // staff도 weekly와 같은 첫날~마지막 날 제목을 사용합니다. 보기만 바뀌고 날짜 기준은 같습니다.
  let periodLabel = `${calendarYear}년 ${month.getMonth() + 1}월`;
  if (view === "weekly" || view === "staff") {
    // 이미 계산한 YYYY-MM-DD에서 MM-DD만 꺼내 구분자를 바꾸면 항상 두 자리씩 표시됩니다.
    const firstLabel = weekDates[0].key.slice(5).replace("-", "/");
    const lastLabel = weekDates[6].key.slice(5).replace("-", "/");
    periodLabel = `${firstLabel} – ${lastLabel}`;
  } else if (view === "daily") {
    const weekday = "일월화수목금토"[selectedDateObject.getDay()];
    periodLabel = `${selectedDateObject.getFullYear()}년 ${selectedDateObject.getMonth() + 1}월 ${selectedDateObject.getDate()}일 (${weekday})`;
  }

  // 직원 행은 별도 등록 목록을 기준으로 합니다. 일정에만 적힌 미등록 이름은 행으로 만들지 않습니다.
  // 아래에서 배열 내용을 바꾸지 않고 다른 결과 배열을 대입하므로 복사본을 만들 필요는 없습니다.
  let staffPeople = visibleProjectMilestones.length > 0
    ? [...teamMembers, "프로젝트 일정"]
    : teamMembers;
  // 이름을 검색했다면 함께 참석한 다른 사람의 행까지 늘어나지 않게 검색한 사람만 남깁니다.
  // 이름과 일치하는 팀원이 없으면 일정 검색 결과에 담당·참석으로 연결된 등록 팀원만 남깁니다.
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
      // some은 조건에 맞는 일정이 하나라도 있으면 true입니다.
      staffPeople = staffPeople.filter((person) =>
        person === "프로젝트 일정"
          || filteredItems.some((item) => getSchedulePeople(item).includes(person)));
    }
  }

  // [8. 화면 구성] 위에서 만든 데이터와 콜백을 각 화면 부품의 props에 연결합니다.
  return (
    <main className="schedule-app">
      <div className="sm-shell">
        {!form && draft && <aside className="sm-draft-notice" aria-label="임시 작성 일정">
          <span>작성 중이던 새 일정이 있습니다. 이어서 작성할 수 있습니다.</span>
          <button type="button" className="sm-list-all-btn" onClick={() => openScheduleForm()}>이어서 작성</button>
          <button type="button" className="sm-list-all-btn" onClick={clearDraft}>임시 보관 삭제</button>
        </aside>}
        {draftError && <div className="sm-storage-warning" role="alert">{draftError}
          <button type="button" className="sm-list-all-btn" onClick={clearDraft}>임시 보관 초기화</button>
        </div>}
        {deletionNotice && <aside className="sm-deletion-notice" role="status" aria-label="일정 삭제 안내">
          <span>{deletionNotice.message}</span>
          {deletionNotice.record && <button type="button" className="sm-list-all-btn" disabled={saveStatus !== "saved"} onClick={undoDeletion}>삭제 되돌리기</button>}
          <button type="button" className="sm-list-all-btn" aria-label="삭제 안내 닫기" onClick={() => setDeletionNotice(null)}>닫기</button>
        </aside>}
        {/* 알림이 여러 건이면 한 건씩 보여 기존 화면을 가리지 않게 합니다. */}
        {reminderNotice && <aside className="sm-reminder-notice" role="status">
          <span><strong>일정 알림</strong> · {reminderNotice.title} · {reminderNotice.date} {reminderNotice.isAllDay ? "종일" : reminderNotice.time}</span>
          <button type="button" onClick={() => { const date = reminderNotice.date; setReminderNotice(null); showCurrentPeriod("daily", date); focusCalendar(); }}>일정 보기</button>
          <button type="button" aria-label="알림 닫기" onClick={() => setReminderNotice(null)}>닫기</button>
        </aside>}
        {/* 회사와 사용자 정보를 보여주는 상단 영역 */}
        <header className="sm-top">
          <div className="sm-brand">
            <div className="sm-mark">G</div>
            <div className="sm-brand-copy">
              <strong>GOODS ERP</strong>
              <span className="sm-muted">Management System</span>
            </div>
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
            <button className="sm-secondary-btn" aria-label="오늘의 작업 일별 보기" onClick={() => showCurrentPeriod("daily")}>오늘 일정 {todayWorkCount}건</button>
            <button className="sm-secondary-btn" onClick={() => showScheduleList()}>
              <ScheduleIcon name="calendar" />
              전체 일정 ({items.length})
            </button>
            <button className="sm-btn" onClick={() => openScheduleForm()}>
              <ScheduleIcon name="plus" /> 일정 등록
            </button>
          </div>
        </section>

        <p className="sm-muted" role="status" aria-label="일정 저장 상태" aria-live="polite">
          {saveStatusLabels[saveStatus]}
        </p>
        {storageConflict && <div className="sm-storage-warning" role="alert">
          다른 탭에서 같은 일정을 변경했거나 저장 자료를 읽지 못해 자동 저장을 중지했습니다. 현재 화면의 변경은 아직 저장되지 않았습니다.
          <button type="button" className="sm-secondary-btn" onClick={reloadConflictingSchedules}>현재 변경을 버리고 저장된 일정 불러오기</button>
        </div>}
        {(storageError || loadedSchedules.readError) && (
          <p className="sm-storage-warning" role="alert">
            {loadedSchedules.readError
              ? "저장된 일정을 읽지 못해 기존 데이터 보호를 위해 자동 저장을 중지했습니다. 현재 화면의 변경 내용은 저장되지 않습니다. 저장소 접근 또는 원본 데이터를 확인한 뒤 새로고침하세요."
              : "브라우저에 일정을 저장하지 못했습니다. 새로고침하면 변경 내용이 사라질 수 있습니다."}
          </p>
        )}
        {teamStorageUnavailable && (
          <p className="sm-storage-warning" role="alert">팀원 목록을 저장하거나 읽지 못했습니다. 기존 자료를 보호하기 위해 저장소를 확인해 주세요.</p>
        )}

        {/* 현재 일정 데이터에서 요약 숫자를 만들어 표시합니다. */}
        <section className="sm-stats">
          {/* 직접 등록한 일정의 프로젝트명 개수입니다. 3번 프로젝트 전체 개수와는 다릅니다. */}
          <button type="button" className="sm-stat" aria-label="일정 등록 프로젝트 목록 보기"
            aria-expanded={directoryMode === "projects"}
            onClick={() => setDirectoryMode(current => current === "projects" ? null : "projects")}>
            <ScheduleIcon name="projects" />
            <span>일정 등록 프로젝트</span><strong>{projectNames.length}</strong>
          </button>
        </section>

        {/* 달력과 오른쪽 일정 패널을 각각 별도 컴포넌트로 표시합니다. */}
        <div className="sm-layout">
          {/* 부모의 값과 함수를 props로 전달합니다. 자식은 함수를 호출해 부모 state 변경을 요청합니다. */}
          <ScheduleCalendar
            containerRef={calendarRef}
            selectedProject={selectedProject}
            onClearProject={() => setSelectedProject(null)}
            onSelectSchedule={(item) => selectDate(item.date)}
            onToggleFavorite={toggleFavorite}
            view={view}
            onViewChange={setView}
            onChangePeriod={changePeriod}
            periodLabel={periodLabel}
            weekDates={weekDates}
            scopeFilter={scopeFilter}
            onScopeFilterChange={setScopeFilter}
            onClearFilters={clearScheduleFilters}
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
            onShowMore={showScheduleList}
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
            onCloseDirectory={() => setDirectoryMode(null)}
            favoriteItems={favoriteItems}
            onToggleFavorite={toggleFavorite}
            onSelectFavorite={(item) => {
              const date = getScheduleFocusDate([item], Date.now(), holidayDates);
              if (!date) return;
              showCurrentPeriod("daily", date);
              focusCalendar();
            }}
            selectedDate={selectedDate}
            selectedDateObject={selectedDateObject}
            selectedHoliday={selectedHoliday}
            selectedItems={selectedItems}
            hasActiveFilter={Boolean(query.trim() || selectedProject || scopeFilter !== "all")}
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
          key={editing ? `${editing.id}:${editing.occurrenceDate || "series"}` : "new"}
          form={form}
          isRestoredDraft={restoringDraftRef.current}
          projectSuggestions={projectSuggestions}
          teamMembers={teamMembers}
          onDelete={() => { if (deleteSchedule(editing)) closeScheduleForm(); }}
          onCopy={copySchedule}
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
              ? expandSchedules(filteredItems, listDateFilter, listDateFilter, holidayDates)
              : items
          }
          filterDate={listDateFilter}
          totalCount={items.length}
          onToggleFavorite={toggleFavorite}
          onClearDateFilter={() => setListDateFilter(null)}
          onEdit={openScheduleForm}
          onClose={() => setListOpen(false)}
        />
      )}
    </main>
  );
}
