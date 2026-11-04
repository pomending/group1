/* [파일 안내] 기존 프로젝트 데이터와 달력 표시 사이의 변환
 * 입력: Manager가 ERPContext에서 읽은 프로젝트·직원, 일정관리의 저장 일정
 * 담당자 이름: 전달받은 직원 목록에서 managerId로 찾습니다. 원본 데이터 파일을 직접 참조하지 않습니다.
 * createProjectMilestones: 시작일·마감일을 읽기 전용 달력 항목으로 변환
 * getProjectScheduleSummaries: 프로젝트에 해당하는 일정 요약 생성
 * 이 파일은 변환만 하며 Context 업데이트는 Manager에서 실행합니다.
 * 주의: 요약 결과는 프로젝트의 schedules 배열에 반영됩니다. 필드를 바꾸면 3번이 받는 데이터도 바뀝니다.
 */

import { getScheduleProjectId, isValidScheduleDate, normalizeAttendees, typeColors } from "./scheduleData";

// 기존 ID를 이름보다 우선합니다. 사용자가 연결을 바꾸면 Manager가 ID를 비워 구분합니다.
export function resolveScheduleProject(form, projects) {
  const project = form.project.trim();
  const projectId = getScheduleProjectId(form);
  if (!project || form.scope === "개인 일정용") return { project: "", projectId: null };
  const linked = projectId !== null
    ? projects.find(entry => String(entry.id) === String(projectId))
    : projects.find(entry => entry.name === project);
  // 삭제된 프로젝트의 ID를 동명 프로젝트로 자동 재연결하지 않고 기존 정보를 보존합니다.
  return linked ? { project: linked.name, projectId: projectId ?? linked.id } : { project, projectId };
}

// 프로젝트의 시작일과 마감일을 저장 일정과 분리한 읽기 전용 달력 항목으로 만듭니다.
// 일정관리는 Context 직원 목록을 두 번째 인자로 전달합니다.
// DashboardToday는 담당자를 표시하지 않아 프로젝트만 전달합니다. 직원 목록이 없거나 ID가 일치하지 않으면 미지정입니다.
export function createProjectMilestones(projects, employees = []) {
  return projects.flatMap((project) => [
    { date: project.startDate, milestoneType: "시작일", key: "start" },
    { date: project.dueDate, milestoneType: "마감일", key: "due" },
  ].filter(({ date }) => isValidScheduleDate(date)).map(({ date, milestoneType, key }) => ({
    id: "project-" + project.id + "-" + key,
    date,
    time: "00:00",
    endTime: "23:59",
    isAllDay: true,
    title: project.name + " · " + milestoneType,
    project: project.name,
    projectManager: employees.find(employee => String(employee.id) === String(project.managerId))?.name || "미지정",
    person: "프로젝트 일정",
    type: "기획",
    category: "프로젝트",
    scope: "업무용",
    visibility: "shared",
    status: "pending",
    color: typeColors["기획"],
    isProjectMilestone: true,
    milestoneType,
  })));
}

// 일정의 프로젝트 ID를 우선 사용하고, ID가 없는 기존 일정은 이름으로 연결합니다.
export function getProjectScheduleSummaries(project, items) {
  return items
    .filter((item) => item.project && (
      (item.projectId != null && String(item.projectId) === String(project.id))
      || (item.projectId == null && item.project === project.name)
    ))
    .map((item) => ({
      id: item.id,
      title: item.title,
      date: item.date,
      endDate: item.endDate || "",
      time: item.time,
      endTime: item.endTime,
      isAllDay: Boolean(item.isAllDay),
      category: item.category || "",
      type: item.type || "",
      status: item.status,
      person: item.person,
      attendees: normalizeAttendees(item.attendees),
      visibility: item.visibility || "shared",
      description: item.description || "",
      repeatType: item.repeatType || "none",
      repeatInterval: item.repeatInterval || 1,
      holidayRule: item.holidayRule || "keep",
      excludedDates: item.excludedDates || [],
    }));
}
