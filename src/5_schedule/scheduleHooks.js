/* [파일 안내] React 상태와 외부 환경 연결
 * useScheduleClock: 오늘 날짜·현재 시각 갱신
 * useScheduleHolidays: 공휴일 API 조회
 * useScheduleStorage: 일정 상태·localStorage 저장·다른 탭 변경 처리
 * useScheduleTeam: 팀원 상태·등록·제외·localStorage 저장
 * useScheduleDraft: 새 일정 등록 내용의 탭 내 임시 보관·복구
 * 저장값 검증·병합은 scheduleStorage, 날짜 계산은 scheduleData를 확인합니다.
 */

import { useEffect, useRef, useState } from "react";
import { compareSchedules, getTodayKey, createEmptyForm } from "./scheduleData";
import { loadSchedules, loadTeamMembers, mergeScheduleChanges } from "./scheduleStorage";

// 오늘 표시와 분 단위 현재 시각을 갱신하고, 자정에 오늘 날짜를 넘깁니다.
export function useScheduleClock(selectedDate, setSelectedDate, setMonth) {
  const [todayKey, setTodayKey] = useState(getTodayKey);
  const [currentTime, setCurrentTime] = useState(Date.now);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = window.setTimeout(() => {
      const nextTodayKey = getTodayKey();
      setTodayKey(nextTodayKey);
      if (selectedDate === todayKey) {
        setSelectedDate(nextTodayKey);
        setMonth(new Date(`${nextTodayKey}T00:00:00`));
      }
    }, nextMidnight.getTime() - now.getTime());

    return () => window.clearTimeout(timer);
  }, [todayKey, selectedDate, setMonth, setSelectedDate]);

  useEffect(() => {
    const refreshTime = () => setCurrentTime(Date.now());
    const timer = window.setTimeout(refreshTime, 60000 - (Date.now() % 60000));
    document.addEventListener("visibilitychange", refreshTime);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refreshTime);
    };
  }, [currentTime]);

  return { todayKey, currentTime };
}

