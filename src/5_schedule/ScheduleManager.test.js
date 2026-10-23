import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import ScheduleManager from "./ScheduleManager";
import {
  dateKey, getTodayKey, getNextScheduleDate, getUpcomingSchedules,
  normalizeAttendees, createScheduleForm, excludeOccurrence, expandSchedules,
  getSchedulePeople,
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
  const select = screen.getByRole("combobox", { name: "담당자", exact: true });
  if (!within(select).queryByRole("option", { name, exact: true })) {
    fireEvent.change(screen.getByLabelText("새 팀원 이름"), { target: { value: name } });
    fireEvent.click(screen.getByRole("button", { name: "팀원 등록" }));
  }
  fireEvent.change(select, { target: { value: name } });
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

test("월말 반복은 짧은 달의 말일에 표시하고 다음 달에는 원래 일자로 돌아온다", () => {
  const monthly = makeSchedule({ date: "2026-01-31", repeatType: "monthly", excludedDates: ["2026-03-31"] });
  const ordinary = makeSchedule({ id: "ordinary", date: "2026-02-15" });
  const result = expandSchedules([monthly, ordinary], "2026-02-01", "2026-05-31");
  expect(result.map((item) => item.date)).toEqual(["2026-02-15", "2026-02-28", "2026-04-30", "2026-05-31"]);
  expect(monthly.date).toBe("2026-01-31");
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
test.each(["프로젝트", "팀원"])("%s 목록에서 프로젝트를 누르면 가까운 날짜의 해당 일정과 상세 정보를 확인한다", async (source) => {
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
  expect(within(calendar).getByRole("button", { name: /선택 작업 상세 내용 확인 및 수정/ })).toBeInTheDocument();
  expect(within(calendar).queryByRole("button", { name: /다른 프로젝트 작업 상세 내용 확인 및 수정/ })).not.toBeInTheDocument();
  // 주별·월별로 바꿔도 같은 프로젝트 조건을 유지합니다.
  for (const view of ["주별", "월별", "일별"]) {
    fireEvent.click(within(calendar).getByRole("tab", { name: view }));
    expect(within(calendar).getByRole("button", { name: /선택 작업 상세 내용 확인 및 수정/ })).toBeInTheDocument();
    expect(within(calendar).queryByRole("button", { name: /다른 프로젝트 작업 상세 내용 확인 및 수정/ })).not.toBeInTheDocument();
  }
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  expect(selected).toHaveTextContent("2026.10.25");
  expect(within(selected).getByText("test")).toBeInTheDocument();
  expect(within(selected).getByText("선택 작업")).toBeInTheDocument();
  expect(within(selected).getByText("준비물과 전달 사항")).toBeInTheDocument();
  // test와 test2를 함께 준비해 부분 검색이 아니라 정확한 프로젝트 선택인지 확인합니다.
  expect(within(selected).queryByText("다른 프로젝트 작업")).not.toBeInTheDocument();
  fireEvent.click(within(selected).getByRole("button", { name: "선택 작업" }));
  // 같은 제목이 달력에도 있으므로 상세 입력 검사는 dialog 안으로 조회 범위를 제한합니다.
  expect(within(screen.getByRole("dialog")).getByRole("textbox", { name: /상세 내용/ })).toHaveValue("준비물과 전달 사항");
  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  fireEvent.click(within(calendar).getByRole("button", { name: "전체 프로젝트 보기" }));
  expect(within(selected).getByText("다른 프로젝트 작업")).toBeInTheDocument();
  expect(within(calendar).getByRole("button", { name: /다른 프로젝트 작업 상세 내용 확인 및 수정/ })).toBeInTheDocument();
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
  ["이번 주 마감 주별 보기", "주별"],
])("%s는 오늘로 이동하고 검색과 필터를 해제한다", async (name, view) => {
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "다음 기간" }));
  fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: "검색" } });
  fireEvent.change(screen.getByRole("combobox", { name: "일정 구분" }), { target: { value: "private" } });
  fireEvent.change(screen.getByRole("combobox", { name: "업무 상태 필터" }), { target: { value: "completed" } });
  fireEvent.click(screen.getByRole("button", { name }));
  expect(screen.getByRole("tab", { name: view })).toHaveAttribute("aria-selected", "true");
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  expect(selected).toHaveTextContent(getTodayKey().replaceAll("-", "."));
  expect(screen.getByRole("textbox", { name: "일정 검색" })).toHaveValue("");
  expect(screen.getByRole("combobox", { name: "일정 구분" })).toHaveValue("all");
  expect(screen.getByRole("combobox", { name: "업무 상태 필터" })).toHaveValue("all");
  await act(async () => {});
});

