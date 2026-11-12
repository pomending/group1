import { createProjectMilestones, createQuotationMilestones, matchesScheduleStaff, resolveScheduleProject, getScheduleProjectWarning } from "./ScheduleProjectBridge";
import { createScheduleForm } from "./scheduleData";

const projects = [{
  id: 1, name: "표시 확인", managerId: 20,
  startDate: "2026-11-04", dueDate: "2026-11-06",
}];

test("프로젝트 완료 상태는 읽기 전용 일정에도 반영하고 원본을 보존한다", () => {
  const source = [{ ...projects[0], status: "완료" }, { ...projects[0], id: 2, status: "진행 중" }];
  const before = JSON.stringify(source);
  const milestones = createProjectMilestones(source);
  expect(milestones.filter(item => item.status === "completed")).toHaveLength(2);
  expect(milestones.filter(item => item.status === "pending")).toHaveLength(2);
  expect(milestones[0].projectStatus).toBe("완료");
  expect(JSON.stringify(source)).toBe(before);
});

test("개인·부서 필터는 동명이인과 이름만 있는 기록을 직원 번호로 구분한다", () => {
  const employees = [{ id: 1, name: "동명", department: "영업팀" }, { id: 2, name: "동명", department: "생산팀" }];
  const meeting = { person: "담당", employeeId: 3, attendeeEmployees: [{ id: 2, name: "동명" }], legacyAttendees: [] };
  expect(matchesScheduleStaff(meeting, employees, 1, "")).toBe(false);
  expect(matchesScheduleStaff(meeting, employees, 2, "생산팀")).toBe(true);
  expect(matchesScheduleStaff(meeting, employees, null, "영업팀")).toBe(false);
  expect(matchesScheduleStaff({ person: "동명" }, employees, 1, "")).toBe(false);
  expect(matchesScheduleStaff({ person: "동명" }, employees, null, "")).toBe(true);
});

test("견적 유효기간은 잘못된 날짜를 제외하고 고객과 담당자를 읽기 전용으로 연결한다", () => {
  const quotes = [{ id: 1, validUntil: "2026-11-15", customerId: 4, employeeId: 2 },
    { id: 2, validUntil: "2026-02-30" }];
  const before = JSON.stringify(quotes);
  const result = createQuotationMilestones(quotes, [{ id: 4, companyName: "테스트 고객" }], [{ id: 2, name: "영업 직원" }]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ date: "2026-11-15", employeeId: 2, isQuotationExpiry: true });
  expect(result[0].title).toContain("테스트 고객");
  expect(JSON.stringify(quotes)).toBe(before);
});

test("끊긴 ID·재사용된 ID·동명 연결만 안내하고 원본은 바꾸지 않는다", () => {
  const project = { id: 1, name: "연결", quotationId: 10, customerId: 20 };
  const item = { scope: "업무용", project: "연결", projectId: 1, projectReference: "10:20" };
  const raw = JSON.stringify(item);
  expect(getScheduleProjectWarning(item, [])).toContain("프로젝트가 없습니다");
  expect(getScheduleProjectWarning(item, [{ ...project, quotationId: 11 }])).toContain("견적·고객");
  expect(getScheduleProjectWarning({ ...item, projectId: null }, [project, { ...project, id: 2 }])).toContain("같은 이름");
  expect(getScheduleProjectWarning(item, [{ ...project, name: "이름 변경" }])).toBe("");
  expect(getScheduleProjectWarning({ ...item, scope: "개인 일정용" }, [])).toBe("");
  expect(getScheduleProjectWarning({ project: "자유 입력" }, [])).toBe("");
  expect(JSON.stringify(item)).toBe(raw);
});

test("이름만 있는 일정은 동명 프로젝트 중 하나를 임의로 연결하지 않는다", () => {
  const duplicates = [{ id: 1, name: "동명" }, { id: 2, name: "동명" }];
  const schedule = { id: "s", scope: "업무용", project: "동명" };
  expect(resolveScheduleProject(schedule, duplicates)).toEqual({ project: "동명", projectId: null });
});

