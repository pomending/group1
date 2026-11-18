import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import TaskDetail from "./TaskDetail";
import { useERP } from "../context/ERPContext";
import { TASK_PROGRESS, TASK_TYPES } from "../utils/taskUtils";
import { formatProjectId } from "../utils/formatUtils";
import NotFoundPage from "../components/NotFoundPage";
import "./TaskPage.css";

function TaskList() {
    const [taskTypeFilter, setTaskTypeFilter] = useState("전체");
    const [progressFilter, setProgressFilter] = useState("전체");
    const [currentPage, setCurrentPage] = useState(1);
    const [openProjects, setOpenProjects] = useState([]);

    const { tasks, projects, employees } = useERP();
    const navigate = useNavigate();
    const itemsPerPage = 10;

    // 진행 상태와 작업 단계를 함께 적용한다.
    const filteredTasks = tasks.filter(task => {
        const matchesType =
            taskTypeFilter === "전체" || task.taskType === taskTypeFilter;
        const matchesProgress =
            progressFilter === "전체" || task.progress === progressFilter;

        return matchesType && matchesProgress;
    });

    // master에서 구현한 프로젝트별 아코디언 구조를 유지한다.
    const groupedTasks = filteredTasks.reduce((groups, task) => {
        const projectId = task.projectId;

        if (!groups[projectId]) {
            groups[projectId] = [];
        }
        groups[projectId].push(task);

        return groups;
    }, {});

    // 프로젝트 그룹을 기준으로 10개씩 페이지를 나눈다.
    const projectEntries = Object.entries(groupedTasks);
    const totalPages = Math.ceil(projectEntries.length / itemsPerPage);
    const currentProjectEntries = projectEntries.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const changeProgressFilter = (value) => {
        setProgressFilter(value);
        setCurrentPage(1);
        setOpenProjects([]);
    };

    const changeTaskTypeFilter = (value) => {
        setTaskTypeFilter(value);
        setCurrentPage(1);
        setOpenProjects([]);
    };

    // 여러 프로젝트를 동시에 펼칠 수 있다.
    const toggleProject = (projectId) => {
        setOpenProjects(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    return (
        <div className="task-page">
            <div className="task-header">
                <div>
                    <h2>작업 관리</h2>
                    <p>프로젝트별 작업 진행 현황을 관리합니다.</p>
                </div>
                <div className="pm-heading-actions">
                    <button
                        type="button"
                        className="new-btn"
                        onClick={() => navigate("/tasks/detail")}
                    >
                        + 세부상세 내용
                    </button>
                </div>
            </div>

            {/* 진행 상태 통계 카드를 누르면 목록에 해당 필터를 적용한다. */}
            <div className="task-summary">
                <button
                    type="button"
                    className={`summary-card ${progressFilter === "전체" ? "active" : ""}`}
                    onClick={() => changeProgressFilter("전체")}
                    aria-pressed={progressFilter === "전체"}
                >
                    <span>전체 작업</span>
                    <strong>
                        {tasks.length}
                        <small className="task-stat-unit">건</small>
                    </strong>
                </button>

                {TASK_PROGRESS.map(progress => (
                    <button
                        type="button"
                        key={progress}
                        className={`summary-card ${progressFilter === progress ? "active" : ""}`}
                        onClick={() => changeProgressFilter(progress)}
                        aria-pressed={progressFilter === progress}
                    >
                        <span>{progress}</span>
                        <strong>
                            {tasks.filter(task => task.progress === progress).length}
                            <small className="task-stat-unit">건</small>
                        </strong>
                    </button>
                ))}
            </div>

            <div className="task-list-container">
                <div className="task-list-header">
                    <h3>작업 목록</h3>
                    <select
                        aria-label="작업 단계 필터"
                        value={taskTypeFilter}
                        onChange={(e) => changeTaskTypeFilter(e.target.value)}
                    >
                        <option value="전체">전체 단계</option>
                        {TASK_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* master의 읽기 전용 프로젝트 아코디언 */}
                <div className="task-accordion">
                    {currentProjectEntries.length > 0 ? (
                        currentProjectEntries.map(([projectId, projectTasks]) => {
                            const project = projects.find(
                                p => p.id === projectTasks[0].projectId
                            );
                            const isOpen = openProjects.includes(projectId);

                            return (
                                <div className="task-project-group" key={projectId}>
                                    <div
                                        className={`task-project-header ${isOpen ? "open" : ""}`}
                                        onClick={() => toggleProject(projectId)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                toggleProject(projectId);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={isOpen}
                                    >
                                        <div className="task-project-info">
                                            <span className="task-project-number">
                                                {formatProjectId(projectTasks[0].projectId)}
                                            </span>
                                            <strong>{project?.name ?? "삭제된 프로젝트"}</strong>
                                            <span className="task-count">
                                                작업 {projectTasks.length}개
                                            </span>
                                        </div>
                                        <span className="task-accordion-arrow">
                                            {isOpen ? "▲" : "▼"}
                                        </span>
                                    </div>

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
                                                        const statusClass =
                                                            task.progress === "완료"
                                                                ? "complete"
                                                                : task.progress === "작업중"
                                                                    ? "progress"
                                                                    : "waiting";

                                                        return (
                                                            <tr key={task.id}>
                                                                <td>{task.id}</td>
                                                                <td>{task.taskType}</td>
                                                                <td>
                                                                    <span className={`task-status ${statusClass}`}>
                                                                        {task.progress}
                                                                    </span>
                                                                </td>
                                                                <td>{employee?.name ?? "담당자 없음"}</td>
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
                        <div className="task-empty">작업 내역이 없습니다.</div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="task-pagination">
                        <button
                            type="button"
                            onClick={() => {
                                setCurrentPage(prev => prev - 1);
                                setOpenProjects([]);
                            }}
                            disabled={currentPage === 1}
                        >
                            이전
                        </button>
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                type="button"
                                key={index + 1}
                                className={currentPage === index + 1 ? "active" : ""}
                                onClick={() => {
                                    setCurrentPage(index + 1);
                                    setOpenProjects([]);
                                }}
                            >
                                {index + 1}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                setCurrentPage(prev => prev + 1);
                                setOpenProjects([]);
                            }}
                            disabled={currentPage === totalPages}
                        >
                            다음
                        </button>
                    </div>
                )}
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
