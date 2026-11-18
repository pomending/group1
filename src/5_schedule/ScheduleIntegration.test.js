/* 실제 Context 변경을 일정 화면까지 전달하는 검사입니다. jsdom 저장소와 가짜 공휴일 응답만 사용합니다. */
import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ERPProvider, useERP } from "../context/ERPContext";
import { initialEmployees } from "../data/mockData";
import ScheduleManager from "./ScheduleManager";
import { loadSchedules } from "./scheduleStorage";

let erp;
const originalFetch = global.fetch;
function ContextProbe() { erp = useERP(); return null; }
function renderSchedule() {
  return render(<ERPProvider><ContextProbe /><ScheduleManager /></ERPProvider>);
}

async function finishHolidayRequests() {
  await act(async () => {
    await Promise.allSettled(fetch.mock.results.map(request => request.value));
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.useFakeTimers().setSystemTime(new Date("2026-11-17T12:00:00+09:00"));
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
});
afterEach(() => {
  jest.useRealTimers();
  global.fetch = originalFetch;
  localStorage.clear();
  sessionStorage.clear();
});

test("인사 이름·부서 변경은 일정 검색에 반영하고 휴직 직원은 신규 선택에서 제외한다", async () => {
  const employee = { ...initialEmployees[0], id: 501, name: "연동직원", email: "integration@example.com" };
  localStorage.setItem("erp_employees", JSON.stringify([employee]));
  localStorage.setItem("made-mate-schedules", JSON.stringify([{
    id: "integration-staff", title: "연동 회의", date: "2026-11-17", time: "09:00", endTime: "10:00",
    scope: "업무용", category: "회의", type: "기획", status: "pending", visibility: "shared",
    person: employee.name, employeeId: employee.id, attendees: [], attendeeEmployees: [], legacyAttendees: [], repeatType: "none",
  }]));
  renderSchedule();
  await finishHolidayRequests();
  act(() => { expect(erp.updateEmployee({ id: employee.id, name: "변경직원", department: "물류팀" }).ok).toBe(true); });
  fireEvent.change(screen.getByRole("textbox", { name: "일정 검색" }), { target: { value: "변경직원" } });
  fireEvent.change(screen.getByRole("combobox", { name: "일정 부서 필터" }), { target: { value: "물류팀" } });
  expect(within(screen.getByRole("region", { name: "일정 달력" })).getByRole("button", {
    name: "2026-11-17 09:00~10:00 연동 회의 선택한 날짜 일정에서 보기",
  })).toBeInTheDocument();
  act(() => { expect(erp.updateEmployee({ id: employee.id, status: "휴직" }).ok).toBe(true); });
  expect(screen.getByText(/변경직원 · 휴직/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "일정 등록", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "업무용", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "회의", exact: true }));
  fireEvent.change(screen.getByRole("textbox", { name: "담당자", exact: true }), { target: { value: "변경직원" } });
  expect(screen.queryByRole("button", { name: /변경직원 물류팀/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("checkbox", { name: /변경직원/ })).not.toBeInTheDocument();
  expect(loadSchedules().items[0]).toMatchObject({ employeeId: 501, person: "연동직원" });
});

test("프로젝트 이름·마감 변경은 달력에 반영하고 직접 등록 일정으로 복제하지 않는다", async () => {
  renderSchedule();
  await finishHolidayRequests();
  act(() => { expect(erp.updateProject({ id: 2, name: "연동 프로젝트", dueDate: "2026-12-05" }).ok).toBe(true); });
  fireEvent.click(screen.getByRole("button", { name: "다음 기간" }));
  const calendar = screen.getByRole("region", { name: "일정 달력" });
  expect(within(calendar).getByRole("button", { name: "2026-12-05 종일 연동 프로젝트 · 마감일 선택한 날짜 일정에서 보기" })).toBeInTheDocument();
  expect(within(calendar).queryByText("한국대학교 에코백 제작 · 마감일")).not.toBeInTheDocument();
  expect(loadSchedules().items).toEqual([]);
});

test("세부 작업 마감·완료 변경을 달력에서 읽고 완료 숨기기 조건을 적용한다", async () => {
  renderSchedule();
  await finishHolidayRequests();
  // 제작(11/03)과 포장(11/13) 사이에서 검수 날짜를 변경합니다.
  act(() => { expect(erp.updateTask({ id: 2, taskDeadline: "2026-11-08", progress: "완료" }).ok).toBe(true); });
  const calendar = screen.getByRole("region", { name: "일정 달력" });
  const cardName = "2026-11-08 종일 삼성전자 텀블러 제작 · 검수 관리 마감 선택한 날짜 일정에서 보기";
  expect(within(calendar).getByRole("button", { name: cardName })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox", { name: "완료된 세부 작업 숨기기" }));
  expect(within(calendar).queryByRole("button", { name: cardName })).not.toBeInTheDocument();
  expect(erp.tasks.find(item => item.id === 2)).toMatchObject({ taskDeadline: "2026-11-08", progress: "완료" });
  expect(loadSchedules().items).toEqual([]);
});
