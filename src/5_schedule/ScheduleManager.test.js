/* [파일 안내] 일정관리 자동 회귀 검사
 * 실행: npm test -- --watchAll=false --runInBand src/5_schedule/ScheduleManager.test.js
 * 테스트용 DOM·저장소에서 동작하며 실제 크롬 데이터는 사용하지 않습니다.
 * 날짜·반복 계산과 화면 입력·저장 결과를 검사합니다. CSS의 실제 배치는 브라우저 검사가 필요합니다.
 */

/* [자동 검사를 읽는 실제 방법]
 * 각 test는 서로 영향을 주지 않는 사용 상황 하나를 만듭니다. beforeEach가 저장소와 서버 응답을 준비합니다.
 * saveSchedules는 검사에 쓸 일정과 팀원 자료를 준비하는 도우미이며 실제 앱의 저장 동작과는 별개입니다.
 * render는 화면을 만들고 fireEvent는 클릭·입력·제출을 흉내 냅니다. expect는 결과를 확인합니다.
 * getByRole은 버튼·입력창 같은 역할과 이름으로 찾으며 없거나 여러 개이면 검사에 실패합니다.
 * queryByRole은 없어도 오류 대신 null을 주므로 제거한 기능이 정말 없는지 확인할 때 사용합니다.
 * within(dialog)처럼 범위를 좁히면 같은 이름의 버튼이 달력과 목록에 있어도 원하는 곳만 찾습니다.
 * 검사는 실제 화면과 저장 결과를 확인합니다. 단순히 함수 이름이 존재하는지만 검사하는 것은 아닙니다.
 */
import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import ScheduleManager from "./ScheduleManager";
import { loadSchedules, mergeScheduleChanges } from "./scheduleStorage";
import {
  dateKey, getTodayKey, getNextScheduleDate, getUpcomingSchedules,
  normalizeAttendees, createScheduleForm, excludeOccurrence, expandSchedules,
  getSchedulePeople, getRepeatLabel,
} from "./scheduleData";

/* 테스트 파일은 실제 사용자 화면을 만드는 파일이 아니라 기능이 맞는지 자동으로 확인하는 파일입니다.
 * npm test로 실행하며, test('설명', 함수)의 함수 안에 한 가지 사용 흐름과 기대 결과를 적습니다.
 *
 * render(<ScheduleManager />): 브라우저와 비슷한 테스트 환경에 일정 화면을 만듭니다.
 * screen.getByRole('button', { name: '...' }): 사용자에게 그 이름으로 보이는 버튼을 찾습니다.
 * fireEvent.click(버튼): 버튼을 클릭하는 이벤트를 발생시킵니다.
 * expect(결과).toBe(...): 계산 결과가 기대값과 같은지 검사하며 다르면 테스트가 실패합니다.
 * queryBy...는 없어도 null을 반환하므로 '보이지 않아야 한다'를 확인할 때 사용합니다.
 * within(영역)은 조회 범위를 그 요소 내부로 제한합니다. 같은 이름이 여러 패널에 있을 때 필요합니다.
 *
 * jest.useFakeTimers/setSystemTime은 테스트에서만 시간을 고정하거나 이동하는 기능입니다.
 * 실제로 자정까지 기다리지 않고도 월말·연말 화면 전환을 검사합니다.
 * async/await는 비동기 작업의 완료를 기다리는 문법이며 act는 그 작업으로 생긴 리액트 갱신을
 * 테스트가 확인하기 전에 반영되도록 돕습니다. 이 가짜 시간과 서버 응답은 실제 앱 설정을 바꾸지 않습니다.
 */
/* 화면 테스트를 읽는 순서: 저장할 데이터 준비 → render로 화면 생성 → fireEvent로 사용자 동작 → expect로 결과 확인.
 * 내부 함수의 모양보다 검색·등록·반복 수정 후 화면과 저장 데이터가 맞는지를 검사합니다.
 */
const storageKey = "made-mate-schedules";
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
// 기존 시나리오의 테스트 준비입니다. 실제 앱은 일정에서 팀원을 자동 등록하지 않습니다.
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
  fireEvent.change(screen.getByRole("combobox", { name: "일정 구분" }), { target: { value: "private" } });
  fireEvent.click(screen.getByRole("button", { name }));
  expect(screen.getByRole("tab", { name: view })).toHaveAttribute("aria-selected", "true");
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  expect(selected).toHaveTextContent(getTodayKey().replaceAll("-", "."));
  expect(screen.getByRole("textbox", { name: "일정 검색" })).toHaveValue("");
  expect(screen.getByRole("combobox", { name: "일정 구분" })).toHaveValue("all");
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
  expect(screen.getByText("일정에 등록된 프로젝트가 없습니다.")).toBeInTheDocument();
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
  fireEvent.change(screen.getByRole("combobox", { name: "일정 구분" }), { target: { value: "private" } });
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
  expect(within(upcoming).getByText("다가오는 일정이 없습니다.")).toBeInTheDocument();
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
  expect(within(upcoming).getByText("다가오는 일정이 없습니다.")).toBeInTheDocument();
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
  expect(within(privateSchedule).getByText("개인 일정")).toBeInTheDocument();
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
  fireEvent.change(screen.getByRole("combobox", { name: "일정 구분" }), { target: { value: "shared" } });
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 일정 수정" }));
  fireEvent.change(screen.getByLabelText("프로젝트"), { target: { value: "바뀐 프로젝트" } });
  fireEvent.change(screen.getByLabelText("일정 상태"), { target: { value: "pending" } });
  expect(screen.getByLabelText("일정 공개 범위")).not.toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(within(screen.getByRole("region", { name: "일정 달력" })).getByRole("button", { name: /검증용 마감 선택한 날짜 일정에서 보기/ })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "일정 구분" })).toHaveValue("all");
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
  for (const label of ["일정 공개 범위", "반복 설정"]) {
    expect(within(dialog).getByLabelText(label)).not.toBeVisible();
  }
  fireEvent.click(within(dialog).getByText("추가 설정 · 공개 범위·반복·알림"));
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
  fireEvent.click(screen.getByText("추가 설정 · 공개 범위·반복·알림"));
  const repeat = screen.getByLabelText("반복 설정");
  expect(repeat).toHaveValue("monthly:12");
  expect(within(repeat).getAllByRole("option")).toHaveLength(5);
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(JSON.parse(localStorage.getItem(storageKey))[0].repeatInterval).toBe(12);
  fireEvent.click(screen.getByRole("button", { name: "전체 일정 (1)" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "검증용 마감 일정 수정" }));
  fireEvent.click(screen.getByText("추가 설정 · 공개 범위·반복·알림"));
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
