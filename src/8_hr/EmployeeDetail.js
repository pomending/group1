import React, { useState } from "react";
import { statusClass } from "../utils/employeeUtils";
import { formatEmployeeId, formatProjectId } from "../utils/formatUtils";

export default function EmployeeDetail({ employee, projects, onEdit, onDelete }) {
    const [error, setError] = useState("");
    const assignedProjects = projects.filter(p => Number(p.managerId) === Number(employee.id));

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
                        <button type="button" className="hr-btn hr-btn-danger" onClick={handleDelete} disabled={assignedProjects.length > 0} title={assignedProjects.length > 0 ? "담당 프로젝트가 있어 삭제할 수 없습니다." : "직원 삭제"}>직원 삭제</button>
                    </div>
                </div>
                {error && <p className="hr-form-error" role="alert">{error}</p>}
                {assignedProjects.length > 0 && <p className="hr-notice">담당 프로젝트가 {assignedProjects.length}건 있어 삭제할 수 없습니다. 퇴사·휴직 처리는 정보 수정에서 할 수 있습니다.</p>}
                <div className="hr-info-grid">
                    <div><span>사번</span><strong>{formatEmployeeId(employee.id)}</strong></div>
                    <div><span>부서</span><strong>{employee.department}</strong></div>
                    <div><span>직급</span><strong>{employee.position}</strong></div>
                    <div><span>입사일</span><strong>{employee.hireDate || "-"}</strong></div>
                    <div><span>이메일</span><strong>{employee.email || "-"}</strong></div>
                    <div><span>연락처</span><strong>{employee.phone || "-"}</strong></div>
                </div>
            </section>

            <section className="hr-panel hr-project-panel">
                <div className="hr-section-title"><div><p className="hr-eyebrow">PROJECT ASSIGNMENTS</p><h2>담당 프로젝트</h2></div><span className="hr-subtle">{assignedProjects.length}건</span></div>
                {assignedProjects.length ? (
                    <div className="hr-table-scroll"><table className="hr-table">
                        <thead><tr><th>프로젝트 ID</th><th>프로젝트명</th><th>진행 상태</th><th>시작일</th><th>납기일</th></tr></thead>
                        <tbody>{assignedProjects.map(project => (
                            <tr key={project.id}>
                                <td className="hr-id">{formatProjectId(project.id)}</td>
                                <td><strong>{project.name}</strong></td>
                                <td>{project.status}</td>
                                <td>{project.startDate || "-"}</td>
                                <td>{project.dueDate || "-"}</td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                ) : <p className="hr-empty">현재 연결된 프로젝트가 없습니다.</p>}
            </section>
        </>
    );
}