test("새 연결은 견적·고객 번호를 기억하고 같은 ID의 다른 프로젝트에는 연결하지 않는다", () => {
  const original = { id: 1, name: "원래 프로젝트", quotationId: 10, customerId: 20 };
  const saved = { id: "s1", scope: "업무용", ...resolveScheduleProject({ project: original.name }, [original]) };
  expect(saved.projectReference).toBe("10:20");
  const replacement = { ...original, name: "새 프로젝트", quotationId: 11 };
  expect(resolveScheduleProject(createScheduleForm(saved), [replacement])).toMatchObject({
    project: "원래 프로젝트", projectReference: "10:20",
  });
});

test("사용자가 연결 ID를 비우고 다른 프로젝트를 선택하면 새 연결 기준을 저장한다", () => {
  const next = { id: 2, name: "새 선택", quotationId: 30, customerId: 40 };
  expect(resolveScheduleProject({ project: next.name, projectId: null, projectReference: "10:20" }, [next]))
    .toEqual({ project: next.name, projectId: 2, projectReference: "30:40" });
});

test("전달받은 Context 직원 목록에서 프로젝트 담당자를 찾는다", () => {
  const employees = [{ id: "20", name: "현재 담당자" }];
  const before = JSON.stringify({ projects, employees });
  const milestones = createProjectMilestones(projects, employees);
  expect(milestones).toHaveLength(2);
  expect(milestones.map(item => item.projectManager)).toEqual(["현재 담당자", "현재 담당자"]);
  expect(JSON.stringify({ projects, employees })).toBe(before);
});

test("Context에서 직원 이름이 바뀌면 다음 변환에 반영한다", () => {
  expect(createProjectMilestones(projects, [{ id: 20, name: "변경된 이름" }])[0].projectManager)
    .toBe("변경된 이름");
});

test("직원 목록이 없거나 담당자를 찾지 못해도 기존 조회 호출을 지원한다", () => {
  expect(createProjectMilestones(projects)[0].projectManager).toBe("미지정");
  expect(createProjectMilestones(projects, [{ id: 1, name: "다른 직원" }])[0].projectManager)
    .toBe("미지정");
});

test("동명 프로젝트보다 기존 ID를 우선하고 바뀐 이름으로 연결을 유지한다", () => {
  const schedule = { id: "schedule-1", scope: "업무용", category: "프로젝트", project: "이전 이름", projectId: "1" };
  const renamed = [{ id: 1, name: "새 이름" }, { id: 2, name: "이전 이름" }];
  const form = createScheduleForm(schedule);
  expect(form.projectId).toBe("1");
  const saved = { ...schedule, ...resolveScheduleProject(form, renamed) };
  expect(saved).toMatchObject({ project: "새 이름", projectId: "1" });
});

test("프로젝트 삭제 시 같은 이름의 다른 ID로 연결하지 않고 기존 ID를 보존한다", () => {
  expect(resolveScheduleProject({ scope: "업무용", project: "이전 이름", projectId: 1 }, [{ id: 2, name: "이전 이름" }]))
    .toEqual({ project: "이전 이름", projectId: 1 });
});

test("이름만 있던 일정은 기존 방식으로 연결하고 빈 이름과 개인 일정은 연결을 해제한다", () => {
  expect(resolveScheduleProject({ scope: "업무용", project: " 표시 확인 " }, projects))
    .toEqual({ project: "표시 확인", projectId: 1 });
  expect(resolveScheduleProject({ scope: "업무용", project: "", projectId: 1 }, projects))
    .toEqual({ project: "", projectId: null });
  expect(resolveScheduleProject({ scope: "개인 일정용", project: "표시 확인", projectId: 1 }, projects))
    .toEqual({ project: "", projectId: null });
});
