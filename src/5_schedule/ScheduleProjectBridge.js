/* [파일 안내] 기존 프로젝트 데이터와 달력 표시 사이의 변환
 * 입력: Manager가 ERPContext에서 읽은 프로젝트·일정
 * createProjectMilestones: 시작일·마감일을 읽기 전용 달력 항목으로 변환
 * getProjectScheduleSummaries: 프로젝트에 해당하는 일정 요약 생성
 * 이 파일은 변환만 하며 Context 업데이트는 Manager에서 실행합니다.
 */

import { isValidScheduleDate, normalizeAttendees, typeColors } from "./scheduleData";
import { employees } from "../data/mockData";

// 프로젝트의 시작일과 마감일을 저장 일정과 분리한 읽기 전용 달력 항목으로 만듭니다.
export function createProjectMilestones(projects) {
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
