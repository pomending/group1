import { loadSchedules, loadTeamMembers } from "./scheduleStorage";

const key = "made-mate-schedules";
const item = { id: "schedule-1", title: "저장 일정", date: "2026-11-10", time: "09:00", endTime: "10:00" };
beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test.each([
  [{ reminderMinutes: false }, { reminderMinutes: 0 }],
  [{ repeatType: "weekly", repeatInterval: { toString: null, valueOf: null } }, { repeatInterval: 1 }],
  [{ repeatType: "weekly", repeatEndType: "count", repeatCount: true }, { repeatCount: 1 }],
  [{ repeatType: "monthly", monthlyWeekday: [] }, { monthlyWeekday: 3 }],
  [{ type: "__proto__" }, { type: "기획", color: "#8066e8" }],
])("손상된 선택값은 원본 백업 후 기본값으로 복원하며 정상 일정은 유지한다: %#", (changes, expected) => {
  const raw = JSON.stringify([{ ...item, ...changes }]);
  localStorage.setItem(key, raw);
  const result = loadSchedules();
  expect(result.readError).toBe(false);
  expect(result.items[0]).toMatchObject(expected);
  const backup = Object.keys(localStorage).find(name => name.startsWith(key + "-backup-"));
  expect(localStorage.getItem(backup)).toBe(raw);
});

test.each(["", "{broken", "{}", "null"])("손상된 일정 원본은 읽기 실패로 보호한다: %s", raw => {
  localStorage.setItem(key, raw);
  expect(loadSchedules().readError).toBe(true);
  expect(localStorage.getItem(key)).toBe(raw);
});

test.each([["same", "same"], [1, "1"]])("같은 일정 번호가 중복되면 자동 병합 전에 원본을 보호한다: %s/%s", (first, second) => {
  const raw = JSON.stringify([{ ...item, id: first }, { ...item, id: second, title: "다른 일정" }]);
  localStorage.setItem(key, raw);
  expect(loadSchedules()).toMatchObject({ readError: true, items: [] });
  expect(localStorage.getItem(key)).toBe(raw);
});

test.each(["", "   ", 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])("유효하지 않은 일정 번호는 원본 백업 후 제외한다: %s", id => {
  const raw = JSON.stringify([item, { ...item, id }]);
  localStorage.setItem(key, raw);
  const result = loadSchedules();
  expect(result.readError).toBe(false);
  expect(result.items.map(entry => entry.id)).toEqual([item.id]);
  const backup = Object.keys(localStorage).find(name => name.startsWith(key + "-backup-"));
  expect(localStorage.getItem(backup)).toBe(raw);
});

test.each(["made-mate-schedule-team", "made-mate-excluded-team"])("빈 문자열 팀원 저장값을 빈 목록으로 덮어쓰지 않는다: %s", name => {
  localStorage.setItem(name, "");
  expect(loadTeamMembers().readError).toBe(true);
  expect(localStorage.getItem(name)).toBe("");
});

test.each([" ", "가".repeat(31)])("잘못된 제외 팀원 이름도 읽기 실패로 보호한다: %s", name => {
  localStorage.setItem("made-mate-excluded-team", JSON.stringify([name]));
  expect(loadTeamMembers().readError).toBe(true);
});
