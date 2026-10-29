/* [파일 안내] 일정관리 자동 회귀 검사
 * 실행: npm test -- --watchAll=false --runInBand src/5_schedule/ScheduleManager.test.js
 * 테스트용 DOM·저장소에서 동작하며 실제 크롬 데이터는 사용하지 않습니다.
 * 날짜·반복 계산과 화면 입력·저장 결과를 검사합니다. CSS의 실제 배치는 브라우저 검사가 필요합니다.
 */

/* beforeEach에서 저장소·공휴일 응답을 준비하고 사용자 동작 후 화면과 저장 결과를 검증합니다. */
import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import ScheduleManager from "./ScheduleManager";
import { loadSchedules, mergeScheduleChanges } from "./scheduleStorage";
import ScheduleFormModal, { ScheduleListModal } from "./ScheduleFormModal";
import { ScheduleAgendaItem, ScheduleEvent } from "./ScheduleItemParts";
import { createScheduleCopyForm, validateScheduleForm, createEmptyForm } from "./scheduleData";
import { getScheduleProjectId, findScheduleConflicts, getScheduleInterval } from "./scheduleData";
import {
  dateKey, getTodayKey, getNextScheduleDate, getUpcomingSchedules,
  normalizeAttendees, createScheduleForm, excludeOccurrence, expandSchedules,
  getSchedulePeople, getRepeatLabel, getScheduleTime, getRepeatSummary, getScheduleDurationFields, restoreDeletedSchedule,
} from "./scheduleData";

/* 가짜 시계와 서버 응답은 테스트 안에서만 사용합니다. afterEach에서 복원해 다른 검사에 영향을 주지 않게 합니다. */
/* 화면 테스트를 읽는 순서: 저장할 데이터 준비 → render로 화면 생성 → fireEvent로 사용자 동작 → expect로 결과 확인.
 * 내부 함수의 모양보다 검색·등록·반복 수정 후 화면과 저장 데이터가 맞는지를 검사합니다.
 */
const storageKey = "made-mate-schedules";

test("입력 오류를 해당 칸에 연결하고 값을 고치면 안내를 해제한다", async () => {
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "개인 일정용", exact: true }));
  const title = screen.getByLabelText("일정 이름");
  fireEvent.invalid(title);
  expect(title).toHaveAttribute("aria-invalid", "true");
  expect(document.getElementById(title.getAttribute("aria-describedby"))).toHaveTextContent("일정 이름을 입력해 주세요");
  fireEvent.change(title, { target: { value: "[테스트] 오류 안내" } });
  expect(title).not.toHaveAttribute("aria-invalid");
  fireEvent.change(screen.getByLabelText("종료 시간"), { target: { value: "08:00" } });
  fireEvent.submit(title.closest("form"));
  expect(screen.getByLabelText("종료 시간")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("종료 시간")).toHaveAccessibleDescription("종료 시간은 시작 시간보다 늦게 입력해 주세요.");
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual([]);
  await act(async () => {});
});

test("접힌 반복 설정의 잘못된 횟수는 오류 안내와 함께 펼친다", async () => {
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "개인 일정용", exact: true }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "[테스트] 반복 오류" } });
  fireEvent.change(screen.getByLabelText("반복 설정"), { target: { value: "weekly:1" } });
  fireEvent.change(screen.getByLabelText("반복 종료", { exact: true }), { target: { value: "count" } });
  fireEvent.change(screen.getByLabelText("반복 횟수"), { target: { value: "0" } });
  fireEvent.submit(screen.getByLabelText("일정 이름").closest("form"));
  const count = screen.getByLabelText("반복 횟수");
  expect(count.closest("details")).toHaveAttribute("open");
  expect(count).toHaveAttribute("aria-invalid", "true");
  expect(count).toHaveAccessibleDescription("반복 횟수는 1~1000 사이의 정수로 입력해 주세요.");
  await act(async () => {});
});

test("새 일정은 새로고침 후 임시 내용을 복구하며 실제 저장 뒤에는 임시 보관을 제거한다", async () => {
  const first = render(<ScheduleManager />);
  const before = localStorage.getItem(storageKey);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "개인 일정용", exact: true }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "[테스트] 새로고침 복구" } });
  fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-11-04" } });
  fireEvent.change(screen.getByLabelText("시작 시간"), { target: { value: "10:00" } });
  expect(JSON.parse(sessionStorage.getItem("made-mate-schedule-draft")).form.title).toBe("[테스트] 새로고침 복구");
  expect(localStorage.getItem(storageKey)).toBe(before);
  first.unmount();
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "이어서 작성" }));
  expect(screen.getByLabelText("일정 이름")).toHaveValue("[테스트] 새로고침 복구");
  expect(screen.getByLabelText("날짜")).toHaveValue("2026-11-04");
  expect(screen.getByLabelText("시작 시간")).toHaveValue("10:00");
  const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(screen.getByRole("button", { name: "취소", exact: true }));
  expect(confirm).toHaveBeenCalled();
  expect(sessionStorage.getItem("made-mate-schedule-draft")).not.toBeNull();
  fireEvent.submit(screen.getByLabelText("일정 이름").closest("form"));
  expect(sessionStorage.getItem("made-mate-schedule-draft")).toBeNull();
  expect(JSON.parse(localStorage.getItem(storageKey))).toHaveLength(1);
  await act(async () => {});
});

test("닫기 확인을 취소하면 임시 보관을 유지하고 닫기를 승인하면 제거한다", async () => {
  const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "[테스트] 임시 보관 취소" } });
  fireEvent.click(screen.getByRole("button", { name: "취소", exact: true }));
  expect(sessionStorage.getItem("made-mate-schedule-draft")).not.toBeNull();
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: "취소", exact: true }));
  expect(sessionStorage.getItem("made-mate-schedule-draft")).toBeNull();
  await act(async () => {});
});

test("손상된 임시 보관은 자동 덮어쓰기 없이 안내하고 기존 일정 수정은 임시 저장하지 않는다", async () => {
  sessionStorage.setItem("made-mate-schedule-draft", "{broken");
  saveSchedules([makeSchedule({ title: "[테스트] 기존 원본" })]);
  render(<ScheduleManager />);
  expect(screen.getByRole("alert")).toHaveTextContent("임시 작성 내용을 읽지 못했습니다");
  expect(sessionStorage.getItem("made-mate-schedule-draft")).toBe("{broken");
  fireEvent.click(screen.getByRole("button", { name: "임시 보관 초기화" }));
  fireEvent.click(screen.getByRole("button", { name: "전체 일정 (1)" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "[테스트] 기존 원본 일정 수정" }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "[테스트] 수정 중" } });
  expect(sessionStorage.getItem("made-mate-schedule-draft")).toBeNull();
  expect(JSON.parse(localStorage.getItem(storageKey))[0].title).toBe("[테스트] 기존 원본");
  await act(async () => {});
});

test("목록 상태 필터는 개인 일정을 제외하고 페이지·건수를 다시 계산하며 원본을 유지한다", () => {
  const items = Array.from({ length: 21 }, (_, index) => makeStoredSchedule({ id: String(index), scope: "업무용", title: `[테스트] 예정 ${index}`, status: "pending" }));
  items.push(makeStoredSchedule({ id: "done", scope: "업무용", title: "[테스트] 완료", status: "completed" }), makeStoredSchedule({ id: "personal", title: "[테스트] 개인" }));
  const before = JSON.stringify(items);
  const { container } = render(<ScheduleListModal items={items} totalCount={items.length} onEdit={jest.fn()} onClose={jest.fn()} onToggleFavorite={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));
  fireEvent.change(screen.getByLabelText("목록 진행 상태"), { target: { value: "completed" } });
  expect(container.querySelectorAll(".sm-list-item")).toHaveLength(1);
  expect(screen.getByText("전체 1건 · 1–1건")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "[테스트] 완료 일정 수정" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "[테스트] 개인 일정 수정" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("목록 진행 상태"), { target: { value: "pending" } });
  expect(screen.getByText("전체 21건 · 1–20건")).toBeInTheDocument();
  expect(JSON.stringify(items)).toBe(before);
});

test("선택 날짜로 새 일정을 열고 빠른 설정·공백 정리 결과를 그대로 저장한다", async () => {
  const { container } = render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "다음 기간" }));
  const cell = [...container.querySelectorAll(".sm-day")].find(element => element.querySelector(".sm-day-num")?.textContent === "4");
  fireEvent.click(cell);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  const expected = new Date();
  expected.setMonth(expected.getMonth() + 1, 4);
  expect(screen.getByLabelText("날짜")).toHaveValue(dateKey(expected));
  fireEvent.click(screen.getByRole("button", { name: "개인 일정용", exact: true }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "  [테스트] 빠른 시간  " } });
  fireEvent.change(screen.getByPlaceholderText("작업 내용, 준비 사항, 전달할 메모 등을 입력하세요."), { target: { value: "  첫째 줄\n  둘째 줄  " } });
  fireEvent.change(screen.getByLabelText("시작 시간"), { target: { value: "23:30" } });
  fireEvent.click(screen.getByRole("button", { name: "1시간", exact: true }));
  expect(screen.getByLabelText("종료 시간")).toHaveValue("00:30");
  const nextDay = new Date(expected); nextDay.setDate(nextDay.getDate() + 1);
  expect(screen.getByLabelText("종료 날짜 (여러 날 일정)")).toHaveValue(dateKey(nextDay));
  fireEvent.submit(screen.getByLabelText("일정 이름").closest("form"));
  expect(JSON.parse(localStorage.getItem(storageKey))[0]).toMatchObject({ date: dateKey(expected), endDate: dateKey(nextDay), endTime: "00:30", title: "[테스트] 빠른 시간", description: "첫째 줄\n  둘째 줄" });
  await act(async () => {});
});

test("빠른 시간은 월말·연말을 넘기고 반복의 다음 날 종료를 막으며 종일에서는 숨긴다", () => {
  const form = { ...createEmptyForm(), date: "2026-12-31", time: "23:30" };
  expect(getScheduleDurationFields(form, 120)).toEqual({ endDate: "2027-01-01", endTime: "01:30" });
  expect(getScheduleDurationFields({ ...form, time: "10:00", endDate: "2027-01-02" }, 30)).toEqual({ endDate: "", endTime: "10:30" });
  expect(getScheduleDurationFields({ ...form, time: "" }, 60)).toBeNull();
  const props = { form: { ...form, repeatType: "weekly" }, teamMembers: [], onChange: jest.fn(), onSubmit: jest.fn(), onClose: jest.fn() };
  const { rerender } = render(<ScheduleFormModal {...props} />);
  expect(screen.getByRole("button", { name: "30분", exact: true })).toBeDisabled();
  rerender(<ScheduleFormModal {...props} form={{ ...form, isAllDay: true }} />);
  expect(screen.queryByRole("group", { name: "종료 시간 빠른 설정" })).not.toBeInTheDocument();
});

test.each(["none", "weekly"])("%s 일정 삭제를 되돌려 원본을 복구하고 다른 일정의 변경은 유지한다", async repeatType => {
  saveSchedules([makeSchedule({ title: "[테스트] 삭제 복원", repeatType }), makeSchedule({ id: "other", title: "[테스트] 다른 일정", date: "2027-06-01" })]);
  jest.spyOn(window, "confirm").mockReturnValue(true);
  render(<ScheduleManager />);
  const before = JSON.parse(localStorage.getItem(storageKey))[0];
  const section = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(section).getByRole("button", { name: "[테스트] 삭제 복원 일정 삭제" }));
  let saved = JSON.parse(localStorage.getItem(storageKey));
  if (repeatType === "weekly") expect(saved.find(item => item.id === before.id).excludedDates).toContain(before.date);
  else expect(saved.some(item => item.id === before.id)).toBe(false);
  saved.find(item => item.id === "other").title = "[테스트] 다른 탭 수정";
  localStorage.setItem(storageKey, JSON.stringify(saved));
  fireEvent(window, new StorageEvent("storage", { key: storageKey }));
  fireEvent.click(screen.getByRole("button", { name: "삭제 되돌리기" }));
  saved = JSON.parse(localStorage.getItem(storageKey));
  expect(saved.find(item => item.id === before.id)).toEqual(before);
  expect(saved.find(item => item.id === "other").title).toBe("[테스트] 다른 탭 수정");
  expect(screen.queryByRole("button", { name: "삭제 되돌리기" })).not.toBeInTheDocument();
  await act(async () => {});
});

