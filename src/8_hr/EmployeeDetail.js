import { useState } from "react";
import { statusClass } from "../utils/employeeUtils";
import { formatEmployeeId, formatProjectId } from "../utils/formatUtils";

export default function EmployeeDetail({ employee, projects, onEdit, onDelete, tasks = [] }) {
    const [error, setError] = useState("");
    const assignedProjects = projects.filter(p => Number(p.managerId) === Number(employee.id));

    const assignedTasks = tasks.filter(
        task => Number(task.employeeId) === Number(employee.id)
    );

    const handleDelete = () => {
        if (!window.confirm(`${employee.name} 직원의 정보를 삭제하시겠습니까?`)) return;
        const result = onDelete();
        if (!result.ok) setError(result.message || "직원을 삭제하지 못했습니다.");
    };

    return (
        <>
            <section className="hr-panel hr-detail-panel">
                <div className="hr-detail-top">
                    <div className="hr-identity">
                        <div className="hr-avatar">{employee.name.slice(0, 1)}</div>
                        <div>
                            <p className="hr-eyebrow">EMPLOYEE PROFILE · {formatEmployeeId(employee.id)}</p>
                            <h2>{employee.name} <span className={`hr-status hr-status-${statusClass(employee.status)}`}>{employee.status}</span></h2>
                            <p className="hr-muted">{employee.department} · {employee.position}</p>
                        </div>
                    </div>
                    <div className="hr-heading-actions">
                        <button type="button" className="hr-btn hr-btn-ghost" onClick={onEdit}>정보 수정</button>
                        <button
                            type="button"
                            className="hr-btn hr-btn-danger"
                            onClick={handleDelete}
                            title="직원 삭제"
                        >
                            직원 삭제
                        </button>
                    </div>
                </div>
                {error && <p className="hr-form-error" role="alert">{error}</p>}
                
                <div className="hr-info-grid">
                    <div><span>사번</span><strong>{formatEmployeeId(employee.id)}</strong></div>
                    <div><span>부서</span><strong>{employee.department}</strong></div>
                    <div><span>직급</span><strong>{employee.position}</strong></div>
                    <div><span>입사일</span><strong>{employee.hireDate || "-"}</strong></div>
                    <div><span>이메일</span><strong>{employee.email || "-"}</strong></div>
                    <div><span>연락처</span><strong>{employee.phone || "-"}</strong></div>
                </div>
            </section>

            {/* 담당 프로젝트 */}
            <section className="hr-panel hr-project-panel">
                <div className="hr-section-title">
                    <div>
                        <p className="hr-eyebrow">PROJECT ASSIGNMENTS</p>
                        <h2>담당 프로젝트</h2>
                    </div>
                    <span className="hr-subtle">{assignedProjects.length}건</span>
                </div>

                {assignedProjects.length > 0 ? (
                    <div className="hr-table-scroll">
                        <table className="hr-table">
                            <thead>
                                <tr>
                                    <th>프로젝트 ID</th>
                                    <th>프로젝트명</th>
                                    <th>진행 상태</th>
                                    <th>시작일</th>
                                    <th>납기일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignedProjects.map(project => (
                                    <tr key={project.id}>
                                        <td className="hr-id">
                                            {formatProjectId(project.id)}
                                        </td>
                                        <td><strong>{project.name}</strong></td>
                                        <td>{project.status}</td>
                                        <td>{project.startDate || "-"}</td>
                                        <td>{project.dueDate || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="hr-empty">현재 연결된 프로젝트가 없습니다.</p>
                )}
            </section>

            {/* 담당 세부 작업 */}
            <section className="hr-panel hr-project-panel">
                <div className="hr-section-title">
                    <div>
                        <p className="hr-eyebrow">TASK ASSIGNMENTS</p>
                        <h2>담당 세부 작업</h2>
                    </div>
                    <span className="hr-subtle">{assignedTasks.length}건</span>
                </div>

                {assignedTasks.length > 0 ? (
                    <div className="hr-table-scroll">
                        <table className="hr-table">
                            <thead>
                                <tr>
                                    <th>프로젝트명</th>
                                    <th>작업 종류</th>
                                    <th>마감일</th>
                                    <th>진행 상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignedTasks.map(task => {
                                    const project = projects.find(
                                        p => Number(p.id) === Number(task.projectId)
                                    );

                                    return (
                                        <tr key={task.id}>
                                            <td>{project?.name ?? "프로젝트 없음"}</td>
                                            <td>{task.taskStatus}</td>
                                            <td>{task.taskDeadline || "-"}</td>
                                            <td>{task.progress}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="hr-empty">담당 세부 작업이 없습니다.</p>
                )}
            </section>
        </>
    );
}
