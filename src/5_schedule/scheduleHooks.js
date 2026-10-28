/* [파일 안내] React 상태와 외부 환경 연결
 * useScheduleClock: 오늘 날짜·현재 시각 갱신
 * useScheduleHolidays: 공휴일 API 조회
 * useScheduleStorage: 일정 상태·localStorage 저장·다른 탭 변경 처리
 * useScheduleTeam: 팀원 상태·등록·제외·localStorage 저장
 * 저장값 검증·병합은 scheduleStorage, 날짜 계산은 scheduleData를 확인합니다.
 */

import { useEffect, useRef, useState } from "react";
import { compareSchedules, getTodayKey } from "./scheduleData";
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

  useEffect(() => {
    if (loadedSchedules.readError || storageConflict) return undefined;
    let active = true;

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
    function checkOtherTab(event) {
      if (event.key === "made-mate-schedules" || event.key === null) {
        setItems(current => [...current]);
      }
    }
    window.addEventListener("storage", checkOtherTab);
    return () => window.removeEventListener("storage", checkOtherTab);
  }, []);

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