test("반복 전체 삭제는 제외일·즐겨찾기까지 복구하며 새로고침 후에도 유지된다", async () => {
  saveSchedules([makeSchedule({ title: "[테스트] 전체 복원", repeatType: "monthly", excludedDates: ["2027-01-01"], isFavorite: true })]);
  jest.spyOn(window, "confirm").mockReturnValue(true);
  const view = render(<ScheduleManager />);
  const before = JSON.parse(localStorage.getItem(storageKey));
  fireEvent.click(screen.getByRole("button", { name: "전체 일정 (1)" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "[테스트] 전체 복원 일정 수정" }));
  fireEvent.click(screen.getByRole("button", { name: "일정 삭제", exact: true }));
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: "삭제 되돌리기" }));
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual(before);
  view.unmount();
  render(<ScheduleManager />);
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual(before);
  await act(async () => {});
});

test("되돌리기는 같은 ID의 재등록과 변경된 원본 반복을 덮어쓰지 않는다", () => {
  const before = makeSchedule({ repeatType: "weekly", excludedDates: [] });
  const after = excludeOccurrence(before, before.date);
  const changed = { ...after, title: "다른 탭 수정" };
  expect(restoreDeletedSchedule([changed], { before, after }).error).toBeTruthy();
  expect(restoreDeletedSchedule([changed], { before, after }).items).toEqual([changed]);
  expect(restoreDeletedSchedule([], { before, after }).error).toBeTruthy();
  expect(restoreDeletedSchedule([changed], { before, after: null }).error).toBeTruthy();
});

test("삭제 취소는 기록을 만들지 않고 연속 삭제는 최근 한 건만 복구하며 15초 후 만료된다", async () => {
  jest.useFakeTimers();
  saveSchedules([makeSchedule({ id: "one", title: "[테스트] 첫 삭제" }), makeSchedule({ id: "two", title: "[테스트] 둘 삭제" })]);
  const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
  render(<ScheduleManager />);
  const section = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(section).getByRole("button", { name: "[테스트] 첫 삭제 일정 삭제" }));
  expect(screen.queryByRole("button", { name: "삭제 되돌리기" })).not.toBeInTheDocument();
  confirm.mockReturnValue(true);
  fireEvent.click(within(section).getByRole("button", { name: "[테스트] 첫 삭제 일정 삭제" }));
  fireEvent.click(within(section).getByRole("button", { name: "[테스트] 둘 삭제 일정 삭제" }));
  fireEvent.click(screen.getByRole("button", { name: "삭제 되돌리기" }));
  expect(JSON.parse(localStorage.getItem(storageKey)).map(item => item.id)).toEqual(["two"]);
  fireEvent.click(within(section).getByRole("button", { name: "[테스트] 둘 삭제 일정 삭제" }));
  act(() => { jest.advanceTimersByTime(15000); });
  expect(screen.queryByRole("status", { name: "일정 삭제 안내" })).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual([]);
  await act(async () => {});
});

test("검색·필터 초기화는 조건을 지우고 선택한 보기와 저장 데이터를 유지한다", async () => {
  saveSchedules([makeSchedule()]);
  render(<ScheduleManager />);
  const before = localStorage.getItem(storageKey);
  expect(screen.queryByRole("button", { name: "검색·필터 초기화" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "주별" }));
  fireEvent.change(screen.getByLabelText("일정 검색"), { target: { value: "없는 검색어" } });
  fireEvent.change(screen.getByLabelText("공유 구분 필터"), { target: { value: "private" } });
  fireEvent.click(screen.getByRole("button", { name: "검색·필터 초기화" }));
  expect(screen.getByLabelText("일정 검색")).toHaveValue("");
  expect(screen.getByLabelText("공유 구분 필터")).toHaveValue("all");
  expect(screen.getByRole("tab", { name: "주별" })).toHaveAttribute("aria-selected", "true");
  expect(screen.queryByRole("button", { name: "검색·필터 초기화" })).not.toBeInTheDocument();
  expect(localStorage.getItem(storageKey)).toBe(before);
  await act(async () => {});
});

test("목록은 20건씩 표시하고 페이지 이동 후에도 원래 일정으로 수정·즐겨찾기를 전달한다", () => {
  const items = Array.from({ length: 21 }, (_, index) => makeStoredSchedule({ id: String(index), title: `[테스트] ${String(index).padStart(2, "0")}` }));
  const onEdit = jest.fn();
  const onToggleFavorite = jest.fn();
  const props = { items, totalCount: 21, onClose: jest.fn(), onEdit, onToggleFavorite };
  const { container, rerender } = render(<ScheduleListModal {...props} />);
  expect(container.querySelectorAll(".sm-list-item")).toHaveLength(20);
  expect(screen.getByText("전체 21건 · 1–20건")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "이전 페이지" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));
  expect(container.querySelectorAll(".sm-list-item")).toHaveLength(1);
  expect(screen.getByText("전체 21건 · 21–21건")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "[테스트] 20 일정 수정" }));
  expect(onEdit).toHaveBeenCalledWith(items[20]);
  fireEvent.click(screen.getByRole("button", { name: "[테스트] 20 즐겨찾기 추가" }));
  expect(onToggleFavorite).toHaveBeenCalledWith(items[20]);
  fireEvent.change(screen.getByLabelText("목록 정렬"), { target: { value: "title" } });
  expect(screen.getByText("전체 21건 · 1–20건")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));
  rerender(<ScheduleListModal {...props} items={items.slice(0, 2)} totalCount={2} />);
  expect(screen.getByText("전체 2건 · 1–2건")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "다음 페이지" })).not.toBeInTheDocument();
});

test("반복 요약은 추가 설정을 접어도 주기·휴일 처리·종료 조건을 보여준다", () => {
  const form = { ...createEmptyForm(), date: "2026-11-11", repeatType: "monthly", monthlyRule: "weekday", monthlyOrdinal: 2, monthlyWeekday: 3, holidayRule: "nextWorkday", repeatEndType: "count", repeatCount: 6 };
  const props = { form, teamMembers: [], onChange: jest.fn(), onSubmit: jest.fn(), onClose: jest.fn() };
  const { container, rerender } = render(<ScheduleFormModal {...props} />);
  expect(container.querySelector("details.sm-extra-settings")).not.toHaveAttribute("open");
  expect(screen.getByLabelText("반복 설정 요약")).toHaveTextContent("매월 둘째 수요일");
  expect(screen.getByLabelText("반복 설정 요약")).toHaveTextContent("주말·공휴일은 다음 근무일 · 규칙 6회");
  rerender(<ScheduleFormModal {...props} form={{ ...form, holidayRule: "skip", repeatEndType: "until", repeatEndDate: "2027-01-31" }} />);
  expect(screen.getByLabelText("반복 설정 요약")).toHaveTextContent("주말·공휴일 건너뛰기 · 2027-01-31까지");
  expect(getRepeatSummary({ ...form, repeatType: "none" })).toBe("반복 없음");
});

test("업무의 달력·목록·상세는 같은 완료 배지를 사용하고 개인 일정은 상태를 표시하지 않는다", () => {
  const item = makeStoredSchedule({ scope: "업무용", status: "completed" });
  const props = { item, onSelect: jest.fn(), onEdit: jest.fn(), onDelete: jest.fn(), onStatusChange: jest.fn(), onToggleFavorite: jest.fn() };
  const { container, rerender } = render(<><ScheduleEvent {...props} compact /><ScheduleAgendaItem {...props} /><ScheduleListModal items={[item]} totalCount={1} onEdit={props.onEdit} onClose={jest.fn()} onToggleFavorite={props.onToggleFavorite} /></>);
  expect(container.querySelectorAll(".sm-status-badge.completed")).toHaveLength(3);
  expect([...container.querySelectorAll(".sm-status-badge")].every(element => element.textContent === "완료")).toBe(true);
  rerender(<ScheduleAgendaItem {...props} item={{ ...item, scope: "개인 일정용" }} />);
  expect(container.querySelector(".sm-status-badge")).toBeNull();
});

function makeStoredSchedule(overrides = {}) {
  return { ...createEmptyForm(), attendees: [], id: "fixture-schedule", scope: "개인 일정용", title: "[테스트] 일정", date: "2026-11-04", ...overrides };
}

test("전체 목록은 날짜·이름·담당자로 정렬하며 원본 배열을 바꾸지 않는다", () => {
  const items = [
    makeStoredSchedule({ id: "a", title: "나 일정", date: "2026-11-03", person: "가 담당" }),
    makeStoredSchedule({ id: "b", title: "가 일정", date: "2026-11-01", person: "나 담당" }),
    makeStoredSchedule({ id: "c", title: "다 일정", date: "2026-11-02", person: "" }),
  ];
  const original = JSON.stringify(items);
  const { container } = render(<ScheduleListModal items={items} totalCount={3} onClose={jest.fn()} onEdit={jest.fn()} onToggleFavorite={jest.fn()} />);
  const titles = () => [...container.querySelectorAll(".sm-list-item-info strong")].map(element => element.textContent);
  expect(titles()).toEqual(["가 일정", "다 일정", "나 일정"]);
  fireEvent.change(screen.getByLabelText("목록 정렬"), { target: { value: "title" } });
  expect(titles()).toEqual(["가 일정", "나 일정", "다 일정"]);
  fireEvent.change(screen.getByLabelText("목록 정렬"), { target: { value: "person" } });
  expect(titles()).toEqual(["나 일정", "가 일정", "다 일정"]);
  expect(JSON.stringify(items)).toBe(original);
});

