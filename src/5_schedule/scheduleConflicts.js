import { expandSchedules, getSchedulePeople } from "./scheduleData";

function getScheduleInterval(item) {
  const startTime = item.isAllDay ? "00:00" : item.time;
  const endDate = item.endDate && item.endDate > item.date ? item.endDate : item.date;
  const endTime = item.isAllDay ? "23:59" : (item.endTime || "17:00");
  const start = new Date(`${item.date}T${startTime}`).getTime();
  const end = new Date(`${endDate}T${endTime}`).getTime();
  return { start, end };
}

// 반복 일정을 실제 발생일로 펼쳐 날짜와 담당자 기준의 충돌을 찾습니다.
export function findScheduleConflicts(
  candidate, items, fromKey, toKey, holidays, ignoredId, ignoredOccurrenceDate,
) {
  const proposedDates = expandSchedules([candidate], fromKey, toKey, holidays);
  const editingOneOccurrence = Boolean(ignoredOccurrenceDate);
  const otherItems = items.filter(item => item.id !== ignoredId || editingOneOccurrence);
  const existingDates = expandSchedules(otherItems, fromKey, toKey, holidays);
  const conflicts = [];

  for (const proposed of proposedDates) {
    const proposedInterval = getScheduleInterval(proposed);
    for (const existing of existingDates) {
      if (existing.id === ignoredId && existing.occurrenceDate === ignoredOccurrenceDate) continue;
      if (existing.date !== proposed.date) continue;

      const sameAllDayType = Boolean(existing.isAllDay) === Boolean(candidate.isAllDay);
      const sameTime = sameAllDayType && (
        candidate.isAllDay
        || (existing.time === candidate.time && (existing.endTime || "17:00") === candidate.endTime)
      );
      const duplicate = existing.title.trim().toLowerCase() === candidate.title.toLowerCase() && sameTime;
      const sharedPerson = candidate.scope === "업무용"
        && existing.scope === "업무용"
        && getSchedulePeople(candidate).some(name => getSchedulePeople(existing).includes(name));
      const existingInterval = getScheduleInterval(existing);
      const timeOverlap = proposedInterval.start < existingInterval.end
        && existingInterval.start < proposedInterval.end;

      if (duplicate || (sharedPerson && timeOverlap)) {
        conflicts.push({ date: proposed.date, title: existing.title, person: existing.person });
        break;
      }
    }
  }
  return conflicts;
}
