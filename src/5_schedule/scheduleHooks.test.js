import { act, renderHook, waitFor } from "@testing-library/react";
import { useScheduleHolidays, useScheduleStorage, useScheduleTeam } from "./scheduleHooks";

afterEach(() => jest.restoreAllMocks());
beforeEach(() => localStorage.clear());

test("두 탭에서 서로 다른 일정을 수정하면 양쪽 변경을 함께 보존한다", () => {
  localStorage.setItem(storageKey, JSON.stringify([{ ...schedule, id: "a" }, { ...schedule, id: "b" }]));
  const view = renderHook(() => useScheduleStorage());
  const utils = renderHook(() => useScheduleStorage());
  act(() => view.result.current.setItems(items => items.map(item => item.id === "a" ? { ...item, title: "첫 탭 수정" } : item)));
  act(() => utils.result.current.setItems(items => items.map(item => item.id === "b" ? { ...item, title: "둘째 탭 수정" } : item)));
  const saved = JSON.parse(localStorage.getItem(storageKey));
  expect(saved.find(item => item.id === "a").title).toBe("첫 탭 수정");
  expect(saved.find(item => item.id === "b").title).toBe("둘째 탭 수정");
  expect(utils.result.current.storageConflict).toBe(false);
});

test("다른 탭의 삭제와 현재 탭의 같은 일정 수정이 충돌하면 삭제를 덮어쓰지 않는다", () => {
  localStorage.setItem(storageKey, JSON.stringify([schedule]));
  const view = renderHook(() => useScheduleStorage());
  const utils = renderHook(() => useScheduleStorage());
  act(() => view.result.current.setItems([]));
  act(() => utils.result.current.setItems(items => items.map(item => ({ ...item, title: "늦은 수정" }))));
  expect(utils.result.current.saveStatus).toBe("blocked");
  expect(localStorage.getItem(storageKey)).toBe("[]");
});

test("팀원과 제외 목록 중 두 번째 쓰기가 실패하면 첫 번째 쓰기도 복원하고 재시도한다", () => {
  localStorage.setItem("made-mate-schedule-team", JSON.stringify(["가 팀원"]));
  const { result } = renderHook(() => useScheduleTeam());
  jest.spyOn(window, "confirm").mockReturnValue(true);
  const originalSet = Storage.prototype.setItem;
  const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(function(key, value) {
    if (key === "made-mate-excluded-team") throw new Error("quota");
    return originalSet.call(this, key, value);
  });
  act(() => result.current.removeTeamMember("가 팀원"));
  expect(result.current.teamStorageUnavailable).toBe(true);
  expect(JSON.parse(localStorage.getItem("made-mate-schedule-team"))).toEqual(["가 팀원"]);
  expect(JSON.parse(localStorage.getItem("made-mate-excluded-team"))).toEqual([]);
  write.mockRestore();
  act(() => result.current.addTeamMember("나 팀원"));
  expect(result.current.teamStorageUnavailable).toBe(false);
  expect(JSON.parse(localStorage.getItem("made-mate-schedule-team"))).toEqual(["나 팀원"]);
  expect(JSON.parse(localStorage.getItem("made-mate-excluded-team"))).toEqual(["가 팀원"]);
});

test("쓰기 잠금 대기 중 화면을 떠나면 늦은 콜백이 저장값을 덮어쓰지 않는다", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, "locks");
  const jobs = [];
  Object.defineProperty(navigator, "locks", { configurable: true, value: {
    request: jest.fn((name, callback) => { jobs.push(callback); return Promise.resolve(); }),
  } });
  try {
    const view = renderHook(() => useScheduleStorage());
    view.unmount();
    localStorage.setItem(storageKey, JSON.stringify([schedule]));
    await act(async () => { for (const job of jobs) job(); });
    expect(JSON.parse(localStorage.getItem(storageKey))).toEqual([schedule]);
  } finally {
    if (descriptor) Object.defineProperty(navigator, "locks", descriptor);
    else delete navigator.locks;
  }
});

test("팀원은 두 탭에서 서로 다른 이름을 추가해도 기존 등록을 유지한다", () => {
  const view = renderHook(() => useScheduleTeam());
  const utils = renderHook(() => useScheduleTeam());
  act(() => view.result.current.addTeamMember("가 팀원"));
  act(() => utils.result.current.addTeamMember("나 팀원"));
  expect(JSON.parse(localStorage.getItem("made-mate-schedule-team"))).toEqual(["가 팀원", "나 팀원"]);
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: "made-mate-schedule-team" })));
  expect(view.result.current.teamMembers).toEqual(["가 팀원", "나 팀원"]);
});

test("다른 탭에서 제외한 팀원을 오래된 목록으로 되살리지 않고 명시적으로 재등록한다", () => {
  localStorage.setItem("made-mate-schedule-team", JSON.stringify(["가 팀원"]));
  const view = renderHook(() => useScheduleTeam());
  const utils = renderHook(() => useScheduleTeam());
  jest.spyOn(window, "confirm").mockReturnValue(true);
  act(() => view.result.current.removeTeamMember("가 팀원"));
  act(() => utils.result.current.addTeamMember("나 팀원"));
  expect(utils.result.current.teamMembers).toEqual(["나 팀원"]);
  act(() => utils.result.current.addTeamMember("가 팀원"));
  expect(JSON.parse(localStorage.getItem("made-mate-schedule-team"))).toEqual(["가 팀원", "나 팀원"]);
  expect(JSON.parse(localStorage.getItem("made-mate-excluded-team"))).toEqual([]);
});

