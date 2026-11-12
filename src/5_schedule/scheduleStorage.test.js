import { loadSchedules, loadTeamMembers, deleteSchedulesByProject, deleteSchedulesByEmployee, resetStoredSchedules } from "./scheduleStorage";

const key = "made-mate-schedules";
const item = { id: "schedule-1", title: "저장 일정", date: "2026-11-10", time: "09:00", endTime: "10:00" };
beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test.each([{}, "잘못된 연결", [null, { id: -1, name: "직원" }]])("손상된 참석자 연결은 백업하고 기존 이름은 수정 폼에서도 유지한다: %j", attendeeEmployees => {
  const raw = JSON.stringify([{ ...item, scope: "업무용", category: "회의", person: "담당",
    attendees: ["외부 참석자"], attendeeEmployees, legacyAttendees: null }]);
  localStorage.setItem(key, raw);
  const loaded = loadSchedules();
  expect(loaded.readError).toBe(false);
  expect(loaded.items[0]).toMatchObject({ attendeeEmployees: [], attendees: ["외부 참석자"], legacyAttendees: ["외부 참석자"] });
  const backup = Object.keys(localStorage).find(name => name.startsWith(key + "-backup-"));
  expect(localStorage.getItem(backup)).toBe(raw);
  expect(localStorage.getItem(key)).toBe(raw);
});

test("전체 초기화는 일정·팀원·제외 목록·현재 탭 초안을 함께 비운다", () => {
  localStorage.setItem(key, JSON.stringify([item]));
  localStorage.setItem("made-mate-schedule-team", '["팀원"]');
  localStorage.setItem("made-mate-excluded-team", '["제외"]');
  sessionStorage.setItem("made-mate-schedule-draft", "초안");
  expect(resetStoredSchedules().ok).toBe(true);
  expect(loadSchedules().items).toEqual([]);
  expect(loadTeamMembers()).toMatchObject({ members: [], excluded: [] });
  expect(sessionStorage.getItem("made-mate-schedule-draft")).toBeNull();
});

test("초기화 마지막 쓰기 실패 시 팀원 목록과 초안도 원래 값으로 복원한다", () => {
  localStorage.setItem(key, JSON.stringify([item]));
  localStorage.setItem("made-mate-schedule-team", '["팀원"]');
  localStorage.setItem("made-mate-excluded-team", '["제외"]');
  sessionStorage.setItem("made-mate-schedule-draft", "초안");
  const original = Storage.prototype.setItem;
  let failed = false;
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(function(storageKey, value) {
    if (storageKey === key && !failed) { failed = true; throw new Error("quota"); }
    return original.call(this, storageKey, value);
  });
  jest.spyOn(console, "error").mockImplementation(() => {});
  expect(resetStoredSchedules().ok).toBe(false);
  expect(loadSchedules().items[0].id).toBe(item.id);
  expect(loadTeamMembers()).toMatchObject({ members: ["팀원"], excluded: ["제외"] });
  expect(sessionStorage.getItem("made-mate-schedule-draft")).toBe("초안");
});

test("프로젝트·직원 삭제는 연결 ID가 있는 일정만 삭제한다", () => {
  const independent = { ...item, project: "이름만 저장", person: "담당자" };
  localStorage.setItem(key, JSON.stringify([
    independent,
    { ...independent, id: "project", projectId: "2" },
    { ...independent, id: "employee", employeeId: 3 },
  ]));
  expect(deleteSchedulesByProject(2).ok).toBe(true);
  expect(deleteSchedulesByEmployee(3).ok).toBe(true);
  expect(loadSchedules().items.map(entry => entry.id)).toEqual([item.id]);
});

test("잘못된 프로젝트 ID와 연결 일정 없는 삭제는 원본 저장값을 그대로 둔다", () => {
  const raw = JSON.stringify([item]);
  localStorage.setItem(key, raw);
  expect(deleteSchedulesByProject(null).ok).toBe(false);
  expect(deleteSchedulesByProject(2).ok).toBe(true);
  expect(deleteSchedulesByEmployee(3).ok).toBe(true);
  expect(localStorage.getItem(key)).toBe(raw);
});

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