test.each([
  [{ repeatEndType: "until", repeatEndDate: "2026-11-18" }, ["2026-11-04", "2026-11-11", "2026-11-18"]],
  [{ repeatEndType: "count", repeatCount: 2 }, ["2026-11-04", "2026-11-11"]],
  [{ repeatEndType: "count", repeatCount: 2, excludedDates: ["2026-11-04"] }, ["2026-11-11"]],
])("주간 반복 종료는 먼 미래와 조회 범위가 달라도 원래 규칙 기준으로 계산한다: %j", (options, dates) => {
  const item = { id: "end-test", title: "[테스트] 종료", date: "2026-11-04", time: "09:00", repeatType: "weekly", repeatInterval: 1, ...options };
  expect(expandSchedules([item], "2026-11-01", "2027-12-31").map(entry => entry.date)).toEqual(dates);
  expect(expandSchedules([item], "2027-01-01", "2027-12-31")).toEqual([]);
});
test("월간 요일 반복은 시작일보다 앞선 이번 달 회차를 횟수에 포함하지 않는다", () => {
  const item = { id: "month-end-test", date: "2026-11-20", time: "09:00", repeatType: "monthly", repeatInterval: 1, monthlyRule: "weekday", monthlyOrdinal: 2, monthlyWeekday: 3, repeatEndType: "count", repeatCount: 2 };
  expect(expandSchedules([item], "2026-11-01", "2027-12-31").map(entry => entry.date)).toEqual(["2026-12-09", "2027-01-13"]);
  expect(expandSchedules([item], "2027-01-01", "2027-12-31").map(entry => entry.date)).toEqual(["2027-01-13"]);
});
test("휴일 건너뛰기도 횟수에 포함하고 종료일까지의 원래 회차는 다음 근무일로 이동할 수 있다", () => {
  const base = { id: "holiday-end", date: "2026-11-01", time: "09:00", repeatType: "monthly", repeatInterval: 1 };
  expect(expandSchedules([{ ...base, holidayRule: "skip", repeatEndType: "count", repeatCount: 2 }], "2026-11-01", "2027-01-31").map(item => item.date)).toEqual(["2026-12-01"]);
  expect(expandSchedules([{ ...base, holidayRule: "nextWorkday", repeatEndType: "until", repeatEndDate: "2026-11-01" }], "2026-11-02", "2026-11-02").map(item => item.date)).toEqual(["2026-11-02"]);
});
test.each([
  [{ repeatEndType: "count", repeatCount: 0 }, "반복 횟수"],
  [{ repeatEndType: "count", repeatCount: 1001 }, "반복 횟수"],
  [{ repeatEndType: "until", repeatEndDate: "2026-10-01" }, "반복 종료 날짜"],
])("반복 종료 입력을 검증한다: %j", (options, message) => {
  expect(validateScheduleForm({ ...createEmptyForm(), scope: "개인 일정용", title: "[테스트] 종료", date: "2026-11-01", repeatType: "weekly", ...options })).toContain(message);
});
test("반복 종료 조건은 저장 자료를 다시 읽거나 수정 폼을 열어도 유지된다", () => {
  saveSchedules([makeSchedule({ repeatType: "weekly", repeatEndType: "count", repeatCount: 3 })]);
  const loaded = loadSchedules().items[0];
  expect(createScheduleForm(loaded)).toMatchObject({ repeatEndType: "count", repeatCount: 3 });
  expect(createScheduleForm({ ...loaded, occurrenceDate: loaded.date })).toMatchObject({ repeatType: "none", repeatEndType: "none" });
});
test("일정 복사는 입력값과 반복 종료만 유지하고 저장 식별자·회차 예외는 복사하지 않는다", () => {
  const item = makeSchedule({ title: "[테스트] 원본", repeatType: "weekly", repeatEndType: "count", repeatCount: 3, isFavorite: true, excludedDates: ["2026-11-11"], status: "completed", replacesScheduleId: "other" });
  const before = JSON.stringify(item);
  const copy = createScheduleCopyForm(item);
  expect(copy).toMatchObject({ title: "[테스트] 원본 (복사)", status: "pending", repeatType: "weekly", repeatEndType: "count", repeatCount: 3 });
  for (const field of ["id", "isFavorite", "excludedDates", "replacesScheduleId"]) expect(copy).not.toHaveProperty(field);
  expect(JSON.stringify(item)).toBe(before);
});
test("수정창에서 복사하면 저장 전까지 원본을 유지하고 저장 시 새 ID를 생성한다", async () => {
  saveSchedules([makeSchedule({ scope: "개인 일정용", title: "[테스트] 복사 원본" })]);
  render(<ScheduleManager />);
  const before = JSON.parse(localStorage.getItem(storageKey));
  fireEvent.click(screen.getByRole("button", { name: "전체 일정 (1)" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "[테스트] 복사 원본 일정 수정" }));
  fireEvent.click(screen.getByRole("button", { name: "일정 복사" }));
  expect(screen.getByLabelText("일정 이름")).toHaveValue("[테스트] 복사 원본 (복사)");
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual(before);
  fireEvent.click(screen.getByRole("button", { name: "일정 저장" }));
  const saved = JSON.parse(localStorage.getItem(storageKey));
  expect(saved).toHaveLength(2);
  expect(saved.find(item => item.id === before[0].id)).toEqual(before[0]);
  expect(saved.find(item => item.title.endsWith("(복사)")).id).not.toBe(before[0].id);
  await act(async () => {});
});
test.each(["until", "count"])("등록 폼에서 반복 종료 %s를 설정해 저장하고 수정 창에서 복원한다", async mode => {
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "개인 일정용", exact: true }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "[테스트] 종료 조건 저장" } });
  fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-11-04" } });
  fireEvent.change(screen.getByLabelText("반복 설정"), { target: { value: "weekly:1" } });
  fireEvent.change(screen.getByLabelText("반복 종료", { exact: true }), { target: { value: mode } });
  if (mode === "until") fireEvent.change(screen.getByLabelText("반복 종료 날짜"), { target: { value: "2026-11-18" } });
  else fireEvent.change(screen.getByLabelText("반복 횟수"), { target: { value: "3" } });
  fireEvent.submit(screen.getByLabelText("일정 이름").closest("form"));
  const saved = JSON.parse(localStorage.getItem(storageKey));
  expect(saved[0].repeatEndType).toBe(mode);
  expect(expandSchedules(saved, "2026-11-01", "2027-12-31").map(item => item.date)).toEqual(["2026-11-04", "2026-11-11", "2026-11-18"]);
  fireEvent.click(screen.getByRole("button", { name: "전체 일정 (1)" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "[테스트] 종료 조건 저장 일정 수정" }));
  expect(screen.getByLabelText("반복 종료", { exact: true })).toHaveValue(mode);
  await act(async () => {});
});
test("저장 잠금을 기다리는 동안에는 완료가 아닌 저장 중으로 표시한다", async () => {
  const original = Object.getOwnPropertyDescriptor(navigator, "locks");
  const jobs = [];
  Object.defineProperty(navigator, "locks", { configurable: true, value: {
    request: jest.fn((name, callback) => { jobs.push(callback); return Promise.resolve(); }),
  } });
  let view;
  try {
    view = render(<ScheduleManager />);
    expect(screen.getByRole("status", { name: "일정 저장 상태" })).toHaveTextContent("저장 중");
    await act(async () => { jobs.shift()(); });
    expect(screen.getByRole("status", { name: "일정 저장 상태" })).toHaveTextContent("브라우저에 저장 완료");
  } finally {
    view?.unmount();
    if (original) Object.defineProperty(navigator, "locks", original);
    else delete navigator.locks;
  }
});
test("일정 저장 실패를 완료로 표시하지 않는다", async () => {
  const original = Storage.prototype.setItem;
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(function(key, value) {
    if (key === storageKey) throw new Error("Storage unavailable");
    return original.call(this, key, value);
  });
  render(<ScheduleManager />);
  expect(screen.getByRole("status", { name: "일정 저장 상태" })).toHaveTextContent("저장 실패");
  expect(screen.getByRole("alert")).toHaveTextContent("저장하지 못했습니다");
  await act(async () => {});
});
test("손상된 저장 자료는 저장 중지 상태로 표시하고 원본을 유지한다", async () => {
  localStorage.setItem(storageKey, "{invalid-json");
  render(<ScheduleManager />);
  expect(screen.getByRole("status", { name: "일정 저장 상태" })).toHaveTextContent("저장 중지");
  expect(localStorage.getItem(storageKey)).toBe("{invalid-json");
  await act(async () => {});
});
test.each(["취소", "닫기", "배경", "Escape"])("작성 중 %s로 닫기를 시도하면 취소 시 입력을 유지하고 확인 시에만 닫는다", async action => {
  render(<ScheduleManager />);
  const opener = screen.getByRole("button", { name: "일정 등록", exact: true });
  opener.focus();
  fireEvent.click(opener);
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "[테스트] 작성 중 보호" } });
  const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
  const close = () => {
    const dialog = screen.getByRole("dialog");
    if (action === "배경") fireEvent.mouseDown(dialog.parentElement);
    else if (action === "Escape") fireEvent.keyDown(screen.getByLabelText("일정 이름"), { key: "Escape" });
    else fireEvent.click(within(dialog).getByRole("button", { name: action, exact: true }));
  };
  close();
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("일정 이름")).toHaveValue("[테스트] 작성 중 보호");
  confirm.mockReturnValue(true);
  close();
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual([]);
  await act(async () => {});
});
test("입력을 원래 값으로 돌리면 닫기 확인을 표시하지 않는다", async () => {
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  const title = screen.getByLabelText("일정 이름");
  fireEvent.change(title, { target: { value: "[테스트] 되돌리기" } });
  fireEvent.change(title, { target: { value: "" } });
  const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "취소" }));
  expect(confirm).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await act(async () => {});
});
test("등록 팝업은 Tab을 순환하고 Escape로 닫은 뒤 등록 버튼에 초점을 돌려준다", async () => {
  render(<ScheduleManager />);
  const opener = screen.getByRole("button", { name: "일정 등록", exact: true });
  opener.focus();
  fireEvent.click(opener);
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByLabelText("일정 이름")).toHaveFocus();
  const first = within(dialog).getByRole("button", { name: "닫기" });
  const last = within(dialog).getByRole("button", { name: "일정 저장" });
  last.focus();
  fireEvent.keyDown(last, { key: "Tab" });
  expect(first).toHaveFocus();
  fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
  expect(last).toHaveFocus();
  fireEvent.keyDown(last, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
  await act(async () => {});
});
test("전체 목록 팝업도 처음 초점을 받고 닫기 버튼으로 원래 위치에 복귀한다", async () => {
  render(<ScheduleManager />);
  const opener = screen.getByRole("button", { name: "전체 일정 (0)" });
  opener.focus();
  fireEvent.click(opener);
  const close = within(screen.getByRole("dialog")).getByRole("button", { name: "닫기" });
  expect(close).toHaveFocus();
  fireEvent.click(close);
  expect(opener).toHaveFocus();
  await act(async () => {});
});
const overnightSchedule = {
  id: "overnight-test", title: "[테스트] 다음 날 오전 종료", date: "2026-11-04", endDate: "2026-11-05",
  time: "18:00", endTime: "09:00", repeatType: "none", scope: "업무용", person: "검사 담당자", status: "pending",
};
test.each([
  ["2026-11-04T17:00:00", 1],
  ["2026-11-05T08:59:00", 1],
  ["2026-11-05T09:00:00", 0],
  ["2026-11-06T00:00:00", 0],
])("여러 날 일정의 시작 전·종료 경계를 확인한다: %s", (now, count) => {
  expect(getUpcomingSchedules([overnightSchedule], new Date(now).getTime(), 5, 7)).toHaveLength(count);
});
test("종일 일정은 마지막 1분까지 유지되고 다음 날 자정에는 종료된다", () => {
  const item = { ...overnightSchedule, isAllDay: true };
  expect(getUpcomingSchedules([item], new Date("2026-11-05T23:59:30").getTime(), 5, 7)).toHaveLength(1);
  expect(getUpcomingSchedules([item], new Date("2026-11-06T00:00:00").getTime(), 5, 7)).toEqual([]);
});
test("여러 날 일정의 표시 시간과 구간 계산은 저장 원본을 바꾸지 않는다", () => {
  const original = JSON.stringify(overnightSchedule);
  const entries = expandSchedules([overnightSchedule], "2026-11-04", "2026-11-05");
  for (const item of entries) {
    const interval = getScheduleInterval(item, true);
    expect(interval.start).toBeLessThan(interval.end);
    getScheduleTime(item);
  }
  expect(JSON.stringify(overnightSchedule)).toBe(original);
});
test.each(["2026-11-04T19:00:00", "2026-11-05T08:00:00"])("여러 날 일정은 %s에도 진행 중으로 한 번만 표시한다", now => {
  const items = getUpcomingSchedules([overnightSchedule], new Date(now).getTime(), 5, 7);
  expect(items).toHaveLength(1);
  expect(items[0].id).toBe(overnightSchedule.id);
  expect(getScheduleInterval(items[0]).start).toBeLessThan(new Date(now).getTime());
});
test("여러 날 일정은 종료 시각 이후 다가오는 목록에서 제외한다", () => {
  expect(getUpcomingSchedules([overnightSchedule], new Date("2026-11-05T09:00:00").getTime(), 5, 7)).toEqual([]);
});
test.each([
  ["2026-11-04", "17:00", "17:30", false],
  ["2026-11-04", "20:00", "21:00", true],
  ["2026-11-05", "08:00", "08:30", true],
  ["2026-11-05", "09:00", "10:00", false],
])("여러 날 일정의 날짜별 실제 구간 충돌 %s %s~%s", (date, time, endTime, overlaps) => {
  const candidate = { ...overnightSchedule, id: "candidate-test", title: "[테스트] 구간 비교", date, time, endTime, endDate: "" };
  expect(findScheduleConflicts(candidate, [overnightSchedule], date, date, {}).length > 0).toBe(overlaps);
});
test("여러 날 카드 시간은 첫날과 마지막 날에 맞춰 표시한다", () => {
  const entries = expandSchedules([overnightSchedule], "2026-11-04", "2026-11-05");
  expect(entries.map(item => getScheduleTime(item))).toEqual(["18:00~24:00", "00:00~09:00"]);
});
test("종료 시간의 최소값은 같은 날짜에만 적용하고 다음 날 오전 종료를 허용한다", async () => {
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "개인 일정용", exact: true }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "[테스트] 다음 날 종료" } });
  fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-11-04" } });
  fireEvent.change(screen.getByLabelText("시작 시간"), { target: { value: "18:00" } });
  const end = screen.getByLabelText("종료 시간");
  expect(end).toHaveAttribute("min", "18:00");
  fireEvent.change(screen.getByLabelText("종료 날짜 (여러 날 일정)"), { target: { value: "2026-11-05" } });
  expect(end).not.toHaveAttribute("min");
  fireEvent.change(end, { target: { value: "09:00" } });
  fireEvent.submit(end.closest("form"));
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual(expect.arrayContaining([
    expect.objectContaining({ title: "[테스트] 다음 날 종료", date: "2026-11-04", endDate: "2026-11-05", time: "18:00", endTime: "09:00" }),
  ]));
  await act(async () => {});
});
test.each([
  [{ scope: "개인 일정용", project: "예전 프로젝트", projectId: 1 }, null],
  [{ scope: "업무용", project: "", projectId: 1 }, null],
  [{ scope: "업무용", project: "프로젝트", projectId: "" }, null],
  [{ scope: "업무용", project: "프로젝트", projectId: {} }, null],
  [{ scope: "업무용", project: "프로젝트", projectId: 0 }, 0],
  [{ scope: "업무용", project: "프로젝트", projectId: "project-1" }, "project-1"],
])("프로젝트 연결 ID를 기존 자료형을 유지하며 선택값으로 처리한다: %j", (item, expected) => {
  expect(getScheduleProjectId(item)).toBe(expected);
});
test.each(["input", "change"])("날짜·시간 %s 이벤트 후 포커스를 옮기지 않고 제출해도 입력값을 저장한다", async eventType => {
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "개인 일정용", exact: true }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "[테스트] 즉시 저장" } });
  const date = screen.getByLabelText("날짜");
  const start = screen.getByLabelText("시작 시간");
  const end = screen.getByLabelText("종료 시간");
  fireEvent[eventType](date, { target: { value: "2026-11-04" } });
  fireEvent[eventType](start, { target: { value: "10:00" } });
  end.focus();
  fireEvent[eventType](end, { target: { value: "11:00" } });
  expect(end).toHaveFocus();
  fireEvent.submit(end.closest("form"));
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual(expect.arrayContaining([
    expect.objectContaining({ title: "[테스트] 즉시 저장", date: "2026-11-04", time: "10:00", endTime: "11:00" }),
  ]));
  await act(async () => {});
});
// 테스트 준비에서 일정의 담당자·참석자를 팀원 목록에도 미리 등록합니다.
// 실제 앱은 기존 일정 불러오기만으로 팀원을 만들지는 않으며, 새 업무일정 저장 시 새 이름을 등록합니다.
function saveSchedules(schedules) {
  localStorage.setItem(storageKey, JSON.stringify(schedules));
  const members = [];
  for (const schedule of schedules) {
    for (const name of getSchedulePeople(schedule)) {
      if (!members.includes(name)) members.push(name);
    }
  }
  localStorage.setItem("made-mate-schedule-team", JSON.stringify(members));
}

