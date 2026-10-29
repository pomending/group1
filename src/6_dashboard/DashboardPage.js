
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import "./Dashboard.css";
import DashboardToday from "./DashboardToday";

// 기존 3번 프로젝트 관리를 읽기만 합니다.
// 3번 폴더의 코드는 수정하지 않습니다.
import OriginalProjectPage from "../3_projects/ProjectPage";

import CommunityPage from "./CommunityPage";
import CommunityWritePage from "./CommunityWritePage";
import CommunityDetailPage from "./CommunityDetailPage";
import NoticePage from "./NoticePage";
import NoticeWritePage from "./NoticeWritePage";
import NoticeDetailPage from "./NoticeDetailPage";

const PROJECT_CACHE = "modu-dashboard-real-projects";
const PROJECT_CHANGED = "modu-dashboard-projects-changed";
const DETAIL_REQUEST = "modu-dashboard-detail-request";

let projectObserver = null;
let previousProjectFiber = null;
let projectPageWasVisible = false;
let restoringProject = false;
let openingDetail = false;


// 저장해 둔 실제 프로젝트 목록 읽기
function getProjects() {
    try {
        const value = localStorage.getItem(PROJECT_CACHE);
        const list = value === null ? [] : JSON.parse(value);

        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}


// 원본에서 확인한 프로젝트 목록 저장
function saveProjects(list) {
    if (!Array.isArray(list)) return;

    try {
        const next = JSON.stringify(list);

        if (localStorage.getItem(PROJECT_CACHE) === next) {
            return;
        }

        localStorage.setItem(PROJECT_CACHE, next);
        window.dispatchEvent(new Event(PROJECT_CHANGED));
    } catch {
        // 저장에 실패해도 다른 화면은 유지합니다.
    }
}


// React 컴포넌트가 화면에 연결한 상태 참조 찾기
function reactFiber(element) {
    for (
        let node = element;
        node;
        node = node.parentElement
    ) {
        const key = Object.keys(node).find(name =>
            name.startsWith("__reactFiber$")
        );

        if (key) {
            return node[key];
        }
    }

    return null;
}


// 기존 프로젝트 관리 컴포넌트 확인
function isProjectComponent(fiber) {
    const name =
        fiber?.type?.displayName ||
        fiber?.type?.name;

    return [
        "ProjectList",
        "ProjectForm",
        "ProjectDetail",
        "ProjectEdit"
    ].includes(name);
}


function isProjectPage(fiber) {
    return (
        fiber?.type?.displayName ||
        fiber?.type?.name
    ) === "ProjectPage";
}


// 동일한 프로젝트 관리 화면인지 확인
function sameMountedPage(a, b) {
    return !!a && !!b && (
        a === b ||
        a === b.alternate ||
        a.alternate === b
    );
}


// 실제 화면의 프로젝트 수와 이름을 비교
function viewScore(list, root) {
    if (!Array.isArray(list)) return -10000;

    let score = 0;

    const total = root.querySelector(".pm-stat-value");

    if (total) {
        const count = Number(total.textContent.trim());

        if (Number.isFinite(count)) {
            score += list.length === count ? 1000 : -1000;
        }
    }

    for (
        const nameNode of root.querySelectorAll(
            ".pm-project-name"
        )
    ) {
        const name = nameNode.textContent.trim();

        score += list.some(p => p.name === name)
            ? 20
            : -20;
    }

    const detailTitle = root
        .querySelector(".pd-heading h1")
        ?.textContent.trim();

    if (detailTitle) {
        score += list.some(p => p.name === detailTitle)
            ? 50
            : -50;
    }

    return score;
}


// 원본 프로젝트 관리가 사용하는 실제 목록 확인
function inspectProjectRoot(root) {
    let fiber = reactFiber(root);

    let projectPage = null;
    let projectChild = null;

    while (fiber) {
        if (isProjectComponent(fiber)) {
            projectChild = fiber;
        }

        if (isProjectPage(fiber)) {
            projectPage = fiber;
            break;
        }

        fiber = fiber.return;
    }

    if (!projectPage) return null;

    // 기존 컴포넌트가 전달받은 실제 프로젝트 배열
    const candidateLists = [
        projectChild,
        projectChild?.alternate
    ]
        .filter(Boolean)
        .map(f => f.memoizedProps?.projects)
        .filter(Array.isArray);

    const projectPageHooks = [
        projectPage,
        projectPage.alternate
    ]
        .filter(Boolean)
        .map(f => f.memoizedState)
        .filter(h => Array.isArray(h?.memoizedState));

    let list = candidateLists.sort(
        (a, b) =>
            viewScore(b, root) -
            viewScore(a, root)
    )[0];

    if (!list) {
        const hooks = projectPageHooks.sort(
            (a, b) =>
                viewScore(b.memoizedState, root) -
                viewScore(a.memoizedState, root)
        );

        list = hooks[0]?.memoizedState;
    }

    if (!Array.isArray(list)) return null;

    return {
        list,
        projectPage,
        projectPageHooks
    };
}


// 실제 프로젝트 관리 화면 찾기
function getActualProjectRoot() {
    return Array.from(
        document.querySelectorAll(
            ".project-app, .pf-page, .pd-page, .pe-page"
        )
    ).find(
        node => !node.closest(
            "[data-dashboard-project-seed]"
        )
    ) || null;
}


// 대시보드에서 선택한 프로젝트의 보기 버튼 클릭
function openRequestedDetail(root) {
    if (
        openingDetail ||
        !root.matches(".project-app")
    ) {
        return;
    }

    let pending;

    try {
        pending = JSON.parse(
            sessionStorage.getItem(DETAIL_REQUEST) || "null"
        );
    } catch {
        pending = null;
    }

    if (!pending) return;

    const list = getProjects();

    const project = list.find(
        p => String(p.id) === String(pending.id)
    );

    if (!project) {
        sessionStorage.removeItem(DETAIL_REQUEST);
        return;
    }

    const row = Array.from(
        root.querySelectorAll(
            ".project-list tbody tr"
        )
    ).find(
        tr =>
            tr.querySelector(".pm-project-name")
                ?.textContent.trim() === project.name
    );

    const button = row?.querySelector(".pm-view-btn");

    // 프로젝트 목록이 복원된 후 다시 찾습니다.
    if (!button) return;

    sessionStorage.removeItem(DETAIL_REQUEST);

    openingDetail = true;
    button.click();
    openingDetail = false;
}


// 프로젝트 관리의 등록·수정·삭제 감지
function scanProjectManagement() {
    const root = getActualProjectRoot();

    if (!root) {
        projectPageWasVisible = false;
        previousProjectFiber = null;
        restoringProject = false;
        return;
    }

    const actual = inspectProjectRoot(root);

    if (!actual) return;

    const {
        list,
        projectPage,
        projectPageHooks
    } = actual;

    const newlyMounted =
        !projectPageWasVisible ||
        !sameMountedPage(
            projectPage,
            previousProjectFiber
        );

    projectPageWasVisible = true;
    previousProjectFiber = projectPage;

    // 3번 프로젝트 관리가 다시 생성되면
    // 이전에 등록했던 실제 프로젝트 목록을 복원합니다.
    if (newlyMounted) {
        const saved = getProjects();

        const exists =
            localStorage.getItem(PROJECT_CACHE) !== null;

        if (
            exists &&
            JSON.stringify(saved) !== JSON.stringify(list)
        ) {
            const hook = projectPageHooks.find(
                h => typeof h.queue?.dispatch === "function"
            );

            if (hook && !restoringProject) {
                restoringProject = true;
                hook.queue.dispatch(saved);
                return;
            }
        }
    }

    restoringProject = false;

    // 새로운 프로젝트 등록 및 수정·삭제 결과 반영
    saveProjects(list);

    // 대시보드에서 특정 프로젝트를 선택한 경우
    openRequestedDetail(root);
}


// 다른 메뉴로 이동해도 실제 프로젝트 변경 감지 유지
function installProjectObserver() {
    if (
        typeof window === "undefined" ||
        typeof document === "undefined"
    ) {
        return;
    }

    if (!document.body || projectObserver) return;

    // 개발 중 이전 관찰자가 남았다면 정리
    if (window.__moduDashboardProjectObserver) {
        window.__moduDashboardProjectObserver.disconnect();
    }

    projectObserver = new MutationObserver(
        () => scanProjectManagement()
    );

    window.__moduDashboardProjectObserver =
        projectObserver;

    projectObserver.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true
    });

    scanProjectManagement();
}


