/* [파일 안내] 기존 프로젝트 데이터와 달력 표시 사이의 변환
 * 입력: Manager가 ERPContext에서 읽은 프로젝트·직원, 일정관리의 저장 일정
 * 담당자 이름: 전달받은 직원 목록에서 managerId로 찾습니다. 원본 데이터 파일을 직접 참조하지 않습니다.
 * createProjectMilestones: 시작일·마감일을 읽기 전용 달력 항목으로 변환
 */

import { getScheduleProjectId, isValidScheduleDate, typeColors } from "./scheduleData";

// 저장 당시 이름은 보존하고 HR의 현재 정보와 다른 연결만 안내합니다.
export function getScheduleEmployeeWarning(item, employees) {
  if (item.scope === "개인 일정용") return "";
  const people = [...(item.attendeeEmployees || [])];
  if (item.employeeId != null) people.push({ id: item.employeeId, name: item.person });
  const messages = [];
  for (const person of people) {
    const employee = employees.find(entry => String(entry.id) === String(person.id));
    let message = "";
    if (!employee) message = person.name + " · 직원 정보가 없습니다.";
    else if (employee.status && employee.status !== "재직") message = employee.name + " · " + employee.status;
    else if (employee.name !== person.name) message = person.name + " → " + employee.name + " · 이름 변경";
    if (message && !messages.includes(message)) messages.push(message);
  }
  return messages.join(" / ");
}

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

// 세부 작업은 원본을 읽어 달력 항목으로만 표시합니다.
export function createTaskMilestones(tasks, projects, employees) {
  const milestones = [];
  for (const task of tasks) {
    if (task.id == null || !isValidScheduleDate(task.taskDeadline)) continue;
    const project = projects.find(entry => String(entry.id) === String(task.projectId));
    if (!project) continue;
    const employee = employees.find(entry => String(entry.id) === String(task.employeeId));
    milestones.push({
      id: "task-deadline-" + task.id,
      date: task.taskDeadline,
      time: "00:00",
      endTime: "23:59",
      isAllDay: true,
      title: project.name + " · " + (task.taskType || "세부 작업") + " 마감",
      project: project.name,
      projectManager: employee?.name || "미지정",
      person: "프로젝트 일정",
      scope: "업무용",
      category: "프로젝트",
      visibility: "shared",
      color: typeColors["마감"],
      isProjectMilestone: true,
      milestoneType: "세부 작업 마감",
      isTaskDeadline: true,
      taskProgress: task.progress || "대기중",
    });
  }
  return milestones;
}
