import React, { useState } from "react";
import { useERP } from "../context/ERPContext";
import EmployeeList from "./EmployeeList";
import EmployeeForm from "./EmployeeForm";
import EmployeeDetail from "./EmployeeDetail";
import "./HrPage.css";
import { departmentNames } from "../utils/employeeUtils";
import { useNavigate } from "react-router-dom";

export default function HrPage() {

    const {
        employees, projects,
        addEmployee, updateEmployee, deleteEmployee,
        currentUser
    } = useERP();

    const [page, setPage] = useState("list");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const selectedEmployee = employees.find(e => Number(e.id) === Number(selectedEmployeeId));

    const navi = useNavigate()

    const departments = departmentNames
        .map(department => ({
            name: department,
            count: employees.filter(employee =>
                employee.department === department
            ).length
        }))
        .sort((a, b) => b.count - a.count);

    const showDetail = (id) => {
        setSelectedEmployeeId(id);
        setPage("detail");
    };
    const showEdit = (id) => {
        setSelectedEmployeeId(id);
        setPage("edit");
    };
    const handleSave = (data) => {
        const result = page === "edit"
            ? updateEmployee({ ...data, id: selectedEmployeeId })
            : addEmployee(data);
        if (result.ok) {
            setSelectedEmployeeId(result.id);
            setPage("detail");
        }
        return result;
    };
    const handleDelete = () => {
        const result = deleteEmployee(selectedEmployeeId);
        if (result.ok) {
            setSelectedEmployeeId(null);
            setPage("list");
        }
        return result;
    };

    return (
        <div className="hr-app">
            <main className="hr-shell">
                <header className="hr-page-heading">
                    <div>
                        <p className="hr-eyebrow">HUMAN RESOURCES MANAGEMENT</p>
                        <h1>인적자원 관리</h1>
                        <p className="hr-muted">직원 정보 및 부서별 인원 현황을 관리합니다.</p>
                    </div>
                    <div className="hr-heading-actions">
                        {page === "list" ? (
                            <>
                                {currentUser?.role === "ADMIN" && (
                                    <button
                                        type="button"
                                        className="hr-btn hr-btn-account"
                                        onClick={() => navi("/hr/accounts")}
                                    >
                                        계정 관리
                                    </button>
                                )}
                                <button type="button" className="hr-btn hr-btn-primary" onClick={() => setPage("new")}>+ 직원 등록</button>
                            </>
                        ) : (
                            <button type="button" className="hr-btn hr-btn-ghost" onClick={() => setPage("list")}>← 직원 목록</button>
                        )}
                    </div>
                </header>

                {page === "list" && (
                    <>
                        <section className="hr-stats" aria-label="인원 통계">
                            <div className="hr-stat"><span>전체 직원</span><strong>{employees.length}<small>명</small></strong></div>
                            <div className="hr-stat"><span>재직 직원</span><strong>{employees.filter(e => e.status === "재직").length}<small>명</small></strong></div>
                            <div className="hr-stat"><span>휴직 직원</span><strong>{employees.filter(e => e.status === "휴직").length}<small>명</small></strong></div>
                            <div className="hr-stat"><span>퇴사 직원</span><strong>{employees.filter(e => e.status === "퇴사").length}<small>명</small></strong></div>
                        </section>
                        <section className="hr-panel hr-department-panel">
                            <div className="hr-section-title">
                                <div><p className="hr-eyebrow">DEPARTMENT OVERVIEW</p><h2>부서별 인원 현황</h2></div>
                                <span className="hr-subtle">총 {departments.length}개 부서</span>
                            </div>
                            {employees.length > 0 ? (
                                <div className="hr-department-grid">
                                    {departments.map(department => (
                                        <div
                                            className="hr-department-item"
                                            key={department.name}
                                        >
                                            <div className="hr-department-meta">
                                                <span>{department.name}</span>
                                                <strong>{department.count}명</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="hr-empty">직원이 없습니다.</p>
                            )}
                        </section>
                        <EmployeeList employees={employees} projects={projects} onView={showDetail} onNew={() => setPage("new")} />
                    </>
                )}

                {page === "new" && (
                    <EmployeeForm
                        key="new"
                        employees={employees}
                        onCancel={() => setPage("list")}
                        onSave={handleSave}
                    />
                )}
                {page === "edit" && selectedEmployee && (
                    <EmployeeForm
                        key={`edit-${selectedEmployee.id}`}
                        employee={selectedEmployee}
                        employees={employees}
                        onCancel={() => showDetail(selectedEmployee.id)}
                        onSave={handleSave}
                    />
                )}
                {page === "detail" && selectedEmployee && (
                    <EmployeeDetail
                        employee={selectedEmployee}
                        projects={projects}
                        onEdit={() => showEdit(selectedEmployee.id)}
                        onDelete={handleDelete}
                    />
                )}
                {((page === "edit" || page === "detail") && !selectedEmployee) && (
                    <section className="hr-panel hr-empty">
                        <h2>직원 정보를 찾을 수 없습니다.</h2>
                        <button className="hr-btn hr-btn-primary" type="button" onClick={() => setPage("list")}>목록으로 돌아가기</button>
                    </section>
                )}
            </main>
        </div>
    );
}
