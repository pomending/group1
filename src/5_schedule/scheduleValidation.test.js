import React from "react";
import { render, screen } from "@testing-library/react";
import { createEmptyForm, getScheduleFormError } from "./scheduleData";
import ScheduleFormModal from "./ScheduleFormModal";

const validForm = () => ({ ...createEmptyForm(), scope: "업무용", category: "업무", title: "검증 일정", person: "담당자", date: "2028-02-29" });

// 저장 직전의 검사입니다. DOM의 maxLength·선택 목록을 우회한 값도 같은 규칙으로 막습니다.
test.each([
  [{ title: " " }, "title"], [{ title: "가".repeat(81) }, "title"],
  [{ title: null }, "title"], [{ category: "프로젝트", project: " " }, "project"],
  [{ category: "프로젝트", project: "가".repeat(61) }, "project"], [{ project: null }, "project"],
  [{ description: "가".repeat(3001) }, "description"], [{ description: null }, "description"],
  [{ person: " " }, "person"], [{ person: "가".repeat(31) }, "person"],
  [{ category: "회의", attendees: "가".repeat(31) }, "attendees"],
  [{ category: "회의", attendees: {} }, "attendees"],
  [{ category: "회의", attendeeEmployees: {} }, "attendees"],
  [{ category: "회의", attendeeEmployees: [{ id: -1, name: "직원" }] }, "attendees"],
  [{ category: "회의", attendeeEmployees: [{ id: 1, name: "가".repeat(31) }] }, "attendees"],
  [{ category: "회의", attendeeEmployees: [{ id: 1, name: "직원" }, { id: 1, name: "직원" }] }, "attendees"],
  [{ date: "2026-02-29" }, "date"], [{ time: "24:00" }, "time"],
  [{ endTime: "09:00" }, "endTime"], [{ endDate: "2028-02-28" }, "endDate"],
  [{ repeatType: "yearly" }, "repeatInterval"], [{ repeatType: "weekly", repeatInterval: 0 }, "repeatInterval"],
  [{ repeatType: "weekly", repeatInterval: 121 }, "repeatInterval"],
  [{ repeatType: "weekly", repeatEndType: "invalid" }, "repeatEndType"],
  [{ repeatType: "weekly", repeatEndType: "count", repeatCount: 1001 }, "repeatCount"],
  [{ repeatType: "weekly", repeatEndType: "until", repeatEndDate: "2028-02-28" }, "repeatEndDate"],
  [{ repeatType: "monthly", monthlyRule: "bad" }, "monthlyRule"],
  [{ repeatType: "monthly", monthlyRule: "weekday", monthlyOrdinal: 5 }, "monthlyOrdinal"],
  [{ repeatType: "monthly", monthlyRule: "weekday", monthlyWeekday: 7 }, "monthlyWeekday"],
  [{ repeatType: "monthly", monthlyRule: "weekday", monthlyWeekday: "" }, "monthlyWeekday"],
  [{ repeatType: "weekly", holidayRule: "bad" }, "holidayRule"],
  [{ status: "in_progress" }, "status"], [{ visibility: "bad" }, "visibility"],
  [{ reminderMinutes: -10 }, "reminderMinutes"], [{ reminderMinutes: "" }, "reminderMinutes"],
  [{ isAllDay: "false" }, "isAllDay"],
  [{ reminderMinutes: false }, "reminderMinutes"],
  [{ reminderMinutes: [] }, "reminderMinutes"],
  [{ repeatType: "weekly", repeatInterval: true }, "repeatInterval"],
  [{ repeatType: "weekly", repeatInterval: { toString: null, valueOf: null } }, "repeatInterval"],
  [{ repeatType: "weekly", repeatEndType: "count", repeatCount: true }, "repeatCount"],
  [{ repeatType: "monthly", monthlyRule: "weekday", monthlyWeekday: true }, "monthlyWeekday"],
  [{ repeatType: "monthly", monthlyRule: "weekday", monthlyWeekday: { toString: null, valueOf: null } }, "monthlyWeekday"],
])("잘못된 입력은 저장 전에 해당 필드를 안내한다: %j", (changes, field) => {
  expect(getScheduleFormError({ ...validForm(), ...changes })?.field).toBe(field);
});

test.each([null, undefined, 5, "bad"])("폼 자체가 손상돼도 예외 대신 안내를 반환한다: %s", value => {
  expect(getScheduleFormError(value)?.field).toBe("scope");
});

test.each([
  {}, { title: "가".repeat(80), description: "가".repeat(3000), person: "가".repeat(30) },
  { category: "프로젝트", project: "가".repeat(60) },
  { category: "회의", attendees: "가".repeat(30) },
  { endDate: "2028-03-01", time: "23:00", endTime: "01:00" },
  { isAllDay: true, time: "17:00", endTime: "09:00" },
  { repeatType: "weekly", repeatInterval: 120, repeatEndType: "count", repeatCount: 1000 },
  { repeatType: "monthly", monthlyRule: "weekday", monthlyOrdinal: -1, monthlyWeekday: 0 },
  { scope: "개인 일정용", person: "", category: "", status: "pending" },
])("허용 경계와 기존 일정 형식은 통과한다: %j", changes => {
  expect(getScheduleFormError({ ...validForm(), ...changes })).toBeNull();
});

test("접힌 추가 설정의 잘못된 알림 값을 펼치고 입력과 오류를 연결한다", () => {
  const form = { ...validForm(), reminderMinutes: -10 };
  const error = getScheduleFormError(form).message;
  render(<ScheduleFormModal form={form} teamMembers={[]} onChange={jest.fn()} onSubmit={jest.fn()} onClose={jest.fn()} error={error} />);
  expect(screen.getByRole("group", { name: "일정 추가 설정" })).toHaveAttribute("open");
  expect(screen.getByLabelText("알림", { exact: true })).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("알림", { exact: true })).toHaveAccessibleDescription(error);
});