function chooseAssignee(name) {
  const input = screen.getByRole("combobox", { name: "담당자", exact: true });
  fireEvent.change(input, { target: { value: name } });
}

function chooseWorkSchedule(category = "업무") {
  fireEvent.click(screen.getByRole("button", { name: "업무용", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: category, exact: true }));
}
// 기본 일정에 overrides를 마지막으로 펼쳐 테스트마다 필요한 속성만 바꿉니다.
const makeSchedule = (overrides = {}) => ({
  id: "test-schedule",
  date: getTodayKey(),
  time: "09:00",
  title: "검증용 마감",
  project: "테스트 프로젝트",
  person: "담당자",
  type: "마감",
  status: "pending",
  repeatType: "none",
  ...overrides,
});

test("고객관리 연결을 제거한 뒤에도 기존 일정과 담당자 정보를 유지한다", () => {
  const schedule = makeSchedule({
    person: "일정 담당자",
    connections: { customer: { name: "이전 고객사", phone: "010-0000-0000" } },
  });
  localStorage.setItem(storageKey, JSON.stringify([schedule]));

  const result = loadSchedules();

  expect(result.readError).toBe(false);
  expect(result.items).toHaveLength(1);
  expect(result.items[0]).toMatchObject({
    id: schedule.id,
    title: schedule.title,
    person: "일정 담당자",
  });
  expect(result.items[0]).not.toHaveProperty("connections");
});

// 코드 표현을 바꾼 뒤에도 공백·중복 이름 정리와 원본 보존이 유지되는지 확인합니다.
test("수정 폼과 제외 날짜를 만들 때 저장 원본을 바꾸지 않는다", () => {
  const attendees = [" 민수 ", null, "", "민수", "지수"];
  expect(normalizeAttendees(attendees)).toEqual(["민수", "지수"]);
  expect(normalizeAttendees(" 민수，지수\n민수,,")).toEqual(["민수", "지수"]);
  expect(attendees).toEqual([" 민수 ", null, "", "민수", "지수"]);

  const item = makeSchedule({ attendees, repeatType: "monthly", repeatInterval: 12, occurrenceDate: "2026-10-22", excludedDates: ["2026-10-22", "2026-10-22"] });
  const form = createScheduleForm(item);
  expect(form.attendees).toBe("민수, 지수");
  expect(form.repeatType).toBe("none");
  expect(form.repeatInterval).toBe(1);
  expect(form).not.toHaveProperty("id");
  expect(form).not.toHaveProperty("occurrenceDate");
  expect(excludeOccurrence(item, "2026-11-22").excludedDates).toEqual(["2026-10-22", "2026-11-22"]);
  expect(item.excludedDates).toEqual(["2026-10-22", "2026-10-22"]);
  expect(item.repeatType).toBe("monthly");
});

test("일반 일정 수정은 기존 ID를 유지하고 삭제는 선택한 일정만 제거한다", async () => {
  saveSchedules([
    makeSchedule({ id: "edit-target", title: "수정할 작업" }),
    makeSchedule({ id: "keep", title: "유지할 작업" }),
  ]);
  jest.spyOn(window, "confirm").mockReturnValue(true);
  render(<ScheduleManager />);
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(selected).getByRole("button", { name: "수정할 작업 일정 수정" }));
  fireEvent.change(screen.getByRole("textbox", { name: "일정 이름" }), { target: { value: "수정한 작업" } });
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));

  let saved = JSON.parse(localStorage.getItem(storageKey));
  expect(saved).toHaveLength(2);
  expect(saved.find((item) => item.id === "edit-target").title).toBe("수정한 작업");
  expect(within(selected).getByText("유지할 작업")).toBeInTheDocument();
  fireEvent.click(within(selected).getByRole("button", { name: "수정한 작업 일정 삭제" }));
  saved = JSON.parse(localStorage.getItem(storageKey));
  expect(saved).toHaveLength(1);
  expect(saved[0].id).toBe("keep");
  await act(async () => {});
});

// 날짜별 더보기와 전체 목록이 같은 열기 함수를 사용해도 날짜 조건이 남지 않는지 확인합니다.
test("달력 더보기는 해당 날짜만 열고 전체 보기와 다시 열기에서는 모든 일정을 표시한다", async () => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-10-23T12:00:00"));
  saveSchedules([
    makeSchedule({ id: "first", title: "첫 번째 일정" }),
    makeSchedule({ id: "second", title: "두 번째 일정" }),
    makeSchedule({ id: "third", title: "세 번째 일정" }),
    makeSchedule({ id: "other", date: "2026-10-24", title: "다른 날짜 일정" }),
  ]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "+ 더보기" }));
  let dialog = screen.getByRole("dialog");
  expect(within(dialog).getByRole("heading", { name: "2026.10.23 일정" })).toBeInTheDocument();
  expect(within(dialog).getAllByRole("article")).toHaveLength(3);
  expect(within(dialog).queryByText("다른 날짜 일정")).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "전체 일정 보기" }));
  expect(within(dialog).getAllByRole("article")).toHaveLength(4);
  fireEvent.click(within(dialog).getByRole("button", { name: "닫기" }));
  fireEvent.click(screen.getByRole("button", { name: "전체 일정 (4)" }));
  dialog = screen.getByRole("dialog");
  expect(within(dialog).getAllByRole("article")).toHaveLength(4);
  expect(within(dialog).queryByRole("button", { name: "전체 일정 보기" })).not.toBeInTheDocument();
  await act(async () => {});
});

test("월말 반복은 짧은 달의 말일에 표시하고 다음 달에는 원래 일자로 돌아온다", () => {
  const monthly = makeSchedule({ date: "2026-01-31", repeatType: "monthly", excludedDates: ["2026-03-31"] });
  const ordinary = makeSchedule({ id: "ordinary", date: "2026-02-15" });
  const result = expandSchedules([monthly, ordinary], "2026-02-01", "2026-05-31");
  expect(result.map((item) => item.date)).toEqual(["2026-02-15", "2026-02-28", "2026-04-30", "2026-05-31"]);
  expect(monthly.date).toBe("2026-01-31");
});

test("monthly weekday rules repeat on the chosen ordinal weekday", () => {
  const monthly = makeSchedule({
    date: "2026-10-14",
    time: "10:00",
    endTime: "11:00",
    repeatType: "monthly",
    monthlyRule: "weekday",
    monthlyOrdinal: 2,
    monthlyWeekday: 3,
  });
  const result = expandSchedules([monthly], "2026-10-01", "2027-01-31");
  expect(result.map((item) => item.date)).toEqual([
    "2026-10-14", "2026-11-11", "2026-12-09", "2027-01-13",
  ]);
  expect(getRepeatLabel(monthly)).toBe("매월 둘째 수요일 10:00~11:00");

  const lastFriday = makeSchedule({
    date: "2026-10-30",
    repeatType: "monthly",
    monthlyRule: "weekday",
    monthlyOrdinal: -1,
    monthlyWeekday: 5,
  });
  expect(expandSchedules([lastFriday], "2026-10-01", "2026-11-30").map((item) => item.date))
    .toEqual(["2026-10-30", "2026-11-27"]);
});

beforeEach(() => {
  // 테스트끼리 저장 데이터를 공유하지 않도록 비웁니다.
  // 실제 공휴일 서버 대신 빈 정상 응답을 사용해 인터넷 상태가 결과에 영향을 주지 않게 합니다.
  localStorage.clear();
  sessionStorage.clear();
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => [],
  });
});

afterEach(() => {
  // 가짜 시간과 가짜 함수를 원래대로 되돌려 다음 테스트에 영향을 주지 않게 합니다.
  jest.restoreAllMocks();
  jest.useRealTimers();
});

// 두 목록이 같은 프로젝트 이동 함수를 사용하므로 같은 입력으로 양쪽 진입 경로를 검사합니다.
test.each(["프로젝트"])("%s 목록에서 프로젝트를 누르면 가까운 날짜의 해당 일정과 상세 정보를 확인한다", async (source) => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-10-22T12:00:00"));
  saveSchedules([
    makeSchedule({ id: "past", date: "2026-10-01", project: "test", title: "지난 작업" }),
    makeSchedule({ id: "next", date: "2026-10-25", project: "test", person: "김담당", title: "선택 작업", description: "준비물과 전달 사항" }),
    makeSchedule({ id: "other", date: "2026-10-25", project: "test2", title: "다른 프로젝트 작업" }),
  ]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: source === "프로젝트" ? "일정 등록 프로젝트 목록 보기" : "등록된 팀원 목록 보기" }));
  if (source === "팀원") fireEvent.click(screen.getByRole("button", { name: "김담당" }));
  fireEvent.click(screen.getByRole("button", { name: "test 프로젝트 일정 보기" }));
  // 프로젝트 선택 결과는 메인 일별 달력에도 적용하고, 펼쳤던 목록은 닫아 결과를 가리지 않습니다.
  expect(screen.getByRole("tab", { name: "일별" })).toHaveAttribute("aria-selected", "true");
  expect(screen.queryByRole("region", { name: /^(프로젝트|팀원) 목록$/ })).not.toBeInTheDocument();
  const calendar = screen.getByRole("region", { name: "일정 달력" });
  expect(within(calendar).getByRole("button", { name: /선택 작업 선택한 날짜 일정에서 보기/ })).toBeInTheDocument();
  expect(within(calendar).queryByRole("button", { name: /다른 프로젝트 작업 선택한 날짜 일정에서 보기/ })).not.toBeInTheDocument();
  // 주별·월별로 바꿔도 같은 프로젝트 조건을 유지합니다.
  for (const view of ["주별", "월별", "일별"]) {
    fireEvent.click(within(calendar).getByRole("tab", { name: view }));
    expect(within(calendar).getByRole("button", { name: /선택 작업 선택한 날짜 일정에서 보기/ })).toBeInTheDocument();
    expect(within(calendar).queryByRole("button", { name: /다른 프로젝트 작업 선택한 날짜 일정에서 보기/ })).not.toBeInTheDocument();
  }
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  expect(selected).toHaveTextContent("2026.10.25");
  expect(within(selected).getByText("test", { selector: "dd" })).toBeInTheDocument();
  expect(within(selected).getByText("선택 작업")).toBeInTheDocument();
  expect(within(selected).getByText("준비물과 전달 사항")).toBeInTheDocument();
  // test와 test2를 함께 준비해 부분 검색이 아니라 정확한 프로젝트 선택인지 확인합니다.
  expect(within(selected).queryByText("다른 프로젝트 작업")).not.toBeInTheDocument();
  fireEvent.click(within(selected).getByRole("button", { name: "선택 작업 일정 수정" }));
  // 같은 제목이 달력에도 있으므로 상세 입력 검사는 dialog 안으로 조회 범위를 제한합니다.
  expect(within(screen.getByRole("dialog")).getByRole("textbox", { name: /상세 내용/ })).toHaveValue("준비물과 전달 사항");
  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  fireEvent.click(within(calendar).getByRole("button", { name: "전체 프로젝트 보기" }));
  expect(within(selected).getByText("다른 프로젝트 작업")).toBeInTheDocument();
  expect(within(calendar).getByRole("button", { name: /다른 프로젝트 작업 선택한 날짜 일정에서 보기/ })).toBeInTheDocument();
  await act(async () => {});
});

