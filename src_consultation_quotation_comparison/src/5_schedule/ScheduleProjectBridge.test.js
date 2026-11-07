import { createProjectMilestones, resolveScheduleProject, getProjectScheduleSummaries } from "./ScheduleProjectBridge";
import { createScheduleForm } from "./scheduleData";

const projects = [{
  id: 1, name: "표시 확인", managerId: 20,
  startDate: "2026-11-04", dueDate: "2026-11-06",
}];

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

test("동명 프로젝트보다 기존 ID를 우선하고 바뀐 이름으로 요약 연결을 유지한다", () => {
  const schedule = { id: "schedule-1", scope: "업무용", category: "프로젝트", project: "이전 이름", projectId: "1" };
  const renamed = [{ id: 1, name: "새 이름" }, { id: 2, name: "이전 이름" }];
  const form = createScheduleForm(schedule);
  expect(form.projectId).toBe("1");
  const saved = { ...schedule, ...resolveScheduleProject(form, renamed) };
  expect(saved).toMatchObject({ project: "새 이름", projectId: "1" });
  expect(getProjectScheduleSummaries(renamed[0], [saved])).toHaveLength(1);
  expect(getProjectScheduleSummaries(renamed[1], [saved])).toHaveLength(0);
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
