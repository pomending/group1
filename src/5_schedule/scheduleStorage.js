/* [파일 안내] 저장 데이터 읽기·검증·이전 형식 정리·탭 간 병합
 * loadSchedules: 일정 저장값 → 검증·정리된 items와 읽기 상태
 * loadTeamMembers: 팀원·제외 목록 → 검증된 목록과 읽기 상태
 * mergeScheduleChanges: 기준·현재·다른 탭 목록 → 병합 결과 또는 충돌 표시
 * 호출처: scheduleHooks와 Manager. 자동 저장 effect는 scheduleHooks에 있습니다.
 */

/* 일정 로드·정리·저장 충돌 병합을 담당합니다. */
import {
  getScheduleCategory,
  getScheduleScope,
  getRepeatInterval,
  isValidScheduleDate,
  isValidScheduleTime,
  normalizeAttendees,
  normalizeStatus,
  scheduleTypes,
  typeColors,
} from "./scheduleData";

// 일정 저장소의 로컬 변경과 다른 탭의 변경을 ID별로 비교해 합칩니다.
export function mergeScheduleChanges(base, local, remote) {
  const toMap = schedules => new Map(schedules.map(item => [String(item.id), item]));
  const original = toMap(base);
  const current = toMap(local);
  const otherTab = toMap(remote);
  const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  const merged = [];

  const ids = new Set([...original.keys(), ...current.keys(), ...otherTab.keys()]);
  for (const id of ids) {
    const before = original.get(id);
    const localItem = current.get(id);
    const remoteItem = otherTab.get(id);
    const localChanged = !same(before, localItem);
    const remoteChanged = !same(before, remoteItem);

    if (localChanged && remoteChanged && !same(localItem, remoteItem)) {
      return { conflict: true, items: local };
    }
    const item = localChanged ? localItem : remoteItem;
    if (item) merged.push(item);
  }
  return { conflict: false, items: merged };
}