test("프로젝트 이동 날짜는 반복 제외일을 건너뛰고 미래 일정이 없으면 최근 과거로 정한다", () => {
  // 주간 제외일 두 건, 연간 간격의 월간 반복, 모두 과거인 일반 일정을 각각 확인합니다.
  expect(getNextScheduleDate([makeSchedule({ date: "2026-10-01", repeatType: "weekly", excludedDates: ["2026-10-22", "2026-10-29"] })], "2026-10-22")).toBe("2026-11-05");
  expect(getNextScheduleDate([makeSchedule({ date: "2025-01-31", repeatType: "monthly", repeatInterval: 12, excludedDates: ["2027-01-31"] })], "2026-10-22")).toBe("2028-01-31");
  expect(getNextScheduleDate([makeSchedule({ date: "2026-10-01" }), makeSchedule({ date: "2026-10-15" })], "2026-10-22")).toBe("2026-10-15");
});

test("프로젝트 아이콘은 검색·기간과 무관하게 중복 없는 프로젝트 목록을 열고 닫는다", async () => {
  saveSchedules([
    makeSchedule({ id: "a", project: "가 프로젝트" }),
    makeSchedule({ id: "b", project: "가 프로젝트" }),
    makeSchedule({ id: "c", date: "2025-01-01", project: "나 프로젝트" }),
  ]);
  render(<ScheduleManager />);
  fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: "없는 검색" } });
  const icon = screen.getByRole("button", { name: "일정 등록 프로젝트 목록 보기" });
  fireEvent.click(icon);
  const directory = screen.getByRole("region", { name: "프로젝트 목록" });
  expect(within(directory).getAllByRole("listitem")).toHaveLength(2);
  expect(within(directory).getByText("나 프로젝트")).toBeInTheDocument();
  expect(icon).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(within(directory).getByRole("button", { name: "목록 닫기" }));
  expect(screen.queryByRole("region", { name: "프로젝트 목록" })).not.toBeInTheDocument();
  await act(async () => {});
});

test.each([
  ["오늘의 작업 일별 보기", "일별"],
])("%s는 오늘로 이동하고 검색과 필터를 해제한다", async (name, view) => {
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "다음 기간" }));
  fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: "검색" } });
  fireEvent.change(screen.getByRole("combobox", { name: "공유 구분 필터" }), { target: { value: "private" } });
  fireEvent.click(screen.getByRole("button", { name }));
  expect(screen.getByRole("tab", { name: view })).toHaveAttribute("aria-selected", "true");
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  expect(selected).toHaveTextContent(getTodayKey().replaceAll("-", "."));
  expect(screen.getByRole("textbox", { name: "일정 검색" })).toHaveValue("");
  expect(screen.getByRole("combobox", { name: "공유 구분 필터" })).toHaveValue("all");
  expect(screen.queryByRole("combobox", { name: "업무 상태 필터" })).not.toBeInTheDocument();
  await act(async () => {});
});

test("팀원 목록 진입점은 숨기고 담당자별 일정에는 일정에 등록된 사람을 표시한다", async () => {
  saveSchedules([makeSchedule({ person: "김담당", attendees: ["이참석"] })]);
  render(<ScheduleManager />);
  expect(screen.queryByRole("button", { name: "등록된 팀원 목록 보기" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "담당자별 주간" }));
  expect(screen.getByRole("button", { name: "김담당 일정 펼치기" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "이참석 일정 펼치기" })).toBeInTheDocument();
  await act(async () => {});
});

test("프로젝트 목록의 빈 상태를 표시하고 팀원 목록 진입점은 숨긴다", async () => {
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록 프로젝트 목록 보기" }));
  expect(screen.getByText("일정에 등록된 프로젝트가 없습니다. 업무 일정의 프로젝트 분류에서 추가해 주세요.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "등록된 팀원 목록 보기" })).not.toBeInTheDocument();
  await act(async () => {});
});

test("프로젝트·담당자·참석자 검색은 달력에 반영하고 별도 검색 목록은 만들지 않는다", async () => {
  // 가짜 시계로 날짜를 고정합니다. 오늘이 바뀌어도 같은 10월 화면을 검사할 수 있습니다.
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-10-22T12:00:00"));
  saveSchedules([
    makeSchedule({ id: "later", date: "2026-10-25", title: "두 번째 작업", project: "검색 프로젝트", person: "김담당", attendees: ["이참석"] }),
    makeSchedule({ id: "first", date: "2026-10-05", title: "첫 번째 작업", project: "검색 프로젝트", person: "김담당", attendees: ["이참석"] }),
    makeSchedule({ id: "outside", date: "2026-11-01", title: "다음 달 작업", project: "검색 프로젝트", person: "김담당" }),
    makeSchedule({ id: "unrelated", title: "다른 작업" }),
  ]);
  render(<ScheduleManager />);
  expect(screen.queryByRole("region", { name: "검색한 일정" })).not.toBeInTheDocument();
  for (const query of [" 검색 프로젝트 ", "김담당", "이참석"]) {
    fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: query } });
    const results = screen.getByRole("region", { name: "일정 달력" });
    expect(within(results).getByText("검색 결과 2건")).toBeInTheDocument();
    expect(within(results).getAllByRole("button", { name: /선택한 날짜 일정에서 보기$/ }).map((element) => element.querySelector("strong").textContent)).toEqual(["첫 번째 작업", "두 번째 작업"]);
    expect(within(results).queryByText("다음 달 작업")).not.toBeInTheDocument();
  }
  const calendar = screen.getByRole("region", { name: "일정 달력" });
  fireEvent.click(within(calendar).getByText("5", { exact: true }).closest(".sm-day"));
  expect(screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section")).toHaveTextContent("2026.10.05");
  fireEvent.click(screen.getByRole("button", { name: "검색 초기화" }));
  expect(screen.getByRole("textbox", { name: "일정 검색" })).toHaveValue("");
  expect(screen.queryByRole("region", { name: "검색한 일정" })).not.toBeInTheDocument();
  await act(async () => {});
});

test("달력 검색은 보기 기간과 공개 필터를 따르고 결과 건수를 표시한다", async () => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-10-22T12:00:00"));
  saveSchedules([
    makeSchedule({ id: "today", title: "검색 오늘", visibility: "shared" }),
    makeSchedule({ id: "week", date: "2026-10-23", title: "검색 내일", visibility: "private", status: "completed" }),
    makeSchedule({ id: "month", date: "2026-10-05", title: "검색 월초", visibility: "shared" }),
  ]);
  render(<ScheduleManager />);
  fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: "검색" } });
  const count = () => screen.getByText(/^검색 결과 \d+건$/);
  expect(count()).toHaveTextContent("3건");
  fireEvent.click(screen.getByRole("tab", { name: "주별" }));
  expect(count()).toHaveTextContent("2건");
  fireEvent.click(screen.getByRole("tab", { name: "일별" }));
  expect(count()).toHaveTextContent("1건");
  fireEvent.change(screen.getByRole("combobox", { name: "공유 구분 필터" }), { target: { value: "private" } });
  expect(count()).toHaveTextContent("0건");
  fireEvent.click(screen.getByRole("tab", { name: "주별" }));
  expect(count()).toHaveTextContent("1건");
  expect(screen.queryByRole("combobox", { name: "업무 상태 필터" })).not.toBeInTheDocument();
  await act(async () => {});
});

test("검색한 반복 일정도 선택 날짜에서 상태 변경·수정·삭제하면 해당 발생일에 적용된다", async () => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-10-22T12:00:00"));
  saveSchedules([makeSchedule({ date: "2026-10-01", repeatType: "weekly" })]);
  render(<ScheduleManager />);
  fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: "검증용" } });
  const calendar = screen.getByRole("region", { name: "일정 달력" });
  fireEvent.click(within(calendar).getByText("1", { exact: true }).closest(".sm-day"));
  const results = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  expect(screen.getByText("검색 결과 5건")).toBeInTheDocument();
  fireEvent.change(within(results).getAllByRole("combobox")[0], { target: { value: "completed" } });
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual(expect.arrayContaining([
    expect.objectContaining({ date: "2026-10-01", repeatType: "none", status: "completed" }),
    expect.objectContaining({ id: "test-schedule", excludedDates: ["2026-10-01"] }),
  ]));
  fireEvent.click(within(calendar).getByText("8", { exact: true }).closest(".sm-day"));
  jest.spyOn(window, "confirm").mockReturnValue(true);
  fireEvent.click(within(results).getByRole("button", { name: "검증용 마감 일정 삭제" }));
  expect(screen.getByText("검색 결과 4건")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(storageKey)).find((entry) => entry.id === "test-schedule").excludedDates).toContain("2026-10-08");
  fireEvent.click(within(calendar).getByText("15", { exact: true }).closest(".sm-day"));
  fireEvent.click(within(results).getByRole("button", { name: "검증용 마감 일정 수정" }));
  expect(screen.getByLabelText("날짜")).toHaveValue("2026-10-15");
  expect(screen.getByText("선택한 날짜의 일정만 수정합니다. 다른 반복 일정은 유지됩니다.")).toBeInTheDocument();
  await act(async () => {});
});

// 월을 넘는 한 주도 달력에서 양쪽 달을 함께 검색해야 합니다.
test.each(["주별", "담당자별 주간"])("%s는 월 경계 양쪽 일정을 달력에 함께 표시한다", async (view) => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-10-01T12:00:00"));
  saveSchedules([
    makeSchedule({ id: "previous-month", date: "2026-09-30", title: "경계 작업 전월" }),
    makeSchedule({ id: "current-month", date: "2026-10-02", title: "경계 작업 당월" }),
  ]);
  render(<ScheduleManager />);
  fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: "경계 작업" } });
  fireEvent.click(screen.getByRole("tab", { name: view }));
  if (view === "담당자별 주간") {
    fireEvent.click(screen.getByRole("button", { name: "담당자 일정 펼치기" }));
  }
  const results = screen.getByRole("region", { name: "일정 달력" });
  expect(within(results).getByText("검색 결과 2건")).toBeInTheDocument();
  for (const [date, title] of [["2026-09-30", "경계 작업 전월"], ["2026-10-02", "경계 작업 당월"]]) {
    expect(screen.getByRole("button", { name: `${date} 09:00~17:00 ${title} 선택한 날짜 일정에서 보기` })).toBeInTheDocument();
    expect(within(results).getByText(title)).toBeInTheDocument();
  }
  await act(async () => {});
});

// test.each는 같은 검사에 입력값만 바꿔 월말·연말 사례를 각각 실행합니다.
test.each([
  ["2026-10-31", "2026-11-01", "2026년 10월", "2026년 11월"],
  ["2026-12-31", "2027-01-01", "2026년 12월", "2027년 1월"],
])("%s 자정에는 오늘을 보고 있을 때만 선택 날짜와 표시 월을 함께 이동한다", async (today, tomorrow, oldLabel, nextLabel) => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date(`${today}T23:59:59`));
  render(<ScheduleManager />);
  expect(screen.getByRole("heading", { name: oldLabel })).toBeInTheDocument();
  // act는 시계 이동으로 발생한 React 상태 변경까지 반영한 후 다음 검사를 진행하게 합니다.
  await act(async () => { jest.advanceTimersByTime(1500); });
  expect(screen.getByRole("heading", { name: nextLabel })).toBeInTheDocument();
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  expect(within(selected).getByText(new RegExp(tomorrow.replaceAll("-", "\\.")))).toBeInTheDocument();
});

test.each([
  ["2026-10-31", "2026년 10월"],
  ["2026-12-31", "2026년 12월"],
])("%s 자정에 다른 날짜를 보고 있으면 선택 날짜와 표시 월을 유지한다", async (today, label) => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date(`${today}T23:59:59`));
  const { container } = render(<ScheduleManager />);
  const day = [...container.querySelectorAll(".sm-day-num")].find((element) => element.textContent === "15");
  fireEvent.click(day);
  await act(async () => { jest.advanceTimersByTime(1500); });
  expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  expect(within(selected).getByText(new RegExp(`${today.slice(0, 7).replaceAll("-", "\\.")}\\.15`))).toBeInTheDocument();
  // 화면을 유지해도 '오늘' 표시는 다음 날을 기준으로 갱신됩니다.
  expect(container.querySelector(".sm-day.today")).toBeNull();
});