// 사이드바의 기존 프로젝트 관리 화면으로 이동
function enterActualProjectPage(project = null) {
    if (project) {
        sessionStorage.setItem(
            DETAIL_REQUEST,
            JSON.stringify({ id: project.id })
        );
    } else {
        sessionStorage.removeItem(DETAIL_REQUEST);
    }

    const containers = document.querySelectorAll(
        "aside, nav, .sidebar, [class*='sidebar']"
    );

    for (const container of containers) {
        const controls = container.querySelectorAll(
            "a, button, [role='button'], [role='link']"
        );

        for (const control of controls) {
            if (control.closest(".dashboard")) continue;

            const text = control.textContent
                .replace(/\s+/g, " ")
                .trim();

            if (text === "프로젝트 관리") {
                control.click();
                return;
            }
        }

        // div 또는 li를 눌러 이동하는 사이드바 대응
        const labels = container.querySelectorAll(
            "span, div, li"
        );

        for (const label of labels) {
            if (
                label.children.length > 1 ||
                label.closest(".dashboard")
            ) {
                continue;
            }

            if (label.textContent.trim() === "프로젝트 관리") {
                label.click();
                return;
            }
        }
    }
}


// 공지사항과 커뮤니티 게시글 읽기
function readPosts(key) {
    try {
        const list = JSON.parse(
            localStorage.getItem(key) || "[]"
        );

        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}


function DashboardPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const page = searchParams.get("page");

    // 기존 커뮤니티 및 공지사항 데이터
    const [posts, setPosts] = useState(
        () => readPosts("communityPosts")
    );

    const [noticePosts, setNoticePosts] = useState(
        () => readPosts("noticePosts")
    );

    // 실제 프로젝트 관리에서 읽은 목록
    const [projects, setProjects] = useState(getProjects);

    const seedRef = useRef(null);

    // 아직 프로젝트 데이터를 읽은 적이 없다면
    // 3번 프로젝트 관리의 초기 목록을 직접 가져옵니다.
    const needInitialSeed =
        localStorage.getItem(PROJECT_CACHE) === null;


    // 프로젝트 변경 관찰 시작
    useEffect(() => {
        installProjectObserver();

        const refresh = () => {
            setProjects(getProjects());
        };

        const storage = event => {
            if (
                event.key === PROJECT_CACHE ||
                event.key === null
            ) {
                refresh();
            }
        };

        window.addEventListener(PROJECT_CHANGED, refresh);
        window.addEventListener("storage", storage);
        window.addEventListener("focus", refresh);

        return () => {
            window.removeEventListener(
                PROJECT_CHANGED,
                refresh
            );

            window.removeEventListener(
                "storage",
                storage
            );

            window.removeEventListener(
                "focus",
                refresh
            );
        };
    }, []);


    // 처음 실행할 때 기존 프로젝트 2개도 실제 원본에서 읽음
    useEffect(() => {
        if (
            !needInitialSeed ||
            !seedRef.current
        ) {
            return;
        }

        const originalList = seedRef.current.querySelector(
            ".project-app"
        );

        const actual = originalList &&
            inspectProjectRoot(originalList);

        if (actual) {
            saveProjects(actual.list);
        }
    }, [needInitialSeed]);


    // 대시보드 재진입 시 프로젝트 새로 불러오기
    useEffect(() => {
        setProjects(getProjects());
    }, [location.key]);


    // 실제 등록 번호가 높은 순으로 최신 3개만 표시
    const recentProjects = [...projects]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 3);


    // 일반 공지사항 최신 3개
    const recentNotices = [...noticePosts]
        .filter(post => post.type === "normal")
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 3);


    // 중요공지 최신 1개
    const importantNotice = [...noticePosts]
        .filter(post => post.type === "important")
        .sort((a, b) => Number(b.id) - Number(a.id))[0];


    // 커뮤니티 최신 3개
    const recentPosts = [...posts]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 3);


    // 기존 커뮤니티 화면
    if (page === "community") {
        return <CommunityPage posts={posts} />;
    }

    if (page === "write") {
        return (
            <CommunityWritePage
                posts={posts}
                setPosts={setPosts}
            />
        );
    }

    if (page === "detail") {
        return (
            <CommunityDetailPage
                posts={posts}
                setPosts={setPosts}
                postId={searchParams.get("id")}
            />
        );
    }


    // 기존 공지사항 화면
    if (page === "notice") {
        return <NoticePage posts={noticePosts} />;
    }

    if (page === "notice-write") {
        return (
            <NoticeWritePage
                posts={noticePosts}
                setPosts={setNoticePosts}
            />
        );
    }

    if (page === "notice-detail") {
        return (
            <NoticeDetailPage
                key={searchParams.get("id")}
                posts={noticePosts}
                setPosts={setNoticePosts}
                postId={searchParams.get("id")}
            />
        );
    }


    return (
        <div className="dashboard">

            {/* 최초 한 번만 실제 원본의 초기 목록을 읽음 */}
            {needInitialSeed && (
                <div
                    ref={seedRef}
                    data-dashboard-project-seed="true"
                    aria-hidden="true"
                    style={{ display: "none" }}
                >
                    <OriginalProjectPage />
                </div>
            )}

            <h1>대시보드</h1>


            {/* 중요공지 */}
            <div className="dashboard-banner">
                <strong>NOTICE</strong>

                {importantNotice ? (
                    <Link
                        to={
                            "/?page=notice-detail&id=" +
                            importantNotice.id
                        }
                        className="notice-banner-link"
                    >
                        {importantNotice.title}
                    </Link>
                ) : (
                    <span>등록된 중요공지가 없습니다.</span>
                )}
            </div>


            {/* 중요공지 바로 아래에 프로젝트 관리 표시 */}
            <div className="dashboard-card dashboard-project-card">

                {/* 카드 빈 부분은 프로젝트 관리 목록 */}
                <button
                    type="button"
                    className="dashboard-project-cover"
                    aria-label="프로젝트 관리 목록으로 이동"
                    onClick={() => enterActualProjectPage()}
                    style={{
                        border: 0,
                        background: "transparent",
                        cursor: "pointer"
                    }}
                />

                <h3>프로젝트 관리</h3>

                {recentProjects.length === 0 ? (
                    <p>등록된 프로젝트가 없습니다.</p>
                ) : (
                    recentProjects.map(project => (
                        <div
                            key={project.id}
                            className="dashboard-post"
                        >
                            {/* 개별 프로젝트의 실제 상세 보기 */}
                            <button
                                type="button"
                                className={
                                    "dashboard-post-link " +
                                    "dashboard-project-link"
                                }
                                onClick={() =>
                                    enterActualProjectPage(project)
                                }
                                style={{
                                    background: "transparent",
                                    border: 0,
                                    textAlign: "left",
                                    cursor: "pointer",
                                    font: "inherit",
                                    width: "100%"
                                }}
                            >
                                <span className="dashboard-post-title">
                                    {project.name}
                                </span>

                                <span className="dashboard-post-writer">
                                    {project.status}
                                </span>

                                <span className="dashboard-post-date">
                                    {project.dueDate || "미정"}
                                </span>
                            </button>
                        </div>
                    ))
                )}
            </div>


            {/* 공지사항 / 커뮤니티 / 오늘의 일정 */}
            <div className="dashboard-grid">

                <div className="dashboard-left">

                    {/* 공지사항 */}
                    <div className="dashboard-card">

                        <Link
                            to="/?page=notice"
                            className="dashboard-community-heading"
                        >
                            <h3>공지사항</h3>
                        </Link>

                        {recentNotices.length === 0 ? (
                            <p>등록된 공지사항이 없습니다.</p>
                        ) : (
                            recentNotices.map(post => (
                                <div
                                    className="dashboard-post"
                                    key={post.id}
                                >
                                    <Link
                                        className="dashboard-post-link"
                                        to={
                                            "/?page=notice-detail&id=" +
                                            post.id
                                        }
                                    >
                                        <span className="dashboard-post-title">
                                            {post.title}
                                        </span>

                                        <span className="dashboard-post-writer">
                                            {post.writer}
                                        </span>

                                        <span className="dashboard-post-date">
                                            {post.date}
                                        </span>
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>


                    {/* 사내 커뮤니티 */}
                    <div className="dashboard-card">

                        <Link
                            to="/?page=community"
                            className="dashboard-community-heading"
                        >
                            <h3>사내 커뮤니티</h3>
                        </Link>

                        {recentPosts.length === 0 ? (
                            <p>등록된 게시글이 없습니다.</p>
                        ) : (
                            recentPosts.map(post => (
                                <div
                                    className="dashboard-post"
                                    key={post.id}
                                >
                                    <Link
                                        className="dashboard-post-link"
                                        to={
                                            "/?page=detail&id=" +
                                            post.id
                                        }
                                    >
                                        <span className="dashboard-post-title">
                                            {post.title}
                                        </span>

                                        <span className="dashboard-post-writer">
                                            {post.writer}
                                        </span>

                                        <span className="dashboard-post-date">
                                            {post.date}
                                        </span>
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>

                </div>


                {/* 기존 오늘의 일정 */}
                <div className="dashboard-right">
                    <div className="dashboard-card schedule-card">

                        <Link
                            to="/schedule"
                            className="dashboard-community-heading"
                        >
                            <h3>오늘의 일정</h3>
                        </Link>

                        <DashboardToday />
                    </div>
                </div>

            </div>
        </div>
    );
}

export default DashboardPage;