test("팀원을 누르면 중복 없는 담당 프로젝트를 표시하고 참석 프로젝트는 구분한다", async () => {
  saveSchedules([
    makeSchedule({ id: "a", person: "김담당", project: "가 프로젝트", attendees: ["이참석"] }),
    makeSchedule({ id: "b", person: "김담당", project: "가 프로젝트" }),
    makeSchedule({ id: "c", person: "박담당", project: "나 프로젝트", attendees: ["김담당"] }),
  ]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "등록된 팀원 목록 보기" }));
  const directory = screen.getByRole("region", { name: "팀원 목록" });
  expect(within(directory).getByText(/팀원 3명/)).toBeInTheDocument();
  const person = within(directory).getByRole("button", { name: "김담당" });
  fireEvent.click(person);
  expect(within(directory).getByText("담당 프로젝트 1개")).toBeInTheDocument();
  expect(within(directory).getByText("가 프로젝트")).toBeInTheDocument();
  expect(within(directory).queryByText("나 프로젝트")).not.toBeInTheDocument();
  fireEvent.click(within(directory).getByRole("button", { name: "이참석" }));
  expect(person).toHaveAttribute("aria-expanded", "false");
  expect(within(directory).getByText("담당자로 배정된 프로젝트가 없습니다.")).toBeInTheDocument();
  await act(async () => {});
});

test("일정이 없으면 프로젝트와 팀원 목록에 빈 상태를 표시한다", async () => {
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록 프로젝트 목록 보기" }));
  expect(screen.getByText("일정에 등록된 프로젝트가 없습니다.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "등록된 팀원 목록 보기" }));
  expect(screen.queryByRole("region", { name: "프로젝트 목록" })).not.toBeInTheDocument();
  expect(screen.getByText("등록된 팀원이 없습니다.")).toBeInTheDocument();
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
    expect(within(results).getAllByRole("button", { name: /상세 내용 확인 및 수정$/ }).map((element) => element.querySelector("strong").textContent)).toEqual(["첫 번째 작업", "두 번째 작업"]);
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

test("달력 검색은 보기 기간과 공개·상태 필터를 따르고 결과 건수를 표시한다", async () => {
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
  fireEvent.change(screen.getByRole("combobox", { name: "업무 상태 필터" }), { target: { value: "pending" } });
  expect(count()).toHaveTextContent("0건");
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
    expect(screen.getByRole("button", { name: `${date} 09:00~17:00 ${title} 상세 내용 확인 및 수정` })).toBeInTheDocument();
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
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "다음 기간" }));
  for (const view of ["일별", "시간대별", "주별", "담당자별 주간"]) {
    fireEvent.click(screen.getByRole("tab", { name: view }));
    if (view === "담당자별 주간") {
      fireEvent.click(screen.getByRole("button", { name: "담당자 일정 펼치기" }));
    }
    expect(screen.getByRole("button", { name: `${nextKey} 09:00~17:00 검증용 마감 상세 내용 확인 및 수정` })).toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
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
  expect(within(calendar).getByRole("button", { name: "2026-10-23 14:00~17:00 나 작업 상세 내용 확인 및 수정" })).toBeInTheDocument();
  expect(within(calendar).queryByRole("button", { name: "전체 프로젝트 보기" })).not.toBeInTheDocument();
  await act(async () => {});
});

test("등록 폼은 고유명사 맞춤법 검사를 끄고 이름 입력값은 그대로 유지한다", async () => {
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
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
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "시간 범위 작업" } });
  fireEvent.change(screen.getByLabelText("프로젝트"), { target: { value: "프로젝트" } });
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
  expect(screen.getByRole("button", { name: /10:00~18:00 시간 범위 작업 상세 내용 확인 및 수정/ })).toBeInTheDocument();
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
  const shared = within(table).getByRole("button", { name: /복어 회사 작업 상세/ });
  const privateSchedule = within(table).getByRole("button", { name: /개인 준비 상세/ });
  expect(within(shared).getByText("회사 공유")).toBeInTheDocument();
  expect(within(privateSchedule).getByText("개인 일정")).toBeInTheDocument();
  expect(within(table).getByRole("button", { name: /공동 회의 상세/ })).toHaveTextContent("참석");
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
  fireEvent.click(within(favorites).getByRole("button", { name: "새 제목 일정 삭제" }));
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
  expect(within(table).queryAllByRole("button", { name: /상세 내용 확인 및 수정$/ })).toHaveLength(0);
  const first = within(table).getByRole("button", { name: "김담당 일정 펼치기" });
  expect(first).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(first);
  expect(first).toHaveAttribute("aria-expanded", "true");
  expect(within(table).getByRole("button", { name: /김 작업 상세/ })).toBeInTheDocument();
  fireEvent.click(within(table).getByRole("button", { name: "이담당 일정 펼치기" }));
  expect(within(table).queryByRole("button", { name: /김 작업 상세/ })).not.toBeInTheDocument();
  expect(within(table).getByRole("button", { name: /이 작업 상세/ })).toBeInTheDocument();
  fireEvent.click(within(table).getByRole("button", { name: "이담당 일정 접기" }));
  expect(within(table).queryAllByRole("button", { name: /상세 내용 확인 및 수정$/ })).toHaveLength(0);
  fireEvent.click(within(table).getByRole("button", { name: `김담당 ${getTodayKey()} 일정 1건 펼치기` }));
  expect(within(table).getByRole("button", { name: /김 작업 상세/ })).toBeInTheDocument();
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
  expect(within(table).getByRole("button", { name: /김 작업 상세/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "검색 초기화" }));
  const resetTable = screen.getByRole("region", { name: "담당자별 주간 일정표" });
  expect(within(resetTable).getAllByRole("rowheader")).toHaveLength(2);
  expect(within(resetTable).queryAllByRole("button", { name: /상세 내용 확인 및 수정$/ })).toHaveLength(0);
  await act(async () => {});
});

