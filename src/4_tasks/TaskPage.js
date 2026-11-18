import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import TaskDetail from "./TaskDetail";
import { useERP } from "../context/ERPContext";

import "./TaskPage.css";
import { TASK_PROGRESS, TASK_TYPES } from "../utils/taskUtils";
import { formatProjectId } from "../utils/formatUtils";
import NotFoundPage from "../components/NotFoundPage";

function TaskList() {

    // 작업 단계 필터
    const [ taskTypeFilter, setTaskTypeFilter ] = useState("전체");


    const { tasks, projects, employees } = useERP();
    const [openProjects, setOpenProjects] = useState([]);

    const navigate = useNavigate();

    // 선택한 작업 단계에 따라 작업 목록 필터링
    const filteredTasks = tasks.filter((task) => {
        if (taskTypeFilter === "전체") {
            return true;
        }

        return task.taskType === taskTypeFilter;
    });


    // 프로젝트별 작업 그룹 만들기
    const groupedTasks = filteredTasks.reduce((groups, task) => {

        const projectId = task.projectId;

        if (!groups[projectId]) {
            groups[projectId] = [];
        }

        groups[projectId].push(task);

        return groups;

    }, {});

    // 프로젝트 아코디언 열기 / 닫기
    const toggleProject = (projectId) => {

        setOpenProjects(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );

    };


    return (
        <div className="task-page">

            {/* 페이지 제목 */}
            <div className="task-header">
                <div>
                    <h2>작업 관리</h2>
                    <p>프로젝트별 작업 진행 현황을 관리합니다.</p>
                </div>
                <div className="pm-heading-actions">

                    <button className="new-btn" onClick={() => navigate("/tasks/detail")}>
                        + 세부상세 내용
                    </button>
                </div>
            </div>

            {/* 작업 현황 카드 */}
            <div className="task-summary">

                <div className="summary-card">
                    <span>전체 작업</span>
                    <strong>{tasks.length}</strong>
                </div>

                {TASK_PROGRESS.map(progress => (
                    <div className="summary-card" key={progress}>
                    <span>{progress}</span>
                    <strong>{tasks.filter(t=>t.progress === progress).length}</strong>
                </div>
                ))}

            </div>

            {/* 작업 목록 */}
            <div className="task-list-container">

                <div className="task-list-header">
                    <h3>작업 목록</h3>

                    <select
                        value={taskTypeFilter}
                        onChange={(e) => {
                            setTaskTypeFilter(e.target.value);
                        }}
                    >
                        <option value="전체">전체 단계</option>
                        {TASK_TYPES.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
{/* 프로젝트별 아코디언 작업 목록 */}
<div className="task-accordion">

    {filteredTasks.length > 0 ? (

        Object.entries(groupedTasks).map(([projectId, projectTasks]) => {

            const project = projects.find(
                p => p.id === projectTasks[0].projectId
            );

            const isOpen = openProjects.includes(projectId);

            return (

                <div className="task-project-group" key={projectId}>

                    {/* 프로젝트 제목 */}
                    <div
                        className={`task-project-header ${isOpen ? "open" : ""}`}
                        onClick={() => toggleProject(projectId)}
                    >

                        <div className="task-project-info">

                            <span className="task-project-number">
                                {formatProjectId(projectTasks[0].projectId)}
                            </span>

                            <strong>
                                {project?.name ?? "삭제된 프로젝트"}
                            </strong>

                            <span className="task-count">
                                작업 {projectTasks.length}개
                            </span>

                        </div>

                        <span className="task-accordion-arrow">
                            {isOpen ? "▲" : "▼"}
                        </span>

                    </div>

                    {/* 프로젝트별 작업 목록 */}
                    {isOpen && (

                        <div className="task-project-content">

                            <table className="task-table">

                                <thead>
                                    <tr>
                                        <th>번호</th>
                                        <th>작업 단계</th>
                                        <th>진행 상태</th>
                                        <th>담당자</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {projectTasks.map(task => {

                                        const employee = employees.find(
                                            emp => emp.id === task.employeeId
                                        );

                                        return (

                                            <tr key={task.id}>

                                                <td>{task.id}</td>

                                                <td>{task.taskType}</td>

                                                <td>
                                                    <span
                                                        className={`task-status ${
                                                            task.progress === "완료"
                                                                ? "complete"
                                                                : task.progress === "작업중"
                                                                    ? "progress"
                                                                    : "waiting"
                                                        }`}
                                                    >
                                                        {task.progress}
                                                    </span>
                                                </td>

                                                <td>
                                                    {employee?.name ?? "담당자 없음"}
                                                </td>

                                            </tr>

                                        );

                                    })}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            );

        })

    ) : (

        <div className="task-empty">
            작업 내역이 없습니다.
        </div>

    )}

</div>
               

                

            </div>

        </div>

    );
}

function TaskPage() {
    return (
        <Routes>
            <Route index element={<TaskList />} />
            <Route path="detail" element={<TaskDetail />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default TaskPage;
