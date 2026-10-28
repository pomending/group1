import React, { useState } from "react";
import { useERP } from "../context/ERPContext";
import { getDeadlineStatus, getProjectStatus, isProjectDelayed } from "../utils/projectStatus";

function ProjectList(props) {

    const { projects, resetProjects } = useERP()

    const [sort, setSort] = useState('dueAsc')

    const sorted = (a, b) => {

        if (sort === 'dueAsc') {
            return a.dueDate.localeCompare(b.dueDate)
        }
        if (sort === 'dueDesc') {
            return b.dueDate.localeCompare(a.dueDate)
        }
        if (sort === 'recent') {
            return b.id - a.id
        }
        return 0

    }

    const getDeadlineClass = (project) => {
        const deadline = getDeadlineStatus(project);

        if (getProjectStatus(project) === '지연') {
            return 'pm-deadline-late';
        }

        if (deadline === '완료') {
            return 'pm-deadline-complete';
        }

        if (deadline === 'D-Day' || deadline.startsWith('D -')) {
            return 'pm-deadline-soon';
        }

        return 'pm-deadline-normal';
    };

    return (
        <div className="project-app">
            <div className="pm-shell">

                {/* 페이지 제목 */}
                <div className="pm-heading">
                    <div>
                        <div className="pm-eyebrow">
                            PROJECT MANAGEMENT
                        </div>
                        <h2>프로젝트 관리</h2>
                        <p>프로젝트 진행 현황을 한눈에 확인하세요.</p>
                    </div>

                    <div className="pm-heading-actions">
                        <button
                            type="button"
                            className="pm-reset-btn"
                            onClick={() => {
                                if (window.confirm("프로젝트 데이터를 초기 상태로 되돌리시겠습니까?")) {
                                    resetProjects();
                                }
                            }}
                        >
                            데이터 초기화
                        </button>

                        <button
                            className="pm-btn"
                            onClick={() => props.setPage('newproject')}
                        >
                            + 새 프로젝트
                        </button>
                    </div>
                </div>

                {/* 통계 */}
                <div className="pm-stats">
                    <div className="pm-stat">
                        <div className="pm-stat-label">전체 프로젝트</div>
                        <div className="pm-stat-value">{projects.length}</div>
                    </div>
                    <div className="pm-stat">
                        <div className="pm-stat-label">진행 중</div>
                        <div className="pm-stat-value">
                            {projects.filter(project => getProjectStatus(project) === '진행 중').length}
                        </div>
                    </div>
                    <div className="pm-stat">
                        <div className="pm-stat-label">지연</div>
                        <div className="pm-stat-value">
                            {projects.filter(project => isProjectDelayed(project)).length}
                        </div>
                    </div>
                </div>

                {/* 프로젝트 목록 */}
                <div className="pm-card">
                    <div className="pm-card-header">
                        <h3>프로젝트 목록</h3>
                        <span>총 {projects.length}개</span>
                    </div>

                    {/* 검색 및 상태 필터 */}
                    <div className="pm-filters">
                        <input
                            className="pm-search"
                            placeholder="프로젝트명 검색"
                            value={props.search}
                            onChange={(e) => { props.setSearch(e.target.value); }}
                        />
                        <select
                            className="pm-select"
                            value={sort}
                            onChange={(e) => { setSort(e.target.value) }}
                        >
                            <option value='dueAsc'>마감일 빠른 순</option>
                            <option value='dueDesc'>마감일 늦은 순</option>
                            <option value='recent'>최근 등록 순</option>
                        </select>
                        <select
                            className="pm-select"
                            value={props.searchstat}
                            onChange={(e) => { props.setSearchStat(e.target.value); }}
                        >
                            <option value="">전체 상태</option>
                            <option value="대기">대기</option>
                            <option value="진행 중">진행 중</option>
                            <option value="완료">완료</option>
                            <option value="지연">지연</option>
                        </select>
                    </div>

                    {/* 테이블 */}
                    <div className="pm-table-wrap">
                        <table className="project-list">
                            <thead>
                                <tr>
                                    <th>프로젝트 명</th>
                                    <th>상태</th>
                                    <th>진행률</th>
                                    <th>마감 안내</th>
                                    <th>상세</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.filter(project =>
                                    (props.searchstat === '' || props.searchstat === getProjectStatus(project)) &&
                                    project.name.toLowerCase().includes(props.search.toLowerCase())
                                ).sort(sorted).map(project => (
                                    <tr key={project.id}>
                                        <td>
                                            <div className="pm-project-name">{project.name}</div>
                                            <div className="pm-project-date">마감 {project.dueDate}</div>
                                        </td>
                                        <td>
                                            <span className={"pm-status pm-status-" + getProjectStatus(project).replaceAll(' ', '')}>
                                                {getProjectStatus(project)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="pm-progress">
                                                <div className="pm-progress-bar">
                                                    <div className="pm-progress-fill" style={{ width: '80%' }} />
                                                </div>
                                                <span className="pm-progress-text">80%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`pm-deadline ${getDeadlineClass(project)}`}>
                                                {getDeadlineStatus(project)}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="pm-view-btn" onClick={() => {
                                                props.setSelectedProjectId(project.id);
                                                props.setPage('detail');
                                            }}>
                                                보기
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProjectList;