test("기존 일정의 임의 이름은 팀원으로 등록하지 않고 일정 내용은 보존한다", async () => {
  localStorage.setItem(storageKey, JSON.stringify([makeSchedule({ person: "임의 이름", attendees: ["외부 참석자"] })]));
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "등록된 팀원 목록 보기" }));
  const directory = screen.getByRole("region", { name: "팀원 목록" });
  expect(within(directory).getByText("등록된 팀원이 없습니다.")).toBeInTheDocument();
  expect(within(directory).queryByRole("button", { name: "임의 이름" })).not.toBeInTheDocument();
  fireEvent.click(within(directory).getByRole("button", { name: "목록 닫기" }));
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 일정 수정" }));
  expect(screen.getByRole("option", { name: "임의 이름 (미등록 기존 담당자)" })).toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: "외부 참석자 (미등록 기존 참석자)" })).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(JSON.parse(localStorage.getItem(storageKey))[0].person).toBe("임의 이름");
  expect(JSON.parse(localStorage.getItem("made-mate-schedule-team"))).toEqual([]);
  await act(async () => {});
});

test("팀원을 별도로 등록하고 담당자·참석자로 선택해 저장하며 새로고침 후에도 복원한다", async () => {
  const first = render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "등록된 팀원 목록 보기" }));
  const directory = screen.getByRole("region", { name: "팀원 목록" });
  const nameInput = within(directory).getByLabelText("새 팀원 이름");
  fireEvent.click(within(directory).getByRole("button", { name: "팀원 등록" }));
  expect(within(directory).getByRole("alert")).toHaveTextContent("이름을 입력");
  for (const name of ["김담당", "이참석"]) {
    fireEvent.change(nameInput, { target: { value: name } });
    fireEvent.click(within(directory).getByRole("button", { name: "팀원 등록" }));
  }
  fireEvent.change(nameInput, { target: { value: " 김담당 " } });
  fireEvent.click(within(directory).getByRole("button", { name: "팀원 등록" }));
  expect(within(directory).getByRole("alert")).toHaveTextContent("이미 등록");
  expect(JSON.parse(localStorage.getItem("made-mate-schedule-team"))).toHaveLength(2);
  fireEvent.click(within(directory).getByRole("button", { name: "목록 닫기" }));
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "팀 작업" } });
  fireEvent.change(screen.getByLabelText("프로젝트"), { target: { value: "프로젝트" } });
  chooseAssignee("김담당");
  fireEvent.click(screen.getByRole("checkbox", { name: "이참석" }));
  fireEvent.click(screen.getByRole("button", { name: "일정 저장" }));
  const saved = JSON.parse(localStorage.getItem(storageKey))[0];
  expect(saved.person).toBe("김담당");
  expect(saved.attendees).toEqual(["이참석"]);
  first.unmount();
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "등록된 팀원 목록 보기" }));
  expect(screen.getByRole("region", { name: "팀원 목록" })).toHaveTextContent("등록된 팀원 2명");
  await act(async () => {});
});

