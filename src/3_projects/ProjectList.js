import React from "react";

function ProjectList(props) {
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

                    <button className="pm-btn" onClick={()=>{props.setPage('newproject')}}>
                        + 새 프로젝트
                    </button>
                </div>

                {/* 통계 */}
                <div className="pm-stats">

                    <div className="pm-stat">
                        <div className="pm-stat-label">
                            전체 프로젝트
                        </div>
                        <div className="pm-stat-value">
                            {props.projects.length}
                        </div>
                    </div>

                    <div className="pm-stat">
                        <div className="pm-stat-label">
                            진행 중
                        </div>
                        <div className="pm-stat-value">
                            {props.projects.filter((project) =>
                                project.status === '진행 중'
                            ).length}
                        </div>
                    </div>

                    <div className="pm-stat">
                        <div className="pm-stat-label">
                            지연
                        </div>
                        <div className="pm-stat-value">
                            {props.projects.filter((project) =>
                                project.status === '지연'
                            ).length}
                        </div>
                    </div>

                </div>

                {/* 프로젝트 목록 */}
                <div className="pm-card">

                    <div className="pm-card-header">
                        <h3>프로젝트 목록</h3>
                        <span>총 {props.projects.length}개</span>
                    </div>

                    {/* 검색 및 상태 필터 */}
                    <div className="pm-filters">
                        <input
                            className="pm-search"
                            placeholder="프로젝트명, 고객사, 담당자 검색"
                            value={props.search}
                            onChange={(e) => {
                                props.setSearch(e.target.value);
                            }}
                        />

                        <select
                            className="pm-select"
                            value={props.searchstat}
                            onChange={(e) => {
                                props.setSearchStat(e.target.value);
                            }}
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
                                    <th>상세</th>
                                </tr>
                            </thead>

                            <tbody>
                                {
                                    props.projects.filter((project) =>
                                        (props.searchstat === '' ||
                                            props.searchstat === project.status) &&
                                        (project.name.toLowerCase().includes(props.search.toLowerCase()))

                                    ).map((project) => (
                                        <tr key={project.id}>
                                            <td>
                                                <div className="pm-project-name">
                                                    {project.name}
                                                </div>
                                                <div className="pm-project-date">
                                                    마감 {project.dueDate}
                                                </div>
                                            </td>

                                            <td>
                                                <span className={
                                                    "pm-status pm-status-" +
                                                    project.status.replaceAll(' ', '')
                                                }>
                                                    {project.status}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="pm-progress">
                                                    <div className="pm-progress-bar">
                                                        <div
                                                            className="pm-progress-fill"
                                                            style={{ width: '80%' }}
                                                        />
                                                    </div>
                                                    <span className="pm-progress-text">
                                                        80%
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <button className="pm-view-btn" onClick={(e)=>{props.setPage('detail')}}>
                                                    보기
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default ProjectList