// 브라우저 저장소에서 일정을 읽고, 잘못된 필드를 기본값으로 정리합니다.
export function loadSchedules() {
  // 손상된 자료는 백업하고 읽기 실패 시 자동 저장을 막습니다.
  try {
    const raw = localStorage.getItem("made-mate-schedules");
    const savedItems = JSON.parse(raw || "[]");
    if (!Array.isArray(savedItems)) throw new Error("Invalid schedule data");

    // 일정 필수값과 날짜별 반복 제외값을 확인하고 이전 형식의 누락값을 보완합니다.
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
      // 새 필드는 값 목록을 확인해 잘못된 자료는 백업 대상으로 표시하고 기본값으로 읽습니다.
      const validReminder = [0, 10, 30, 1440].includes(Number(item.reminderMinutes));
      const validHolidayRule = ["keep", "skip", "nextWorkday"].includes(item.holidayRule);
      const validEndDate = isValidScheduleDate(item.endDate)
        && item.endDate >= item.date
        && !["weekly", "monthly"].includes(item.repeatType);
      if (item.reminderMinutes !== undefined && !validReminder) needsBackup = true;
      if (item.holidayRule !== undefined && !validHolidayRule) needsBackup = true;
      if (item.endDate && !validEndDate) needsBackup = true;
      if (item.isAllDay !== undefined && typeof item.isAllDay !== "boolean") needsBackup = true;
      const schedule = { ...item };
      // 고객관리 연동을 제거했으므로 과거 일정에 남은 고객 사본도 제외합니다.
      delete schedule.connections;
      normalized.push({
        // 원본을 먼저 복사하고 아래 속성으로 덮어써 과거 데이터의 누락값도 보완합니다.
        ...schedule,
        // 기존 일정에 종료 시간이 없으면 17:00을 채웁니다. 저장 effect가 보완된 자료를 기록합니다.
        endTime,
        // 반복 항목에는 종료 날짜를 두지 않고, 올바른 단일·여러 날 일정만 날짜를 유지합니다.
        endDate: item.repeatType !== "weekly" && item.repeatType !== "monthly"
          && isValidScheduleDate(item.endDate) && item.endDate >= item.date
          ? item.endDate
          : "",
        // 예전 저장 자료에 새 필드가 없으면 종일 해제·알림 없음·기준일 진행으로 보완합니다.
        isAllDay: item.isAllDay === true,
        reminderMinutes: [0, 10, 30, 1440].includes(Number(item.reminderMinutes))
          ? Number(item.reminderMinutes)
          : 0,
        holidayRule: ["keep", "skip", "nextWorkday"].includes(item.holidayRule)
          ? item.holidayRule
          : "keep",
        excludedDates,
        project: typeof item.project === "string" ? item.project : "",
        scope: getScheduleScope(item),
        category: getScheduleCategory(item),
        person: typeof item.person === "string" ? item.person : "",
        // 이전 일정에는 attendees가 없을 수 있습니다. []로 보완하면 새 표에서도 안전하게 읽습니다.
        // 저장 배열에 중복/공백이 있더라도 불러오는 시점에 같은 정리 규칙을 다시 적용합니다.
        attendees: normalizeAttendees(item.attendees),
        description:
          typeof item.description === "string" ? item.description : "",
        type: scheduleTypes.includes(item.type) ? item.type : "기획",
        // 과거 저장 데이터의 상태가 없거나 업무 중이면 예정으로 보완하고, 완료는 유지합니다.
        status: getScheduleScope(item) === "개인 일정용" ? "pending" : normalizeStatus(item.status),
        visibility: item.visibility === "private" ? "private" : "shared",
        repeatInterval: getRepeatInterval(item),
        repeatType: ["weekly", "monthly"].includes(item.repeatType)
          ? item.repeatType
          : "none",
        monthlyRule: item.monthlyRule === "weekday" ? "weekday" : "date",
        monthlyOrdinal: [-1, 1, 2, 3, 4].includes(Number(item.monthlyOrdinal))
          ? Number(item.monthlyOrdinal)
          : 2,
        monthlyWeekday: Number.isInteger(Number(item.monthlyWeekday))
          && Number(item.monthlyWeekday) >= 0
          && Number(item.monthlyWeekday) <= 6
          ? Number(item.monthlyWeekday)
          : 3,
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
    return { items, readError: false, raw };
  } catch {
    // 읽기 실패 시 자동 저장을 막아 기존 원본을 빈 배열로 덮어쓰지 않습니다.
    return { items: [], readError: true };
  }
}

// 저장된 팀원과 일정 등록에서 제외한 이름을 검증해 읽습니다.
export function loadTeamMembers() {
  // 등록 목록과 제외 목록은 별도 저장소입니다. 제외 목록은 과거 일정의 이름이
  // 새 일정 저장 과정에서 의도치 않게 팀원으로 다시 등록되는 것을 막는 데 사용합니다.
  try {
    const saved = JSON.parse(localStorage.getItem("made-mate-schedule-team") || "[]");
    if (!Array.isArray(saved)) throw new Error("Invalid team data");
    const excluded = JSON.parse(localStorage.getItem("made-mate-excluded-team") || "[]");
    if (!Array.isArray(excluded) || excluded.some(name => typeof name !== "string")) {
      throw new Error("Invalid excluded team");
    }
    if (saved.some(name => typeof name !== "string" || !name.trim() || name.trim().length > 30)) {
      throw new Error("Invalid team member");
    }
    const members = [...new Set(saved.map(name => name.trim()))]
      .sort((a, b) => a.localeCompare(b, "ko"));
    return { members, excluded, readError: false };
  } catch {
    // 빈 배열은 화면의 안전한 기본값이며, 저장 자료가 실제로 비어 있다는 뜻은 아닙니다.
    // useScheduleTeam은 readError가 true이면 자동 저장을 중지해 손상된 원본을 보호합니다.
    return { members: [], excluded: [], readError: true };
  }
}

