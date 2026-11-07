import React, { useState } from "react";
import { departmentNames, statusClass } from "../utils/employeeUtils";
import { formatEmployeeId } from "../utils/formatUtils";

const PAGE_SIZE = 8;

export default function EmployeeList({ employees, projects, onView, onNew }) {
    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("");
    const [status, setStatus] = useState("");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);

    const keyword = search.trim().toLowerCase();

    const filtered = employees.filter(employee => {
        const matchesSearch = [
            employee.name,
            employee.email,
            employee.phone,
            String(employee.id)
        ].some(value =>
            String(value ?? "").toLowerCase().includes(keyword)
        );

        return matchesSearch &&
            (!department || employee.department === department) &&
            (!status || employee.status === status);
    });

    filtered.sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name, "ko");
        if (sort === "oldest") return (a.hireDate || "").localeCompare(b.hireDate || "");
        if (sort === "recentId") return b.id - a.id;

        return (b.hireDate || "").localeCompare(a.hireDate || "") || b.id - a.id;
    });

    const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, maxPage);
    const visibleEmployees = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const changeSearch = (value) => { setSearch(value); setPage(1); };
    const changeDepartment = (value) => { setDepartment(value); setPage(1); };
    const changeStatus = (value) => { setStatus(value); setPage(1); };
    const changeSort = (value) => { setSort(value); setPage(1); };

    return (
        <section className="hr-panel hr-list-panel">

            <div className="hr-section-title hr-list-heading">

                <div>
                    <p className="hr-eyebrow">EMPLOYEE DIRECTORY</p>
                    <h2>직원 목록</h2>
                </div>
                <span className="hr-subtle">검색 결과 {filtered.length}명</span>

            </div>
            <div className="hr-filters">

                <input className="hr-input hr-search" aria-label="직원 검색" placeholder="이름, 이메일, 연락처 검색" value={search} onChange={e => changeSearch(e.target.value)} />
                <select className="hr-input hr-select" aria-label="부서 필터" value={department} onChange={e => changeDepartment(e.target.value)}>
                    <option value="">전체 부서</option>
                    {departmentNames.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="hr-input hr-select" aria-label="상태 필터" value={status} onChange={e => changeStatus(e.target.value)}>
                    <option value="">전체 상태</option>
                    <option value="재직">재직</option><option value="휴직">휴직</option><option value="퇴사">퇴사</option>
                </select>
                <select className="hr-input hr-select" aria-label="정렬" value={sort} onChange={e => changeSort(e.target.value)}>
                    <option value="newest">최근 입사 순</option><option value="oldest">오래된 입사 순</option>
                    <option value="name">이름 순</option><option value="recentId">최근 등록 순</option>
                </select>
            </div>

            <div className="hr-table-scroll">

                <table className="hr-table">
                    <thead>
                        <tr>
                            <th>사번</th>
                            <th>이름</th>
                            <th>부서 / 직급</th>
                            <th>연락처</th>
                            <th>입사일</th>
                            <th>상태</th>
                            <th>담당 프로젝트</th>
                            <th>상세</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleEmployees.map(employee => {
                            const assignedCount = projects.filter(project => Number(project.managerId) === Number(employee.id)).length;
                            return (
                                <tr key={employee.id}>
                                    <td className="hr-id">{formatEmployeeId(employee.id)}</td>
                                    <td><strong className="hr-employee-name">{employee.name}</strong><span className="hr-email">{employee.email}</span></td>
                                    <td>{employee.department}<span className="hr-table-sub">{employee.position}</span></td>
                                    <td>{employee.phone}</td>
                                    <td>{employee.hireDate || "-"}</td>
                                    <td><span className={`hr-status hr-status-${statusClass(employee.status)}`}>{employee.status}</span></td>
                                    <td>{assignedCount}건</td>
                                    <td><button type="button" className="hr-link-button" onClick={() => onView(employee.id)}>상세 보기</button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!filtered.length && (
                    <div className="hr-empty">
                        <p>검색 결과가 없습니다.</p>
                        {employees.length === 0 && <button type="button" className="hr-btn hr-btn-primary" onClick={onNew}>첫 직원 등록</button>}
                    </div>
                )}
            </div>
            <div className="hr-pagination">
                <span>{filtered.length ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)}` : "0"} / {filtered.length}명</span>
                <div>
                    <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>이전</button>
                    <span>{currentPage} / {maxPage}</span>
                    <button type="button" disabled={currentPage === maxPage} onClick={() => setPage(currentPage + 1)}>다음</button>
                </div>
            </div>
        </section>
    );
}