test("일정 저장 실패 시 프로젝트 전달용 마지막 저장 목록을 변경하지 않는다", () => {
  localStorage.setItem(storageKey, JSON.stringify([schedule]));
  const { result } = renderHook(() => useScheduleStorage());
  const before = result.current.savedItems;
  const originalSet = Storage.prototype.setItem;
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(function(key, value) {
    if (key === storageKey) throw new Error("quota");
    return originalSet.call(this, key, value);
  });
  act(() => result.current.setItems(items => items.map(item => ({ ...item, title: "미저장" }))));
  expect(result.current.saveStatus).toBe("error");
  expect(result.current.savedItems).toBe(before);
  expect(result.current.savedItems[0].title).toBe(schedule.title);
});

test("같은 일정의 탭 간 편집 충돌 시 저장 성공 목록을 유지한다", () => {
  localStorage.setItem(storageKey, JSON.stringify([schedule]));
  const { result } = renderHook(() => useScheduleStorage());
  const before = result.current.savedItems;
  localStorage.setItem(storageKey, JSON.stringify([{ ...before[0], title: "다른 탭 수정" }]));
  act(() => result.current.setItems(items => items.map(item => ({ ...item, title: "현재 탭 수정" }))));
  expect(result.current.saveStatus).toBe("blocked");
  expect(result.current.savedItems).toBe(before);
  expect(JSON.parse(localStorage.getItem(storageKey))[0].title).toBe("다른 탭 수정");
});

test.each([2025, 2026, 2027])("공휴일 %s년 조회 실패를 알리고 성공한 연도 자료는 유지한다", async failedYear => {
  jest.spyOn(global, "fetch").mockImplementation(async url => {
    const year = Number(url.match(/PublicHolidays\/(\d+)/)[1]);
    return { ok: year !== failedYear, json: async () => [{ date: `${year}-01-01`, localName: "신정" }] };
  });
  const { result } = renderHook(() => useScheduleHolidays(2026));
  await waitFor(() => expect(result.current.year).toBe(2026));
  expect(result.current.error).toBe(true);
  for (const year of [2025, 2026, 2027]) {
    expect(result.current.dates[`${year}-01-01`]).toBe(year === failedYear ? undefined : "신정");
  }
});

test("공휴일 조회가 모두 성공하면 실패 안내가 없다", async () => {
  jest.spyOn(global, "fetch").mockResolvedValue({ ok: true, json: async () => [] });
  const { result } = renderHook(() => useScheduleHolidays(2026));
  await waitFor(() => expect(result.current.year).toBe(2026));
  expect(result.current.error).toBe(false);
});

test("응답 형식 오류나 네트워크 실패도 공휴일 조회 실패로 처리한다", async () => {
  jest.spyOn(global, "fetch")
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ message: "invalid" }) });
  const { result } = renderHook(() => useScheduleHolidays(2026));
  await waitFor(() => expect(result.current.year).toBe(2026));
  expect(result.current.error).toBe(true);
});

const storageKey = "made-mate-schedules";
const schedule = {
  id: "recovered", title: "[테스트] 복구 일정", date: "2026-11-04", time: "10:00", endTime: "11:00",
};

test("최초 읽기 오류 후 정상 재조회하면 오류를 해제하고 후속 수정도 저장한다", () => {
  localStorage.setItem(storageKey, JSON.stringify([schedule]));
  const originalGet = Storage.prototype.getItem;
  const read = jest.spyOn(Storage.prototype, "getItem").mockImplementation(function(key) {
    if (key === storageKey) throw new Error("일시적 접근 실패");
    return originalGet.call(this, key);
  });
  const { result } = renderHook(() => useScheduleStorage());
  expect(result.current.saveStatus).toBe("blocked");
  read.mockRestore();
  act(() => result.current.reloadConflictingSchedules());
  expect(result.current.loadedSchedules.readError).toBe(false);
  expect(result.current.saveStatus).toBe("saved");
  expect(result.current.items[0].title).toBe(schedule.title);
  act(() => result.current.setItems(items => items.map(item => ({ ...item, title: "[테스트] 복구 후 수정" }))));
  expect(JSON.parse(localStorage.getItem(storageKey))[0].title).toBe("[테스트] 복구 후 수정");
  expect(result.current.saveStatus).toBe("saved");
});

test("재조회해도 손상된 원본이면 저장 중지를 유지하고 덮어쓰지 않는다", () => {
  localStorage.setItem(storageKey, "{broken");
  const { result } = renderHook(() => useScheduleStorage());
  act(() => result.current.reloadConflictingSchedules());
  expect(result.current.saveStatus).toBe("blocked");
  expect(result.current.loadedSchedules.readError).toBe(true);
  expect(localStorage.getItem(storageKey)).toBe("{broken");
});