// 현재 표시 연도와 반복 일정에 필요한 앞뒤 연도의 공휴일을 조회합니다.
export function useScheduleHolidays(calendarYear) {
  const [holidayInfo, setHolidayInfo] = useState({ year: null, dates: {}, error: false });

  useEffect(() => {
    let active = true;

    async function loadHolidays() {
      try {
        const years = [calendarYear - 1, calendarYear, calendarYear + 1];
        const results = await Promise.allSettled(years.map(async year => {
          const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`);
          if (!response.ok) throw new Error("Holiday request failed");
          return { year, holidays: await response.json() };
        }));

        const dates = {};
        let currentYearLoaded = false;
        for (const result of results) {
          if (result.status !== "fulfilled" || !Array.isArray(result.value.holidays)) continue;
          if (result.value.year === calendarYear) currentYearLoaded = true;
          for (const holiday of result.value.holidays) {
            dates[holiday.date] = holiday.localName || holiday.name;
          }
        }
        if (active) setHolidayInfo({ year: calendarYear, dates, error: !currentYearLoaded });
      } catch {
        if (active) setHolidayInfo({ year: calendarYear, dates: {}, error: true });
      }
    }

    loadHolidays();
    return () => { active = false; };
  }, [calendarYear]);

  return holidayInfo;
}

// 일정 로드·저장, 다른 탭과의 동기화, 저장 충돌 처리를 한곳에서 관리합니다.
export function useScheduleStorage() {
  const [loadedSchedules] = useState(loadSchedules);
  const [items, setItems] = useState(loadedSchedules.items);
  const savedVersion = useRef({ raw: loadedSchedules.raw, items: loadedSchedules.items });
  const editingVersion = useRef(null);
  const [storageConflict, setStorageConflict] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [saveState, setSaveState] = useState("saving");

  useEffect(() => {
    if (loadedSchedules.readError || storageConflict) return undefined;
    let active = true;
    setSaveState("saving");

    // 화면에서 setItems로 바뀐 목록을 브라우저 저장소에 기록합니다.
    // 마지막 읽은 raw와 현재 저장값이 다르면 다른 탭의 변경을 먼저 병합하고,
    // 같은 일정을 서로 다르게 고친 경우에는 저장을 멈춰 경고를 보여줍니다.
    function persist() {
      if (!active) return;
      try {
        let next = items;
        const raw = localStorage.getItem("made-mate-schedules");
        if (raw !== savedVersion.current.raw) {
          const remote = loadSchedules();
          if (remote.readError) {
            setStorageConflict(true);
            return;
          }
          const merged = mergeScheduleChanges(savedVersion.current.items, items, remote.items);
          if (merged.conflict) {
            setStorageConflict(true);
            return;
          }
          next = merged.items.sort(compareSchedules);
        }

        const serialized = JSON.stringify(next);
        localStorage.setItem("made-mate-schedules", serialized);
        savedVersion.current = { raw: serialized, items: next };
        if (JSON.stringify(items) !== serialized) setItems(next);
        setStorageError(false);
        // 저장소 쓰기가 성공한 뒤에만 완료로 표시합니다.
        setSaveState("saved");
      } catch {
        setStorageError(true);
      }
    }

    if (navigator.locks?.request) {
      navigator.locks.request("made-mate-schedules-write", persist)
        .catch(() => { if (active) setStorageError(true); });
    } else {
      persist();
    }

    return () => { active = false; };
  }, [items, loadedSchedules.readError, storageConflict]);

  useEffect(() => {
    // 다른 탭에서 일정 저장소가 변경되면 저장 effect를 다시 실행해 병합 여부를 판단합니다.
    // 이 이벤트에서 받은 값을 그대로 덮어쓰지 않아 현재 탭의 편집 내용을 보호합니다.
    function checkOtherTab(event) {
      if (event.key === "made-mate-schedules" || event.key === null) {
        setItems(current => [...current]);
      }
    }
    window.addEventListener("storage", checkOtherTab);
    return () => window.removeEventListener("storage", checkOtherTab);
  }, []);

  // 사이트의 저장 충돌 경고에서 불러오기 버튼을 누르면 실행됩니다.
  // 사용자가 선택한 복구 동작이며, 저장된 목록을 다시 읽어 화면 상태와 기준 버전을 맞춥니다.
  function reloadConflictingSchedules() {
    const remote = loadSchedules();
    if (remote.readError) {
      setStorageError(true);
      return;
    }
    savedVersion.current = { raw: remote.raw, items: remote.items };
    setItems(remote.items);
    setStorageConflict(false);
  }

  return {
    loadedSchedules,
    items,
    setItems,
    editingVersion,
    storageConflict,
    setStorageConflict,
    storageError,
    saveStatus: loadedSchedules.readError || storageConflict ? "blocked" : storageError ? "error" : saveState,
    reloadConflictingSchedules,
  };
}

// 팀원 상태와 등록·삭제 규칙, 브라우저 저장을 함께 관리합니다.
export function useScheduleTeam() {
  const [loadedTeam] = useState(loadTeamMembers);
  const [teamMembers, setTeamMembers] = useState(loadedTeam.members);
  const [excludedTeamMembers, setExcludedTeamMembers] = useState(loadedTeam.excluded);
  const [teamStorageError, setTeamStorageError] = useState(false);

  useEffect(() => {
    if (loadedTeam.readError) return;
    try {
      localStorage.setItem("made-mate-schedule-team", JSON.stringify(teamMembers));
      localStorage.setItem("made-mate-excluded-team", JSON.stringify(excludedTeamMembers));
      setTeamStorageError(false);
    } catch {
      setTeamStorageError(true);
    }
  }, [teamMembers, excludedTeamMembers, loadedTeam.readError]);

  function addTeamMember(value) {
    if (loadedTeam.readError) return "팀원 목록을 읽지 못했습니다. 저장된 자료를 확인해 주세요.";
    const name = value.trim();
    if (!name) return "팀원 이름을 입력해 주세요.";
    if (name.length > 30) return "팀원 이름은 30자 이내로 입력해 주세요.";
    if (teamMembers.includes(name)) return "이미 등록된 팀원입니다.";
    setExcludedTeamMembers((current) => current.filter(person => person !== name));
    setTeamMembers((current) => [...current, name].sort((a, b) => a.localeCompare(b, "ko")));
    return "";
  }

  function removeTeamMember(name) {
    const message = `${name}을 팀원 목록에서 삭제할까요? 저장된 일정에는 이름이 남습니다.`;
    if (!window.confirm(message)) return;
    setTeamMembers((current) => current.filter((person) => person !== name));
    setExcludedTeamMembers((current) => current.includes(name) ? current : [...current, name]);
  }

  return {
    teamMembers,
    excludedTeamMembers,
    teamStorageUnavailable: loadedTeam.readError || teamStorageError,
    addTeamMember,
    removeTeamMember,
  };
}

// 새 일정의 폼만 현재 탭에 임시 보관합니다. 원본 일정·프로젝트·팀원 저장소에는 쓰지 않습니다.
export function useScheduleDraft(form, isEditing) {
  const key = "made-mate-schedule-draft";
  const [initial] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw === null) return { draft: null, error: "" };
      const saved = JSON.parse(raw);
      const defaults = createEmptyForm();
      if (saved?.version !== 1 || !saved.form || !Object.keys(defaults).every(name => {
        const value = saved.form[name];
        return typeof defaults[name] === "number" ? value === "" || (typeof value === "number" && Number.isFinite(value))
          : typeof value === typeof defaults[name];
      })) throw new Error("Invalid draft");
      return { draft: Object.fromEntries(Object.keys(defaults).map(name => [name, saved.form[name]])), error: "" };
    } catch { return { draft: null, error: "임시 작성 내용을 읽지 못했습니다. 임시 보관 삭제 후 다시 작성할 수 있습니다." }; }
  });
  const [draft, setDraft] = useState(initial.draft);
  const [draftError, setDraftError] = useState(initial.error);
  useEffect(() => {
    if (!form || isEditing || draftError) return;
    const defaults = createEmptyForm();
    const values = Object.fromEntries(Object.keys(defaults).map(name => [name, form[name]]));
    try {
      if (JSON.stringify(values) === JSON.stringify({ ...defaults, date: form.date })) {
        sessionStorage.removeItem(key);
        setDraft(null);
        return;
      }
      sessionStorage.setItem(key, JSON.stringify({ version: 1, form: values }));
      setDraft(values);
    } catch { setDraftError("작성 내용을 임시 보관하지 못했습니다. 창을 닫기 전에 일정을 저장해 주세요."); }
  }, [form, isEditing, draftError]);
  function clearDraft() {
    try { sessionStorage.removeItem(key); setDraft(null); setDraftError(""); }
    catch { setDraftError("임시 보관 내용을 삭제하지 못했습니다. 브라우저 저장소 설정을 확인해 주세요."); }
  }
  return { draft, draftError, clearDraft };
}