test("팀원 목록이 손상되면 원본을 덮어쓰지 않고 등록을 막는다", async () => {
  const raw = "{broken-team";
  localStorage.setItem("made-mate-schedule-team", raw);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "등록된 팀원 목록 보기" }));
  const directory = screen.getByRole("region", { name: "팀원 목록" });
  fireEvent.change(within(directory).getByLabelText("새 팀원 이름"), { target: { value: "김담당" } });
  fireEvent.click(within(directory).getByRole("button", { name: "팀원 등록" }));
  expect(within(directory).getByRole("alert")).toHaveTextContent("읽지 못했습니다");
  expect(localStorage.getItem("made-mate-schedule-team")).toBe(raw);
  await act(async () => {});
});

test("팀원 목록에서 제외해도 기존 일정 기록은 유지하고 주간 표의 직원 행만 제거한다", async () => {
  saveSchedules([makeSchedule({ person: "김담당" })]);
  jest.spyOn(window, "confirm").mockReturnValue(true);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "등록된 팀원 목록 보기" }));
  const directory = screen.getByRole("region", { name: "팀원 목록" });
  fireEvent.click(within(directory).getByRole("button", { name: "김담당" }));
  fireEvent.click(within(directory).getByRole("button", { name: "김담당 팀원 목록에서 제외" }));
  expect(within(directory).getByText("등록된 팀원이 없습니다.")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("made-mate-schedule-team"))).toEqual([]);
  expect(JSON.parse(localStorage.getItem(storageKey))[0].person).toBe("김담당");
  fireEvent.click(screen.getByRole("tab", { name: "담당자별 주간" }));
  expect(screen.queryByRole("region", { name: "담당자별 주간 일정표" })).not.toBeInTheDocument();
  expect(screen.getByText("등록된 팀원이 없습니다. 팀원 목록에서 먼저 등록해 주세요.")).toBeInTheDocument();
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
  fireEvent.click(within(calendar).getByRole("button", { name: /검증용 마감 상세 내용 확인 및 수정/ }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await act(async () => {});
});

test("프로젝트·상태·공개 필터가 적용된 일정도 수정 저장 후 바로 확인할 수 있다", async () => {
  saveSchedules([makeSchedule({ project: "기존 프로젝트", status: "completed", visibility: "shared" })]);
  render(<ScheduleManager />);
  fireEvent.click(screen.getByRole("button", { name: "일정 등록 프로젝트 목록 보기" }));
  fireEvent.click(screen.getByRole("button", { name: "기존 프로젝트 프로젝트 일정 보기" }));
  fireEvent.change(screen.getByRole("combobox", { name: "일정 구분" }), { target: { value: "shared" } });
  fireEvent.change(screen.getByRole("combobox", { name: "업무 상태 필터" }), { target: { value: "completed" } });
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 일정 수정" }));
  fireEvent.change(screen.getByLabelText("프로젝트"), { target: { value: "바뀐 프로젝트" } });
  fireEvent.change(screen.getByLabelText("업무 진행 상태"), { target: { value: "pending" } });
  fireEvent.change(screen.getByLabelText("일정 공개 범위"), { target: { value: "private" } });
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(within(screen.getByRole("region", { name: "일정 달력" })).getByRole("button", { name: /검증용 마감 상세 내용/ })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "일정 구분" })).toHaveValue("all");
  expect(screen.getByRole("combobox", { name: "업무 상태 필터" })).toHaveValue("all");
  expect(within(selected).getByText("검증용 마감")).toBeInTheDocument();
  await act(async () => {});
});

test("공백뿐인 일정 이름이나 프로젝트는 저장하지 않는다", async () => {
  saveSchedules([makeSchedule()]);
  render(<ScheduleManager />);
  const selected = screen.getByRole("heading", { name: "선택한 날짜 일정" }).closest("section");
  fireEvent.click(within(selected).getByRole("button", { name: "검증용 마감 일정 수정" }));
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "   " } });
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(screen.getByRole("alert")).toHaveTextContent("일정 이름");
  fireEvent.change(screen.getByLabelText("일정 이름"), { target: { value: "  새 이름  " } });
  fireEvent.change(screen.getByLabelText("프로젝트"), { target: { value: "  " } });
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(screen.getByRole("alert")).toHaveTextContent("프로젝트");
  fireEvent.change(screen.getByLabelText("프로젝트"), { target: { value: "  새 프로젝트  " } });
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(JSON.parse(localStorage.getItem(storageKey))[0]).toMatchObject({ title: "새 이름", project: "새 프로젝트" });
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
