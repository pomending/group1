/* [파일 안내] React 상태와 외부 환경 연결
 * useScheduleClock: 오늘 날짜·현재 시각 갱신
 * useScheduleHolidays: 공휴일 API 조회
 * useScheduleStorage: 일정 상태·localStorage 저장·다른 탭 변경 처리
 * useScheduleTeam: 팀원 상태·등록·제외·localStorage 저장
 * useScheduleDraft: 새 일정 등록 내용의 탭 내 임시 보관·복구
 * 저장값 검증·병합은 scheduleStorage, 날짜 계산은 scheduleData를 확인합니다.
 */

import { useEffect, useRef, useState } from "react";
import { compareSchedules, getTodayKey, createEmptyForm, normalizeAttendeeEmployees } from "./scheduleData";
import { loadSchedules, loadTeamMembers, mergeScheduleChanges, serializeSchedules } from "./scheduleStorage";

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
        let loadedYears = 0;
        for (const result of results) {
          if (result.status !== "fulfilled" || !Array.isArray(result.value.holidays)) continue;
          loadedYears += 1;
          for (const holiday of result.value.holidays) {
            dates[holiday.date] = holiday.localName || holiday.name;
          }
        }
        // 연말·연초 회차는 앞뒤 연도의 공휴일도 사용하므로 일부 실패도 안내합니다.
        if (active) setHolidayInfo({ year: calendarYear, dates, error: loadedYears !== years.length });
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
  const [loadedSchedules, setLoadedSchedules] = useState(loadSchedules);
  const [items, setItems] = useState(loadedSchedules.items);
  const savedVersion = useRef(loadedSchedules);
  const resetVersion = useRef(0);
  const editingVersion = useRef(null);
  const [storageConflict, setStorageConflict] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [saveState, setSaveState] = useState("saving");
  const [submission, setSubmission] = useState(null);

  function submitItems(update, onSaved, onError) {
    if (submission) return;
    if (loadedSchedules.readError || storageConflict) {
      onError("저장이 중지됐습니다. 저장된 일정을 다시 불러온 뒤 시도해 주세요.");
      return;
    }
    setSubmission({ update, onSaved, onError });
  }

  useEffect(() => {
    if (loadedSchedules.readError || storageConflict) return undefined;
    let active = true;
    const versionAtStart = resetVersion.current;
    setSaveState("saving");

    function failSubmission(message) {
      if (!submission) return;
      setSubmission(null);
      submission.onError(message);
    }

    // 화면에서 setItems로 바뀐 목록을 브라우저 저장소에 기록합니다.
    // 마지막 읽은 raw와 현재 저장값이 다르면 다른 탭의 변경을 먼저 병합하고,
    // 같은 일정을 서로 다르게 고친 경우에는 저장을 멈춰 경고를 보여줍니다.
    function persist() {
      if (!active || versionAtStart !== resetVersion.current) return;
      try {
        let next = submission ? submission.update(items) : items;
        const raw = localStorage.getItem("made-mate-schedules");
        if (raw !== savedVersion.current.raw) {
          const remote = loadSchedules();
          if (remote.readError) {
            setStorageConflict(true);
            failSubmission("다른 탭의 저장값을 읽지 못했습니다. 입력을 확인해 주세요.");
            return;
          }
          if (remote.resetId !== savedVersion.current.resetId) {
            setStorageConflict(true);
            failSubmission("다른 탭에서 일정을 초기화했습니다. 입력을 확인해 주세요.");
            return;
          }
          const merged = mergeScheduleChanges(savedVersion.current.items, next, remote.items);
          if (merged.conflict) {
            setStorageConflict(true);
            failSubmission("다른 탭에서 같은 일정을 변경했습니다. 입력을 확인해 주세요.");
            return;
          }
          next = merged.items.sort(compareSchedules);
        }

        const resetId = savedVersion.current.resetId;
        const serialized = serializeSchedules(next, resetId);
        if (raw !== serialized) localStorage.setItem("made-mate-schedules", serialized);
        savedVersion.current = { raw: serialized, items: next, resetId };
        if (JSON.stringify(items) !== JSON.stringify(next)) setItems(next);
        setStorageError(false);
        // 저장소 쓰기가 성공한 뒤에만 완료로 표시합니다.
        setSaveState("saved");
        if (submission) {
          setSubmission(null);
          submission.onSaved();
        }
      } catch {
        setStorageError(true);
        failSubmission("일정을 저장하지 못했습니다. 입력을 유지했으니 다시 저장해 주세요.");
      }
    }

    if (navigator.locks?.request) {
      navigator.locks.request("made-mate-schedules-write", persist)
        .catch(() => {
          if (!active) return;
          setStorageError(true);
          failSubmission("일정 저장을 시작하지 못했습니다. 다시 저장해 주세요.");
        });
    } else {
      persist();
    }

    return () => { active = false; };
  }, [items, loadedSchedules.readError, storageConflict, submission]);

  useEffect(() => {
    if (!submission) return undefined;
    function confirmLeave(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", confirmLeave);
    return () => window.removeEventListener("beforeunload", confirmLeave);
  }, [submission]);

  useEffect(() => {

    const refreshSchedules = () => {
        setItems(current => [...current]);
    };

    function checkOtherTab(event) {
        if (event.key === "made-mate-schedules" || event.key === null) {
            const remote = loadSchedules();
            if (!remote.readError && remote.resetId !== savedVersion.current.resetId) {
                refreshAfterReset();
                return;
            }
            refreshSchedules();
        }
    }

    window.addEventListener("storage", checkOtherTab);
    window.addEventListener("made-mate-schedules-updated", refreshSchedules);
    function refreshAfterReset() {
      // 초기화 직전 대기 중이던 쓰기는 중단하고, 초기화된 목록을 읽습니다.
      resetVersion.current += 1;
      editingVersion.current = null;
      setSubmission(null);
      const remote = loadSchedules();
      if (!remote.readError) savedVersion.current = remote;
      setLoadedSchedules(remote);
      setItems(remote.items);
      setStorageConflict(false);
      setStorageError(false);
      setSaveState("saving");
    }
    window.addEventListener("made-mate-schedules-reset", refreshAfterReset);

    return () => {
        window.removeEventListener("storage", checkOtherTab);
        window.removeEventListener("made-mate-schedules-updated", refreshSchedules);
        window.removeEventListener("made-mate-schedules-reset", refreshAfterReset);
    };

}, []);

  // 사이트의 저장 충돌 경고에서 불러오기 버튼을 누르면 실행됩니다.
  // 사용자가 선택한 복구 동작이며, 저장된 목록을 다시 읽어 화면 상태와 기준 버전을 맞춥니다.
  function reloadConflictingSchedules() {
    const remote = loadSchedules();
    if (remote.readError) {
      setStorageError(true);
      return;
    }
    savedVersion.current = remote;
    // 정상 재조회한 결과로 초기 오류도 해제합니다. 실패 시에는 위에서 반환해 원본을 보호합니다.
    setLoadedSchedules(remote);
    setItems(remote.items);
    setStorageConflict(false);
    setStorageError(false);
    setSaveState("saving");
  }

  let saveStatus = saveState;
  if (loadedSchedules.readError || storageConflict) {
    saveStatus = "blocked";
  } else if (storageError) {
    saveStatus = "error";
  }

  return {
    loadedSchedules,
    items,
    setItems,
    editingVersion,
    storageConflict,
    setStorageConflict,
    storageError,
    saveStatus,
    submitItems,
    isSubmitting: Boolean(submission),
    reloadConflictingSchedules,
  };
}

