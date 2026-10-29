
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./Dashboard.css";
import DashboardToday from "./DashboardToday";

// 프로젝트 관리와 동일한 Context에서 실시간 목록을 읽습니다.
import { useERP } from "../context/ERPContext";
import { getProjectStatus } from "../utils/projectStatus";

import CommunityPage from "./CommunityPage";
import CommunityWritePage from "./CommunityWritePage";
import CommunityDetailPage from "./CommunityDetailPage";
import NoticePage from "./NoticePage";
import NoticeWritePage from "./NoticeWritePage";
import NoticeDetailPage from "./NoticeDetailPage";

// 프로젝트의 실제 마감일과 오늘 날짜의 차이를 그대로 표시합니다.
// 최대 일수 제한 없이 D-4, D-20, D-100 등 모든 기간을 계산합니다.
// 남은 기간이 3일 이하일 때만 글자색을 강조합니다.
function getRemainingDays(project) {
    if (getProjectStatus(project) === "완료" || project.completedDate) {
        return { label: "", urgent: false };
    }

    // 원래 프로젝트 관리에 저장된 dueDate를 사용합니다.
    const dueDateText = String(project.dueDate || "").trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(dueDateText);
    if (!match) return { label: "마감 미정", urgent: false };

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const dueDay = Date.UTC(year, month, day);

    // 실제로 존재하지 않는 날짜는 계산하지 않습니다.
    const validDate = new Date(dueDay);
    if (
        validDate.getUTCFullYear() !== year ||
        validDate.getUTCMonth() !== month ||
        validDate.getUTCDate() !== day
    ) {
        return { label: "마감 미정", urgent: false };
    }

    // 오늘 날짜는 사용자의 브라우저 현지 날짜를 기준으로 합니다.
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

    // 저장된 마감일 - 오늘 : 중간 날짜를 생략하거나 10일로 제한하지 않습니다.
    const daysLeft = (dueDay - today) / (24 * 60 * 60 * 1000);

    if (daysLeft > 0) {
        return { label: `D-${daysLeft}`, urgent: daysLeft <= 3 };
    }
    if (daysLeft === 0) {
        return { label: "D-Day", urgent: true };
    }
    return { label: `D+${Math.abs(daysLeft)}`, urgent: true };
}

// 기존 사이드바 메뉴를 통해 실제 프로젝트 관리로 이동합니다.
// 상세 클릭 시에는 원본 프로젝트 목록에 있는 '보기' 버튼을 실행합니다.
// 데이터 연동과 무관한 화면 이동 보조 기능이며 3번 파일을 수정하지 않습니다.
function enterActualProjectPage(project = null) {
    let detailObserver = null;
    let detailTimeout = null;

    const stopObserving = () => {
        if (detailObserver) detailObserver.disconnect();
        if (detailTimeout !== null) clearTimeout(detailTimeout);
    };

    const openDetail = () => {
        if (!project) return false;
        const rows = document.querySelectorAll(".project-list tbody tr");
        const row = Array.from(rows).find((item) =>
            item.querySelector(".pm-project-name")?.textContent.trim() === project.name
        );
        const viewButton = row?.querySelector(".pm-view-btn");
        if (!viewButton) return false;
        stopObserving();
        viewButton.click();
        return true;
    };

    // 화면이 바뀐 다음에 원본 프로젝트 행이 생성되므로 그때 상세 열기
    if (project) {
        detailObserver = new MutationObserver(openDetail);
        detailObserver.observe(document.body, { childList: true, subtree: true });
        detailTimeout = setTimeout(stopObserving, 6000);
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
            if (control.textContent.replace(/\s+/g, " ").trim() === "프로젝트 관리") {
                control.click();
                return;
            }
        }
        const labels = container.querySelectorAll("span, div, li");
        for (const label of labels) {
            if (label.children.length > 1 || label.closest(".dashboard")) continue;
            if (label.textContent.trim() === "프로젝트 관리") {
                label.click();
                return;
            }
        }
    }
    // 사이드바가 실제로 렌더링된 환경에서만 기존 메뉴를 사용합니다.
    // 확인되지 않은 라우터 경로를 임의로 만들어 이동하지 않습니다.
    stopObserving();
}

// 기존 공지사항과 커뮤니티 저장 방식은 변경하지 않습니다.
function readPosts(key) {
    try {
        const list = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function DashboardPage() {
    const [searchParams] = useSearchParams();

    // 3번 프로젝트 관리의 최신 데이터: 등록·수정·삭제 즉시 반영
    const { projects } = useERP();

    const page = searchParams.get("page");

    // 기존 커뮤니티 및 공지사항 데이터
    const [posts, setPosts] = useState(
        () => readPosts("communityPosts")
    );

    const [noticePosts, setNoticePosts] = useState(
        () => readPosts("noticePosts")
    );

    // 최신으로 등록된 프로젝트 최대 3개만 표시합니다.
    const recentProjects = [...projects]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 3);


    // 일반 공지사항 최신 5개
    const recentNotices = [...noticePosts]
        .filter(post => post.type === "normal")
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 5);


    // 중요공지 최신 1개
    const importantNotice = [...noticePosts]
        .filter(post => post.type === "important")
        .sort((a, b) => Number(b.id) - Number(a.id))[0];


    // 커뮤니티 최신 5개
    const recentPosts = [...posts]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 5);


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
                                    {getProjectStatus(project)}
                                </span>

                                <span
                                    className="dashboard-post-date"
                                    style={getRemainingDays(project).urgent ? {
                                        color: "#c0392b",
                                        fontWeight: 700
                                    } : undefined}
                                >
                                    {getRemainingDays(project).label}
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