test("월 이동 후 모든 보기와 신규 등록은 이동한 날짜를 사용한다", async () => {
  const today = new Date(`${getTodayKey()}T00:00:00`);
  const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(today.getDate(), lastDay));
  const nextKey = dateKey(next);
  saveSchedules([makeSchedule({ date: nextKey })]);
  localStorage.setItem("made-mate-schedule-team", JSON.stringify(["담당자", "김담당"]));
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "다음 기간" }));
  for (const view of ["일별", "주별", "담당자별 주간"]) {
    fireEvent.click(screen.getByRole("tab", { name: view }));
    if (view === "담당자별 주간") {
      fireEvent.click(screen.getByRole("button", { name: "담당자 일정 펼치기" }));
    }
    expect(screen.getByRole("button", { name: `${nextKey} 09:00~17:00 검증용 마감 선택한 날짜 일정에서 보기` })).toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  chooseWorkSchedule("프로젝트");
  expect(screen.getByLabelText("날짜")).toHaveValue(nextKey);
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "새 작업" } });
  fireEvent.change(screen.getByLabelText("프로젝트"), { target: { value: "새 프로젝트" } });
  chooseAssignee("김담당");
  fireEvent.click(screen.getByRole("button", { name: "일정 저장" }));
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual(expect.arrayContaining([
    expect.objectContaining({ title: "새 작업", date: nextKey }),
  ]));
  await screen.findByRole("tab", { name: "월별" });
});

test.each(["{broken-json", '{"unexpected":true}'])("읽을 수 없는 원본을 자동 저장으로 덮어쓰지 않는다: %s", async (raw) => {
  localStorage.setItem(storageKey, raw);
  render(<ScheduleManager />);
  expect(screen.getByRole("alert")).toHaveTextContent("자동 저장을 중지");
  expect(localStorage.getItem(storageKey)).toBe(raw);
  fireEvent.click(screen.getByRole("button", { name: "다음 기간" }));
  expect(localStorage.getItem(storageKey)).toBe(raw);
  await screen.findByRole("tab", { name: "월별" });
});

test("일부 잘못된 항목은 원본 백업 후 정상 항목만 불러온다", async () => {
  const raw = JSON.stringify([makeSchedule(), { title: "잘못된 항목" }]);
  localStorage.setItem(storageKey, raw);
  render(<ScheduleManager />);
  const backupKey = Object.keys(localStorage).find((key) => key.startsWith(`${storageKey}-backup-`));
  expect(localStorage.getItem(backupKey)).toBe(raw);
  expect(JSON.parse(localStorage.getItem(storageKey))).toHaveLength(1);
  await screen.findByRole("tab", { name: "월별" });
});

test("완료된 마감은 다가오는 일정에서 제외하고 선택 날짜에서는 유지한다", async () => {
  saveSchedules([makeSchedule({ status: "completed" })]);
  render(<ScheduleManager />);
  const upcoming = screen.getByRole("heading", { name: "다가오는 일정" }).closest("section");
  expect(within(upcoming).getByText("오늘부터 7일 이내에 진행 중이거나 시작할 미완료 일정이 없습니다.")).toBeInTheDocument();
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  expect(within(selected).getByText("검증용 마감")).toBeInTheDocument();
  await screen.findByRole("tab", { name: "월별" });
});

test("다가오는 일정은 시작 전·진행 중인 미완료 작업 5건을 시간순으로 표시한다", () => {
  const now = new Date("2026-10-22T12:00:00").getTime();
  const schedules = [
    makeSchedule({ id: "past", date: "2026-10-22", time: "11:00", endTime: "12:00", title: "지난 작업" }),
    makeSchedule({ id: "started", date: "2026-10-22", time: "12:00", title: "이미 시작" }),
    makeSchedule({ id: "done", date: "2026-10-22", time: "12:10", status: "completed" }),
    makeSchedule({ id: "design", date: "2026-10-22", time: "12:30", type: "디자인" }),
    makeSchedule({ id: "repeat", date: "2026-10-22", time: "09:00", endTime: "11:00", type: "기획", repeatType: "weekly", excludedDates: ["2026-10-29"] }),
    makeSchedule({ id: "far", date: "2026-11-01", time: "09:00", type: "검수" }),
  ];
  expect(getUpcomingSchedules(schedules, now).map((item) => `${item.id}/${item.date}`)).toEqual([
    "started/2026-10-22", "design/2026-10-22", "far/2026-11-01", "repeat/2026-11-05", "repeat/2026-11-12",
  ]);
});

test("다가오는 일정은 시작 시 예정에서 진행 중으로 바뀌고 종료 시 자동으로 제거한다", async () => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-10-22T12:59:30"));
  saveSchedules([
    makeSchedule({ id: "first", date: "2026-10-22", time: "13:00", endTime: "13:01", title: "곧 시작하는 디자인", type: "디자인" }),
    makeSchedule({ id: "next", date: "2026-10-22", time: "14:00", endTime: "14:01", title: "오후 회의", type: "기타" }),
  ]);
  render(<ScheduleManager />);
  const upcoming = screen.getByRole("heading", { name: "다가오는 일정" }).closest("section");
  expect(within(upcoming).getByText("곧 시작하는 디자인")).toBeInTheDocument();
  expect(within(upcoming).getByText(/10.22 13:00/)).toBeInTheDocument();
  await act(async () => { jest.advanceTimersByTime(30000); });
  expect(within(upcoming).getByRole("button", { name: /곧 시작하는 디자인/ })).toHaveTextContent("진행 중");
  await act(async () => { jest.advanceTimersByTime(60000); });
  expect(within(upcoming).queryByText("곧 시작하는 디자인")).not.toBeInTheDocument();
  expect(within(upcoming).getByText("오후 회의")).toBeInTheDocument();
  jest.setSystemTime(new Date("2026-10-22T14:01:00"));
  fireEvent(document, new Event("visibilitychange"));
  expect(within(upcoming).getByText("오늘부터 7일 이내에 진행 중이거나 시작할 미완료 일정이 없습니다.")).toBeInTheDocument();
});

test("프로젝트를 선택한 상태에서도 다른 프로젝트의 다가오는 일정을 메인에서 열 수 있다", async () => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-10-22T12:00:00"));
  saveSchedules([
    makeSchedule({ id: "a", date: "2026-10-22", time: "13:00", project: "가 프로젝트", title: "가 작업" }),
    makeSchedule({ id: "b", date: "2026-10-23", time: "14:00", project: "나 프로젝트", title: "나 작업", type: "기타" }),
  ]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록 프로젝트 목록 보기" }));
  fireEvent.click(screen.getByRole("button", { name: "가 프로젝트 프로젝트 일정 보기" }));
  const upcoming = screen.getByRole("heading", { name: "다가오는 일정" }).closest("section");
  fireEvent.click(within(upcoming).getByRole("button", { name: /나 작업/ }));
  const calendar = screen.getByRole("region", { name: "일정 달력" });
  expect(within(calendar).getByRole("button", { name: "2026-10-23 14:00~17:00 나 작업 선택한 날짜 일정에서 보기" })).toBeInTheDocument();
  expect(within(calendar).queryByRole("button", { name: "전체 프로젝트 보기" })).not.toBeInTheDocument();
  await act(async () => {});
});

test("등록 폼은 고유명사 맞춤법 검사를 끄고 이름 입력값은 그대로 유지한다", async () => {
  localStorage.setItem("made-mate-schedule-team", JSON.stringify(["이언우"]));
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  chooseWorkSchedule();
  const name = screen.getByRole("combobox", { name: "담당자" });
  expect(name.closest("form")).toHaveAttribute("spellcheck", "false");
  expect(name.closest("form")).toHaveAttribute("autocorrect", "off");
  chooseAssignee("이언우");
  expect(name).toHaveValue("이언우");
  await act(async () => {});
});

test("기존 일정은 17시 종료로 보완하고 수정한 종료 시간을 저장·표시한다", async () => {
  saveSchedules([makeSchedule()]);
  render(<ScheduleManager />);
  expect(JSON.parse(localStorage.getItem(storageKey))[0].endTime).toBe("17:00");
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  expect(within(selected).getByText("09:00~17:00")).toBeInTheDocument();
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 일정 수정" }));
  expect(screen.getByLabelText("시작 시간")).toHaveValue("09:00");
  expect(screen.getByLabelText("종료 시간")).toHaveValue("17:00");
  fireEvent.change(screen.getByLabelText("종료 시간"), { target: { value: "15:30" } });
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(JSON.parse(localStorage.getItem(storageKey))[0].endTime).toBe("15:30");
  expect(within(selected).getByText("09:00~15:30")).toBeInTheDocument();
  await act(async () => {});
});

test("새 일정은 종료 시간이 시작 시간보다 늦어야 저장한다", async () => {
  localStorage.setItem("made-mate-schedule-team", JSON.stringify(["담당자"]));
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  chooseWorkSchedule();
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "시간 범위 작업" } });
  chooseAssignee("담당자");
  const start = screen.getByLabelText("시작 시간");
  const end = screen.getByLabelText("종료 시간");
  fireEvent.change(start, { target: { value: "10:00" } });
  for (const invalid of ["09:00", "10:00"]) {
    fireEvent.change(end, { target: { value: invalid } });
    fireEvent.submit(end.closest("form"));
    expect(screen.getByRole("alert")).toHaveTextContent("종료 시간은 시작 시간보다 늦게");
    expect(JSON.parse(localStorage.getItem(storageKey))).toHaveLength(0);
  }
  fireEvent.change(end, { target: { value: "18:00" } });
  fireEvent.click(screen.getByRole("button", { name: "일정 저장" }));
  const saved = JSON.parse(localStorage.getItem(storageKey))[0];
  expect(saved.time).toBe("10:00");
  expect(saved.endTime).toBe("18:00");
  expect(screen.getByRole("button", { name: /10:00~18:00 시간 범위 작업 선택한 날짜 일정에서 보기/ })).toBeInTheDocument();
  await act(async () => {});
});

test("월을 넘는 주간 제목은 월과 일을 두 자리씩 표시한다", async () => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-10-22T12:00:00"));
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("tab", { name: "주별" }));
  fireEvent.click(screen.getByRole("button", { name: "다음 기간" }));
  expect(screen.getByRole("heading", { name: "10/26 – 11/01" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "담당자별 주간" }));
  expect(screen.getByRole("heading", { name: "10/26 – 11/01" })).toBeInTheDocument();
  await act(async () => {});
});

test("담당자별 주간에서 이름 검색은 해당 사람의 행과 담당·참석 일정을 보여준다", async () => {
  saveSchedules([
    makeSchedule({ id: "shared", title: "복어 회사 작업", person: "복어", attendees: ["가람"], visibility: "shared" }),
    makeSchedule({ id: "private", title: "개인 준비", person: "복어", visibility: "private" }),
    makeSchedule({ id: "attend", title: "공동 회의", person: "가람", attendees: ["복어"], visibility: "shared" }),
    makeSchedule({ id: "other", title: "다른 작업", person: "나래", visibility: "shared" }),
  ]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("tab", { name: "담당자별 주간" }));
  fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: "복어" } });
  const table = screen.getByRole("region", { name: "담당자별 주간 일정표" });
  const headers = within(table).getAllByRole("rowheader");
  expect(headers).toHaveLength(1);
  expect(headers[0]).toHaveTextContent("복어");
  expect(headers[0]).toHaveTextContent("3건");
  const shared = within(table).getByRole("button", { name: /복어 회사 작업 선택한 날짜 일정에서 보기/ });
  const privateSchedule = within(table).getByRole("button", { name: /개인 준비 선택한 날짜 일정에서 보기/ });
  expect(within(shared).getByText("회사 공유")).toBeInTheDocument();
  expect(within(privateSchedule).getByText("개인 표시")).toBeInTheDocument();
  expect(within(table).getByRole("button", { name: /공동 회의 선택한 날짜 일정에서 보기/ })).toHaveTextContent("참석");
  fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: "테스트 프로젝트" } });
  const projectTable = screen.getByRole("region", { name: "담당자별 주간 일정표" });
  expect(within(projectTable).getAllByRole("rowheader")).toHaveLength(3);
  await act(async () => {});
});

test("이름 부분 검색에서는 이름 전체가 일치하는 사람을 먼저 표시한다", async () => {
  saveSchedules([
    makeSchedule({ id: "partial", person: "가복어" }),
    makeSchedule({ id: "exact", person: "복어" }),
    makeSchedule({ id: "other", person: "다른 사람" }),
  ]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("tab", { name: "담당자별 주간" }));
  fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: "복어" } });
  const table = screen.getByRole("region", { name: "담당자별 주간 일정표" });
  const headers = within(table).getAllByRole("rowheader");
  expect(headers).toHaveLength(2);
  expect(headers[0]).toHaveTextContent(/^복어/);
  expect(headers[1]).toHaveTextContent(/^가복어/);
  await act(async () => {});
});