// 팀원 상태와 등록·삭제 규칙, 브라우저 저장을 함께 관리합니다.
export function useScheduleTeam() {
  const [loadedTeam] = useState(loadTeamMembers);
  const [teamMembers, setTeamMembers] = useState(loadedTeam.members);
  const [excludedTeamMembers, setExcludedTeamMembers] = useState(loadedTeam.excluded);
  const [teamStorageError, setTeamStorageError] = useState(false);
  const savedTeam = useRef({ members: loadedTeam.members, excluded: loadedTeam.excluded });
  const [teamRevision, setTeamRevision] = useState(0);

  useEffect(() => {
    if (loadedTeam.readError) return;
    let active = true;
    // 이름별로 기준 목록과 비교합니다. 현재 탭에서 추가·삭제한 이름만 우선하고
    // 건드리지 않은 이름에는 다른 탭의 변경을 반영합니다.
    function mergeNames(base, local, remote) {
      const names = new Set([...base, ...local, ...remote]);
      const merged = [];
      for (const name of names) {
        const changedHere = base.includes(name) !== local.includes(name);
        // 이 화면에서 바꾼 이름은 현재 선택을, 나머지는 다른 탭의 선택을 따릅니다.
        let keepName = remote.includes(name);
        if (changedHere) keepName = local.includes(name);
        if (keepName) merged.push(name);
      }
      return merged.sort((a, b) => a.localeCompare(b, "ko"));
    }
    function persistTeam() {
      if (!active) return;
      try {
        const remote = loadTeamMembers();
        if (remote.readError) throw new Error("Invalid remote team");
        const excluded = mergeNames(savedTeam.current.excluded, excludedTeamMembers, remote.excluded);
        const members = mergeNames(savedTeam.current.members, teamMembers, remote.members)
          .filter(name => !excluded.includes(name));
        const previousMembers = localStorage.getItem("made-mate-schedule-team");
        const previousExcluded = localStorage.getItem("made-mate-excluded-team");
        const memberJson = JSON.stringify(members);
        const excludedJson = JSON.stringify(excluded);
        try {
          // 값이 같으면 다시 쓰지 않아 탭 사이의 불필요한 저장 이벤트를 막습니다.
          if (previousMembers !== memberJson) localStorage.setItem("made-mate-schedule-team", memberJson);
          if (previousExcluded !== excludedJson) localStorage.setItem("made-mate-excluded-team", excludedJson);
        } catch (error) {
          // 두 키 중 하나만 저장된 경우 기존 값을 복원하고 실패를 알립니다.
          if (previousMembers === null) localStorage.removeItem("made-mate-schedule-team");
          else localStorage.setItem("made-mate-schedule-team", previousMembers);
          if (previousExcluded === null) localStorage.removeItem("made-mate-excluded-team");
          else localStorage.setItem("made-mate-excluded-team", previousExcluded);
          throw error;
        }
        savedTeam.current = { members, excluded };
        if (JSON.stringify(teamMembers) !== memberJson) setTeamMembers(members);
        if (JSON.stringify(excludedTeamMembers) !== excludedJson) setExcludedTeamMembers(excluded);
        setTeamStorageError(false);
      } catch {
        setTeamStorageError(true);
      }
    }
    if (navigator.locks?.request) {
      navigator.locks.request("made-mate-schedule-team-write", persistTeam)
        .catch(() => { if (active) setTeamStorageError(true); });
    } else persistTeam();
    return () => { active = false; };
  }, [teamMembers, excludedTeamMembers, loadedTeam.readError, teamRevision]);

  useEffect(() => {
    function refreshTeam(event) {
      if (event.key === null || ["made-mate-schedule-team", "made-mate-excluded-team"].includes(event.key)) {
        setTeamRevision(current => current + 1);
      }
    }
    window.addEventListener("storage", refreshTeam);
    return () => window.removeEventListener("storage", refreshTeam);
  }, []);

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

// 새 일정의 알려진 폼 필드만 sessionStorage의 made-mate-schedule-draft에 보관합니다. 같은 탭의 새로고침 후 복구용입니다.
// 기존 일정 수정은 제외하며 원본 일정·프로젝트·팀원 저장소에는 쓰지 않습니다. 영구 보관이나 탭 간 동기화는 하지 않습니다.
// 선택 날짜를 제외한 값이 모두 기본 상태로 돌아오면 임시 내용을 지웁니다. 오류가 있으면 자동 쓰기를 멈춥니다.
export function useScheduleDraft(form, isEditing) {
  const key = "made-mate-schedule-draft";
  const [initial] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw === null) return { draft: null, error: "" };
      const saved = JSON.parse(raw);
      const defaults = createEmptyForm();
      if (saved?.version !== 1 || !saved.form) throw new Error("Invalid draft");
      const draft = {};
      // 기본 폼에 있는 필드만 읽습니다. 숫자 입력란은 작성 중 빈칸도 허용합니다.
      for (const name of Object.keys(defaults)) {
        const value = name === "attendeeEmployees" ? saved.form[name] ?? [] : saved.form[name];
        let valid = typeof value === typeof defaults[name];
        if (name === "employeeId") {
          // 이전 버전의 임시 폼에는 직원 ID가 없었습니다.
          valid = value == null || (Number.isSafeInteger(value) && value > 0);
        } else if (name === "attendeeEmployees") {
          valid = Array.isArray(value) && normalizeAttendeeEmployees(value).length === value.length;
        } else if (typeof defaults[name] === "number") {
          valid = value === "" || (typeof value === "number" && Number.isFinite(value));
        }
        if (!valid) throw new Error("Invalid draft field");
        draft[name] = name === "employeeId" ? (value ?? null) : value;
      }
      return { draft, error: "" };
    } catch { return { draft: null, error: "임시 작성 내용을 읽지 못했습니다. 임시 보관 삭제 후 다시 작성할 수 있습니다." }; }
  });
  const [draft, setDraft] = useState(initial.draft);
  const [draftError, setDraftError] = useState(initial.error);
  useEffect(() => {
    if (!form || isEditing || draftError) return;
    const defaults = createEmptyForm();
    const values = {};
    for (const name of Object.keys(defaults)) {
      values[name] = form[name];
    }
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
  // 새 일정 등록·닫기 승인 또는 사용자의 임시 보관 삭제·초기화에서 호출합니다. 삭제 실패도 화면에 알립니다.
  function clearDraft() {
    try {
      sessionStorage.removeItem(key);
      setDraft(null);
      setDraftError("");
    } catch {
      setDraftError("임시 보관 내용을 삭제하지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.");
    }
  }
  return { draft, draftError, clearDraft };
}
