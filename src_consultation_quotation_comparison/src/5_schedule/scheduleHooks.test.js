import { act, renderHook, waitFor } from "@testing-library/react";
import { useScheduleHolidays, useScheduleStorage } from "./scheduleHooks";

afterEach(() => jest.restoreAllMocks());

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
