/* [파일 안내] 기존 프로젝트 데이터와 달력 표시 사이의 변환
 * 입력: Manager가 ERPContext에서 읽은 프로젝트·직원, 일정관리의 저장 일정
 * 담당자 이름: 전달받은 직원 목록에서 managerId로 찾습니다. 원본 데이터 파일을 직접 참조하지 않습니다.
 * createProjectMilestones: 시작일·마감일을 읽기 전용 달력 항목으로 변환
 * getProjectScheduleSummaries: 프로젝트에 해당하는 일정 요약 생성
 * 이 파일은 변환만 하며 Context 업데이트는 Manager에서 실행합니다.
 * 주의: 요약 결과는 프로젝트의 schedules 배열에 반영됩니다. 필드를 바꾸면 3번이 받는 데이터도 바뀝니다.
 */

import { getScheduleProjectId, isValidScheduleDate, normalizeAttendees, typeColors } from "./scheduleData";

// 프로젝트에서 변경을 금지한 견적·고객 번호로 같은 ID의 다른 프로젝트를 구분합니다.
// 과거 자료에 두 번호가 없으면 기존 연결 방식을 유지합니다.
function getProjectReference(project) {
  if (project.quotationId == null || project.customerId == null) return "";
  return String(project.quotationId) + ":" + String(project.customerId);
}

// 저장 자료는 고치지 않고, 사용자가 확인해야 할 연결만 안내합니다.
// ID 없는 자유 입력 프로젝트명은 허용하되 동명 후보가 여러 개면 구분이 필요합니다.
export function getScheduleProjectWarning(item, projects) {
  if (item.scope === "개인 일정용" || !item.project) return "";
  const id = getScheduleProjectId(item);
  if (id === null) {
    if (projects.filter(project => project.name === item.project.trim()).length > 1) {
      return "같은 이름의 프로젝트가 여러 개여서 연결할 수 없습니다. 프로젝트명을 구분한 뒤 다시 선택해 주세요.";
    }
    return "";
  }
  const linked = projects.find(project => String(project.id) === String(id));
  if (!linked) return "연결했던 프로젝트가 없습니다. 프로젝트를 다시 선택하거나 연결을 해제해 주세요.";
  if (item.projectReference && item.projectReference !== getProjectReference(linked)) {
    return "프로젝트 번호는 같지만 견적·고객 정보가 달라 연결하지 않았습니다. 프로젝트를 다시 확인해 주세요.";
  }
  return "";
}

// 기존 ID를 이름보다 우선합니다. 사용자가 연결을 바꾸면 Manager가 ID를 비워 구분합니다.
export function resolveScheduleProject(form, projects) {
  const project = form.project.trim();
  const projectId = getScheduleProjectId(form);
  const projectReference = typeof form.projectReference === "string" ? form.projectReference : "";
  if (!project || form.scope === "개인 일정용") return { project: "", projectId: null };
  let linked;
  if (projectId !== null) {
    linked = projects.find(entry => String(entry.id) === String(projectId));
  } else {
    // 동명 프로젝트가 여러 개면 첫 항목을 임의로 선택하지 않습니다.
    const candidates = projects.filter(entry => entry.name === project);
    if (candidates.length === 1) linked = candidates[0];
  }
  // 삭제된 프로젝트의 ID를 동명 프로젝트로 자동 재연결하지 않고 기존 정보를 보존합니다.
  if (!linked) return { project, projectId };
  // 초기화 뒤 ID가 재사용되었어도 이전 일정의 연결 정보를 새 값으로 바꾸지 않습니다.
  if (projectId !== null && projectReference && projectReference !== getProjectReference(linked)) {
    return { project, projectId, projectReference };
  }
  const reference = getProjectReference(linked);
  return { project: linked.name, projectId: projectId ?? linked.id, ...(reference ? { projectReference: reference } : {}) };
}

// 프로젝트의 시작일과 마감일을 저장 일정과 분리한 읽기 전용 달력 항목으로 만듭니다.
// 일정관리는 Context 직원 목록을 두 번째 인자로 전달합니다.
// DashboardToday는 담당자를 표시하지 않아 프로젝트만 전달합니다. 직원 목록이 없거나 ID가 일치하지 않으면 미지정입니다.
export function createProjectMilestones(projects, employees = []) {
  const milestones = [];
  for (const project of projects) {
    const manager = employees.find(employee => String(employee.id) === String(project.managerId));
    const dates = [
      { date: project.startDate, milestoneType: "시작일", key: "start" },
      { date: project.dueDate, milestoneType: "마감일", key: "due" },
    ];

    // 프로젝트마다 시작일과 마감일을 하나씩 확인하고, 유효한 날짜만 달력에 추가합니다.
    for (const entry of dates) {
      if (!isValidScheduleDate(entry.date)) continue;
      milestones.push({
        id: "project-" + project.id + "-" + entry.key,
        date: entry.date,
        time: "00:00",
        endTime: "23:59",
        isAllDay: true,
        title: project.name + " · " + entry.milestoneType,
        project: project.name,
        projectManager: manager?.name || "미지정",
        person: "프로젝트 일정",
        type: "기획",
        category: "프로젝트",
        scope: "업무용",
        visibility: "shared",
        status: "pending",
        color: typeColors["기획"],
        isProjectMilestone: true,
        milestoneType: entry.milestoneType,
      });
    }
  }
  return milestones;
}

// 일정의 프로젝트 ID를 우선 사용하고, ID가 없는 기존 일정은 이름으로 연결합니다.
export function getProjectScheduleSummaries(project, items, projects = [project]) {
  const summaries = [];
  for (const item of items) {
    // 과거 저장값에 연결 정보가 남아 있어도 개인 일정은 프로젝트에 전달하지 않습니다.
    if (item.scope === "개인 일정용") continue;
    // ID가 있으면 ID로 비교합니다. 예전 일정처럼 ID가 없을 때만 이름을 비교합니다.
    let matchesProject = item.project === project.name;
    if (item.projectId != null) {
      matchesProject = String(item.projectId) === String(project.id);
    } else if (projects.filter(entry => entry.name === item.project).length !== 1) {
      continue;
    }
    if (item.projectReference && item.projectReference !== getProjectReference(project)) continue;
    if (!item.project || !matchesProject) continue;
    summaries.push({
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
    });
  }
  return summaries;
}