test("즐겨찾기는 검색·월 이동과 무관하게 유지하고 새로고침 후에도 복원한다", async () => {
  saveSchedules([makeSchedule()]);
  const firstScreen = render(<ScheduleManager />);
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 즐겨찾기 추가" }));
  let favorites = screen.getByRole("region", { name: "★ 즐겨찾기" });
  expect(within(favorites).getByText("검증용 마감")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(storageKey))[0].isFavorite).toBe(true);
  fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: "없는 검색" } });
  fireEvent.click(screen.getByRole("button", { name: "다음 기간" }));
  expect(within(favorites).getByText("검증용 마감")).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "검색한 일정" })).not.toBeInTheDocument();
  firstScreen.unmount();
  render(<ScheduleManager />);
  favorites = screen.getByRole("region", { name: "★ 즐겨찾기" });
  expect(within(favorites).getByText("검증용 마감")).toBeInTheDocument();
  fireEvent.click(within(favorites).getByRole("button", { name: "검증용 마감 즐겨찾기 해제" }));
  expect(within(favorites).getByRole("status")).toHaveTextContent("0건");
  expect(JSON.parse(localStorage.getItem(storageKey))[0].isFavorite).toBe(false);
  await act(async () => {});
});

test("전체 목록에서 즐겨찾기에 추가하고 수정·삭제한 내용은 고정 목록에 즉시 반영한다", async () => {
  saveSchedules([makeSchedule({ date: "2025-01-01" })]);
  jest.spyOn(window, "confirm").mockReturnValue(true);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "전체 일정 (1)" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "검증용 마감 즐겨찾기 추가" }));
  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  const favorites = screen.getByRole("region", { name: "★ 즐겨찾기" });
  fireEvent.click(within(favorites).getByRole("button", { name: "검증용 마감 일정 수정" }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "새 제목" } });
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(within(favorites).getByText("새 제목")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(storageKey))[0].isFavorite).toBe(true);
  fireEvent.click(within(favorites).getByRole("button", { name: "새 제목 즐겨찾기 일정으로 이동" }));
  expect(screen.getByRole("tab", { name: "일별" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section")).toHaveTextContent("2025.01.01");
  fireEvent.click(within(favorites).getByRole("button", { name: "새 제목 일정 수정" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "일정 삭제" }));
  expect(within(favorites).getByRole("status")).toHaveTextContent("0건");
  await act(async () => {});
});

test("반복 일정의 즐겨찾기는 원본 한 건만 고정하고 한 번의 상태 변경으로 복제되지 않는다", async () => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-10-22T12:00:00"));
  saveSchedules([makeSchedule({ date: "2026-10-01", repeatType: "weekly" })]);
  render(<ScheduleManager />);
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 즐겨찾기 추가" }));
  const favorites = screen.getByRole("region", { name: "★ 즐겨찾기" });
  expect(within(favorites).getAllByRole("article")).toHaveLength(1);
  fireEvent.change(within(selected).getByRole("combobox"), { target: { value: "completed" } });
  expect(within(favorites).getAllByRole("article")).toHaveLength(1);
  expect(JSON.parse(localStorage.getItem(storageKey)).filter((item) => item.isFavorite)).toHaveLength(1);
  await act(async () => {});
});

test("담당자별 주간은 접힌 건수로 시작하고 한 사람씩 펼치거나 다시 접는다", async () => {
  saveSchedules([
    makeSchedule({ id: "a", person: "김담당", title: "김 작업" }),
    makeSchedule({ id: "b", person: "이담당", title: "이 작업" }),
  ]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("tab", { name: "담당자별 주간" }));
  const table = screen.getByRole("region", { name: "담당자별 주간 일정표" });
  expect(within(table).queryAllByRole("button", { name: /선택한 날짜 일정에서 보기$/ })).toHaveLength(0);
  const first = within(table).getByRole("button", { name: "김담당 일정 펼치기" });
  expect(first).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(first);
  expect(first).toHaveAttribute("aria-expanded", "true");
  expect(within(table).getByRole("button", { name: /김 작업 선택한 날짜 일정에서 보기/ })).toBeInTheDocument();
  fireEvent.click(within(table).getByRole("button", { name: "이담당 일정 펼치기" }));
  expect(within(table).queryByRole("button", { name: /김 작업 선택한 날짜 일정에서 보기/ })).not.toBeInTheDocument();
  expect(within(table).getByRole("button", { name: /이 작업 선택한 날짜 일정에서 보기/ })).toBeInTheDocument();
  fireEvent.click(within(table).getByRole("button", { name: "이담당 일정 접기" }));
  expect(within(table).queryAllByRole("button", { name: /선택한 날짜 일정에서 보기$/ })).toHaveLength(0);
  fireEvent.click(within(table).getByRole("button", { name: `김담당 ${getTodayKey()} 일정 1건 펼치기` }));
  expect(within(table).getByRole("button", { name: /김 작업 선택한 날짜 일정에서 보기/ })).toBeInTheDocument();
  await act(async () => {});
});

test("이름 검색은 자동으로 펼치고 검색 초기화 시 전체를 접은 목록으로 돌아온다", async () => {
  saveSchedules([
    makeSchedule({ id: "a", person: "김담당", title: "김 작업" }),
    makeSchedule({ id: "b", person: "이담당", title: "이 작업" }),
  ]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("tab", { name: "담당자별 주간" }));
  fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: "김담당" } });
  const table = screen.getByRole("region", { name: "담당자별 주간 일정표" });
  expect(within(table).getByRole("button", { name: "김담당 일정 접기" })).toHaveAttribute("aria-expanded", "true");
  expect(within(table).getByRole("button", { name: /김 작업 선택한 날짜 일정에서 보기/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "검색 초기화" }));
  const resetTable = screen.getByRole("region", { name: "담당자별 주간 일정표" });
  expect(within(resetTable).getAllByRole("rowheader")).toHaveLength(2);
  expect(within(resetTable).queryAllByRole("button", { name: /선택한 날짜 일정에서 보기$/ })).toHaveLength(0);
  await act(async () => {});
});

test("기존 일정의 임의 담당자와 참석자 이름을 편집해도 자동 팀원 등록하지 않는다", async () => {
  localStorage.setItem(storageKey, JSON.stringify([makeSchedule({ person: "임의 이름", attendees: ["외부 참석자"] })]));
  render(<ScheduleManager />);
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 일정 수정" }));
  expect(screen.getByRole("combobox", { name: "담당자", exact: true })).toHaveValue("임의 이름");
  expect(screen.getByRole("checkbox", { name: "외부 참석자" })).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(JSON.parse(localStorage.getItem(storageKey))[0].person).toBe("임의 이름");
  expect(JSON.parse(localStorage.getItem(storageKey))[0].attendees).toEqual(["외부 참석자"]);
  expect(JSON.parse(localStorage.getItem("made-mate-schedule-team"))).toEqual([]);
  await act(async () => {});
});

test("회의 분류에서 담당자와 참석자를 일정에 저장한다", async () => {
  localStorage.setItem("made-mate-schedule-team", JSON.stringify(["김담당", "이참석"]));
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  chooseWorkSchedule("회의");
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "팀 회의" } });
  chooseAssignee("김담당");
  fireEvent.click(screen.getByRole("checkbox", { name: "이참석" }));
  fireEvent.click(screen.getByRole("button", { name: "일정 저장" }));
  const saved = JSON.parse(localStorage.getItem(storageKey))[0];
  expect(saved.person).toBe("김담당");
  expect(saved.attendees).toEqual(["이참석"]);
  await act(async () => {});
});

test("담당자별 주간은 등록된 일정 사람을 표시한다", async () => {
  localStorage.setItem("made-mate-schedule-team", JSON.stringify(["김담당"]));
  render(<ScheduleManager />);
  expect(screen.queryByRole("button", { name: "등록된 팀원 목록 보기" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "담당자별 주간" }));
  expect(screen.getByRole("button", { name: "김담당 일정 펼치기" })).toBeInTheDocument();
  await act(async () => {});
});

test("팀원 관리 진입점은 숨겨도 담당자별 주간 일정 보기는 유지한다", async () => {
  saveSchedules([makeSchedule({ person: "김담당" })]);
  render(<ScheduleManager />);
  expect(screen.queryByRole("button", { name: "등록된 팀원 목록 보기" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "담당자별 주간" }));
  expect(screen.getByRole("button", { name: "김담당 일정 펼치기" })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(storageKey))[0].person).toBe("김담당");
  await act(async () => {});
});

test("월간 일정 박스의 별은 상세창이나 선택 날짜를 바꾸지 않고 즐겨찾기를 전환한다", async () => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-10-22T12:00:00"));
  saveSchedules([makeSchedule({ date: "2026-10-23" })]);
  render(<ScheduleManager />);
  const calendar = screen.getByRole("region", { name: "일정 달력" });
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  const star = within(calendar).getByRole("button", { name: "검증용 마감 즐겨찾기 추가" });
  fireEvent.click(star);
  expect(star).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(selected).toHaveTextContent("2026.10.22");
  const favorites = screen.getByRole("region", { name: "★ 즐겨찾기" });
  expect(within(favorites).getByText("검증용 마감")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(storageKey))[0].isFavorite).toBe(true);
  fireEvent.click(star);
  expect(star).toHaveAttribute("aria-pressed", "false");
  expect(within(favorites).getByRole("status")).toHaveTextContent("0건");
  fireEvent.click(within(calendar).getByRole("button", { name: /검증용 마감 선택한 날짜 일정에서 보기/ }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(selected).toHaveTextContent("2026.10.23");
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 일정 수정" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await act(async () => {});
});

test("프로젝트·공개 필터가 적용된 일정도 수정 저장 후 바로 확인할 수 있다", async () => {
  saveSchedules([makeSchedule({ project: "기존 프로젝트", status: "completed", visibility: "shared" })]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록 프로젝트 목록 보기" }));
  fireEvent.click(screen.getByRole("button", { name: "기존 프로젝트 프로젝트 일정 보기" }));
  fireEvent.change(screen.getByRole("combobox", { name: "공유 구분 필터" }), { target: { value: "shared" } });
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 일정 수정" }));
  fireEvent.change(screen.getByLabelText("프로젝트"), { target: { value: "바뀐 프로젝트" } });
  fireEvent.change(screen.getByLabelText("일정 상태"), { target: { value: "pending" } });
  expect(screen.getByLabelText("공유 구분")).not.toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(within(screen.getByRole("region", { name: "일정 달력" })).getByRole("button", { name: /검증용 마감 선택한 날짜 일정에서 보기/ })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "공유 구분 필터" })).toHaveValue("all");
  expect(screen.queryByRole("combobox", { name: "업무 상태 필터" })).not.toBeInTheDocument();
  expect(within(selected).getByText("검증용 마감")).toBeInTheDocument();
  await act(async () => {});
});

test("공백 이름은 막고 프로젝트는 비워 저장할 수 있다", async () => {
  saveSchedules([makeSchedule()]);
  render(<ScheduleManager />);
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 일정 수정" }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "   " } });
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(screen.getByRole("alert")).toHaveTextContent("일정 이름");
  fireEvent.click(within(screen.getByRole("group", { name: "일정 분류" })).getByRole("button", { name: "업무", exact: true }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "  새 이름  " } });
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(JSON.parse(localStorage.getItem(storageKey))[0]).toMatchObject({ title: "새 이름", project: "", category: "업무" });
  fireEvent.click(within(selected).getByRole("button", { name: "새 이름 일정 수정" }));
  fireEvent.click(within(screen.getByRole("group", { name: "일정 분류" })).getByRole("button", { name: "프로젝트", exact: true }));
  fireEvent.change(screen.getByLabelText("프로젝트"), { target: { value: "  새 프로젝트  " } });
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(JSON.parse(localStorage.getItem(storageKey))[0]).toMatchObject({ title: "새 이름", project: "새 프로젝트", category: "프로젝트" });
  await act(async () => {});
});

