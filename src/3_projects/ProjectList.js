import { useState } from "react";
import { useERP } from "../context/ERPContext";
import { getDeadlineStatus, getProjectProgress, getProjectStatus } from "../utils/projectUtils";

function ProjectList(props) {

    const { projects, tasks, quotations } = useERP()

    const [sort, setSort] = useState('dueAsc')
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 8;

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

    // 통계 카드와 목록 필터는 동일한 프로젝트 상태 계산 함수를 사용한다.
    const statusCounts = { "대기": 0, "진행 중": 0, "완료": 0, "지연": 0 };

    projects.forEach(project => {
        const status = getProjectStatus(project);
        if (Object.prototype.hasOwnProperty.call(statusCounts, status)) {
            statusCounts[status] += 1;
        }
    });

    const statusCards = [
        { label: "전체 프로젝트", filter: "", count: projects.length },
        { label: "대기", filter: "대기", count: statusCounts["대기"] },
        { label: "진행 중", filter: "진행 중", count: statusCounts["진행 중"] },
        { label: "완료", filter: "완료", count: statusCounts["완료"] },
        { label: "지연", filter: "지연", count: statusCounts["지연"] }
    ];

    const changeStatusFilter = (status) => {
        props.setSearchStat(status);
        setPage(1);
    };

    const pendingQuotations = quotations.filter(q =>
        q.status === "승인 완료" &&
        !projects.some(p => p.quotationId === q.id)
    );

    const pendingCount = pendingQuotations.length;

    const filteredProjects = projects
        .filter(project =>
            (props.searchstat === "" ||
                props.searchstat === getProjectStatus(project)) &&
            project.name.toLowerCase().includes(props.search.toLowerCase())
        )
        .sort(sorted);

    const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE);

    const currentPage = Math.min(page, Math.max(1, totalPages));

    const pagedProjects = filteredProjects.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    return (
        <div className="project-app pj-page">
            <div className="pm-shell pj-container">

                {/* 페이지 제목 */}
                <div className="pm-heading">
                    <div>
                        <div className="pm-eyebrow pj-eyebrow">
                            PROJECT MANAGEMENT
                        </div>
                        <h2>프로젝트 관리</h2>
                        <p>프로젝트 진행 현황을 한눈에 확인하세요.</p>
                    </div>

                    <div className="pm-heading-actions">
                        <button
                            className="pm-btn pj-btn pj-primary"
                            onClick={() => props.setPage('newproject')}
                        >
                            + 새 프로젝트
                        </button>
                    </div>
                </div>

                <h3 className="pm-pending-banner">
                    프로젝트 생성 대기 견적 {pendingCount}건
                </h3>

                {/* 통계 카드: 클릭하면 목록 상태 필터가 변경된다. */}
                <div className="pm-stats">
                    {statusCards.map(card => (
                        <button
                            key={card.filter || "all"}
                            type="button"
                            className={`pm-stat pm-stat-button pj-card ${props.searchstat === card.filter ? "pm-stat-active" : ""}`}
                            onClick={() => changeStatusFilter(card.filter)}
                            aria-pressed={props.searchstat === card.filter}
                        >
                            <div className="pm-stat-label">{card.label}</div>
                            <div className="pm-stat-value">
                                {card.count}
                                <span className="pm-stat-unit">개</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* 프로젝트 목록 */}
                <div className="pm-card pj-card">
                    <div className="pm-card-header">
                        <h3>프로젝트 목록</h3>
                        <span>
                            총 {projects.length}개
                            {(props.search || props.searchstat) &&
                                ` · 검색 결과 ${filteredProjects.length}개`}
                        </span>
                    </div>

                    {/* 검색 및 정렬 */}
                    <div className="pm-filters">
                        <input
                            className="pm-search"
                            placeholder="프로젝트명 검색"
                            value={props.search}
                            onChange={(e) => { props.setSearch(e.target.value); setPage(1); }}
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
                                {pagedProjects.map(project => (
                                    <tr key={project.id}>
                                        <td>
                                            <div className="pm-project-name">{project.name}</div>
                                            <div className="pm-project-date">마감 {project.dueDate}</div>
                                        </td>
                                        <td>
                                            <span className={"pm-status pj-badge pm-status-" + getProjectStatus(project).replaceAll(' ', '')}>
                                                {getProjectStatus(project)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="pm-progress">
                                                <div className="pm-progress-bar pj-progress-track">
                                                    <div className="pm-progress-fill pj-progress-fill" style={{ width: `${getProjectProgress(project, tasks)}%` }} />
                                                </div>
                                                <span className="pm-progress-text">{getProjectProgress(project, tasks)}%</span>
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
                        {totalPages > 1 && (
                            <div className="pm-pagination">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setPage(currentPage - 1)}
                                >
                                    이전
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .map(num => (
                                        <button
                                            key={num}
                                            className={currentPage === num ? "active" : ""}
                                            onClick={() => setPage(num)}
                                        >
                                            {num}
                                        </button>
                                    ))}

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setPage(currentPage + 1)}
                                >
                                    다음
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProjectList;