test.each(["프로젝트", "즐겨찾기"])("%s 이동은 이미 끝난 오늘 일정 대신 다음 유효 일정 날짜를 연다", async (source) => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date("2026-10-22T18:00:00"));
  saveSchedules([makeSchedule({ date: "2026-10-22", time: "09:00", endTime: "17:00", repeatType: "weekly", isFavorite: true })]);
  render(<ScheduleManager />);
  if (source === "프로젝트") {
    fireEvent.click(screen.getByRole("button", { name: "일정 등록 프로젝트 목록 보기" }));
    fireEvent.click(screen.getByRole("button", { name: "테스트 프로젝트 프로젝트 일정 보기" }));
  } else {
    fireEvent.click(screen.getByRole("button", { name: "검증용 마감 즐겨찾기 일정으로 이동" }));
  }
  expect(screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section")).toHaveTextContent("2026.10.29");
  await act(async () => {});
});

test("잘못된 날짜·시간은 백업 후 제외하고 손상된 반복 제외일·종료 시간은 안전하게 보완한다", async () => {
  const raw = JSON.stringify([
    makeSchedule({ id: "bad-date", date: "2026-02-31" }),
    makeSchedule({ id: "bad-time", time: "25:90" }),
    makeSchedule({ id: "safe-repeat", repeatType: "weekly", excludedDates: {}, endTime: "wrong" }),
  ]);
  localStorage.setItem(storageKey, raw);
  render(<ScheduleManager />);
  const saved = JSON.parse(localStorage.getItem(storageKey));
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ id: "safe-repeat", endTime: "17:00", excludedDates: [] });
  const backup = Object.keys(localStorage).find((key) => key.startsWith(storageKey + "-backup-"));
  expect(localStorage.getItem(backup)).toBe(raw);
  expect(screen.getByRole("region", { name: "일정 달력" })).toBeInTheDocument();
  await act(async () => {});
});

test("프로젝트의 마지막 일정을 삭제하면 없어진 프로젝트 선택을 자동 해제한다", async () => {
  saveSchedules([makeSchedule()]);
  jest.spyOn(window, "confirm").mockReturnValue(true);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록 프로젝트 목록 보기" }));
  fireEvent.click(screen.getByRole("button", { name: "테스트 프로젝트 프로젝트 일정 보기" }));
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 일정 삭제" }));
  expect(screen.queryByRole("button", { name: "전체 프로젝트 보기" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "프로젝트 선택 해제" })).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual([]);
  await act(async () => {});
});

// 기능을 줄인 뒤에도 과거 상태를 읽고 상세 창에서 삭제를 취소·확정할 수 있어야 합니다.
test("단순화한 화면은 기존 상태를 예정으로 읽고 관리 기능을 상세 창에서 제공한다", async () => {
  saveSchedules([makeSchedule({ status: "in_progress", isFavorite: true })]);
  const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
  const { container } = render(<ScheduleManager />);
  expect(screen.queryByRole("tab", { name: "시간대별" })).not.toBeInTheDocument();
  expect(screen.getAllByRole("tab")).toHaveLength(4);
  expect(screen.queryByRole("button", { name: "이번 주 마감 주별 보기" })).not.toBeInTheDocument();
  expect(container.querySelectorAll(".sm-stat")).toHaveLength(1);
  expect(JSON.parse(localStorage.getItem(storageKey))[0].status).toBe("pending");
  const favorites = screen.getByRole("region", { name: "★ 즐겨찾기" });
  expect(within(favorites).queryByRole("combobox")).not.toBeInTheDocument();
  fireEvent.click(within(favorites).getByRole("button", { name: "검증용 마감 일정 수정" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).queryByLabelText("새 팀원 이름")).not.toBeInTheDocument();
  expect(within(dialog).getByLabelText("프로젝트")).toBeRequired();
  expect(within(within(dialog).getByLabelText("일정 상태")).getAllByRole("option").map(option => option.textContent)).toEqual(["예정", "완료"]);
  fireEvent.click(within(dialog).getByRole("button", { name: "일정 삭제" }));
  expect(dialog).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(storageKey))).toHaveLength(1);
  confirm.mockReturnValue(true);
  fireEvent.click(within(dialog).getByRole("button", { name: "일정 삭제" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(storageKey))).toHaveLength(0);
  await act(async () => {});
});

test("담당자 새 이름은 입력만으로 등록되지 않고 일정 저장 시 함께 등록된다", async () => {
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  chooseWorkSchedule();
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "새 담당자 작업" } });
  const assignee = screen.getByRole("combobox", { name: "담당자", exact: true });
  fireEvent.change(assignee, { target: { value: "  김신규  " } });
  expect(JSON.parse(localStorage.getItem("made-mate-schedule-team"))).toEqual([]);
  expect(screen.queryByRole("button", { name: "팀원 추가" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "일정 저장" }));
  expect(JSON.parse(localStorage.getItem("made-mate-schedule-team"))).toEqual(["김신규"]);
  expect(JSON.parse(localStorage.getItem(storageKey))[0].person).toBe("김신규");
  await act(async () => {});
});

test.each(["shared", "private"])("수정 창의 추가 설정은 접힌 채 기존 값 %s를 보존하고 펼쳐서 수정할 수 있다", async (visibility) => {
  saveSchedules([makeSchedule({ type: "검수", visibility })]);
  render(<ScheduleManager />);
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 일정 수정" }));
  const dialog = screen.getByRole("dialog");
  for (const label of ["공유 구분", "반복 설정"]) {
    expect(within(dialog).getByLabelText(label)).not.toBeVisible();
  }
  fireEvent.click(within(dialog).getByText("추가 설정 · 공유 구분·반복·알림"));
  fireEvent.change(within(dialog).getByLabelText("일정 이름"), { target: { value: "간단히 수정" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "수정 저장" }));
  expect(JSON.parse(localStorage.getItem(storageKey))[0]).toMatchObject({ title: "간단히 수정", type: "검수", visibility, repeatType: "none" });
  await act(async () => {});
});

test.each(["2026-10-15T12:00:00", "2026-11-15T12:00:00", "2026-08-15T12:00:00"])("월간 달력은 일요일 시작이며 월 첫날의 위치와 주말 색상이 맞는다: %s", async (now) => {
  jest.useFakeTimers("modern");
  jest.setSystemTime(new Date(now));
  const { container } = render(<ScheduleManager />);
  const headings = [...container.querySelectorAll(".sm-weekday")];
  expect(headings.map(day => day.textContent)).toEqual(["일", "월", "화", "수", "목", "금", "토"]);
  expect(headings[0]).toHaveClass("sunday");
  expect(headings[6]).toHaveClass("saturday");
  const cells = [...container.querySelectorAll(".sm-month-view .sm-day")];
  const offset = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getDay();
  expect(cells.findIndex(cell => cell.querySelector(".sm-day-num"))).toBe(offset);
  expect(cells[offset].querySelector(".sm-day-num")).toHaveTextContent("1");
  await act(async () => {});
});

test("다가오는 일정 7일 제한은 오늘을 포함한 7일만 보이고 이동용 조회는 먼 미래도 유지한다", () => {
  const now = new Date("2026-10-22T12:00:00").getTime();
  const items = [makeSchedule({ id: "near", date: "2026-10-28" }), makeSchedule({ id: "far", date: "2026-10-29" })];
  expect(getUpcomingSchedules(items, now, 5, 7).map(item => item.id)).toEqual(["near"]);
  expect(getUpcomingSchedules(items, now).map(item => item.id)).toEqual(["near", "far"]);
});

test("기존 사용자 지정 반복은 보존하며 간단한 반복 선택으로 바꿀 수 있다", async () => {
  saveSchedules([makeSchedule({ repeatType: "monthly", repeatInterval: 12 })]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "전체 일정 (1)" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "검증용 마감 일정 수정" }));
  fireEvent.click(screen.getByText("추가 설정 · 공유 구분·반복·알림"));
  const repeat = screen.getByLabelText("반복 설정");
  expect(repeat).toHaveValue("monthly:12");
  expect(within(repeat).getAllByRole("option")).toHaveLength(5);
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(JSON.parse(localStorage.getItem(storageKey))[0].repeatInterval).toBe(12);
  fireEvent.click(screen.getByRole("button", { name: "전체 일정 (1)" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "검증용 마감 일정 수정" }));
  fireEvent.click(screen.getByText("추가 설정 · 공유 구분·반복·알림"));
  fireEvent.change(screen.getByLabelText("반복 설정"), { target: { value: "weekly:2" } });
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(JSON.parse(localStorage.getItem(storageKey))[0]).toMatchObject({ repeatType: "weekly", repeatInterval: 2 });
  await act(async () => {});
});

test("팀원 관리 진입 버튼은 일정 화면에 표시하지 않는다", async () => {
  localStorage.setItem("made-mate-schedule-team", JSON.stringify(["제외할 사람"]));
  render(<ScheduleManager />);
  expect(screen.queryByRole("button", { name: "등록된 팀원 목록 보기" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "팀원 목록" })).not.toBeInTheDocument();
  await act(async () => {});
});

test("다른 탭에서 추가한 일정을 기존 탭의 저장이 덮어쓰지 않는다", async () => {
  saveSchedules([makeSchedule()]);
  render(<ScheduleManager />);
  const remote = makeSchedule({ id: "remote", title: "다른 탭 추가" });
  const saved = JSON.parse(localStorage.getItem(storageKey));
  localStorage.setItem(storageKey, JSON.stringify([...saved, remote]));
  fireEvent.click(screen.getAllByRole("button", { name: "검증용 마감 즐겨찾기 추가" })[0]);
  expect(JSON.parse(localStorage.getItem(storageKey)).map(item => item.id)).toContain("remote");
  expect(JSON.parse(localStorage.getItem(storageKey)).find(item => item.id === "test-schedule").isFavorite).toBe(true);
  await act(async () => {});
});

test("다른 탭에서 편집 중인 일정을 변경하면 덮어쓰기를 중지한다", async () => {
  saveSchedules([makeSchedule()]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "검증용 마감 일정 수정" }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "내 변경" } });
  const remote = JSON.parse(localStorage.getItem(storageKey));
  remote[0].title = "다른 탭 변경";
  localStorage.setItem(storageKey, JSON.stringify(remote));
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(JSON.parse(localStorage.getItem(storageKey))[0].title).toBe("다른 탭 변경");
  expect(screen.getByLabelText("일정 이름")).toHaveValue("내 변경");
  expect(screen.getByText(/편집 중인 일정이 다른 탭에서/)).toBeInTheDocument();
  await act(async () => {});
});

test("같은 일정의 동시 변경과 삭제 충돌을 감지하고 다른 일정 변경은 병합한다", () => {
  const a = makeSchedule({ id: "a" });
  const b = makeSchedule({ id: "b" });
  expect(mergeScheduleChanges([a], [{ ...a, title: "내 수정" }], [{ ...a, title: "상대 수정" }]).conflict).toBe(true);
  expect(mergeScheduleChanges([a], [{ ...a, title: "내 수정" }], []).conflict).toBe(true);
  const merged = mergeScheduleChanges([a, b], [a], [a, { ...b, title: "상대 수정" }]);
  expect(merged.conflict).toBe(true);
  expect(mergeScheduleChanges([a, b], [{ ...a, title: "내 수정" }, b], [a]).items)
    .toEqual([{ ...a, title: "내 수정" }]);
});

test("다른 탭 저장 이벤트를 받으면 화면에 최신 일정을 반영한다", async () => {
  saveSchedules([makeSchedule()]);
  render(<ScheduleManager />);
  const remote = JSON.parse(localStorage.getItem(storageKey));
  remote[0].title = "외부에서 갱신한 일정";
  localStorage.setItem(storageKey, JSON.stringify(remote));
  fireEvent(window, new StorageEvent("storage", { key: storageKey }));
  expect(screen.getByRole("button", { name: "외부에서 갱신한 일정 일정 수정" })).toBeInTheDocument();
  await act(async () => {});
});

test("업무에서 개인으로 전환하면 숨겨진 담당자와 상태를 초기화한다", async () => {
  saveSchedules([makeSchedule({ person: "담당자", status: "completed" })]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "전체 일정 (1)" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "검증용 마감 일정 수정" }));
  fireEvent.click(screen.getByRole("button", { name: "개인 일정용", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "업무용", exact: true }));
  expect(screen.getByRole("combobox", { name: "담당자", exact: true })).toHaveValue("");
  expect(screen.getByLabelText("일정 상태")).toHaveValue("pending");
  await act(async () => {});
});

test("다음 근무일 탐색 범위를 넘는 연속 휴일은 휴일에 일정을 표시하지 않는다", () => {
  const holidays = {};
  for (let day = 1; day <= 20; day += 1) holidays[`2026-11-${String(day).padStart(2, "0")}`] = "휴일";
  const items = [makeSchedule({ date: "2026-11-01", repeatType: "monthly", holidayRule: "nextWorkday" })];
  expect(expandSchedules(items, "2026-11-01", "2026-11-30", holidays)).toEqual([]);
});
