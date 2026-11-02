import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./Dashboard.css";
import DashboardToday from "./DashboardToday";

// 프로젝트 데이터
import { useERP } from "../context/ERPContext";
import { getProjectStatus } from "../utils/projectStatus";

import CommunityPage from "./CommunityPage";
import CommunityWritePage from "./CommunityWritePage";
import CommunityDetailPage from "./CommunityDetailPage";
import NoticePage from "./NoticePage";
import NoticeWritePage from "./NoticeWritePage";
import NoticeDetailPage from "./NoticeDetailPage";

// 마감일 · D-Day · 긴급 표시
function getRemainingDays(project) {
    if (getProjectStatus(project) === "완료" || project.completedDate) {
        return { label: "", urgent: false };
    }

    // 프로젝트 마감일
    const dueDateText = String(project.dueDate || "").trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(dueDateText);
    if (!match) return { label: "마감 미정", urgent: false };

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const dueDay = Date.UTC(year, month, day);

    // 날짜 유효성
    const validDate = new Date(dueDay);
    if (
        validDate.getUTCFullYear() !== year ||
        validDate.getUTCMonth() !== month ||
        validDate.getUTCDate() !== day
    ) {
        return { label: "마감 미정", urgent: false };
    }

    // 현지 날짜
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

    // 남은 일수
    const daysLeft = (dueDay - today) / (24 * 60 * 60 * 1000);

    if (daysLeft > 0) {
        return { label: `D-${daysLeft}`, urgent: daysLeft <= 3 };
    }
    if (daysLeft === 0) {
        return { label: "D-Day", urgent: true };
    }
    return { label: `D+${Math.abs(daysLeft)}`, urgent: true };
}

// 프로젝트 목록·상세 이동
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

    // 상세 화면 감시
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
    // 사이드바 탐색 · 기존 경로
    stopObserving();
}

// 게시판 로컬 저장
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

    // 프로젝트 상태
    const { projects } = useERP();

    const page = searchParams.get("page");

    // 게시판 상태
    const [posts, setPosts] = useState(
        () => readPosts("communityPosts")
    );

    const [noticePosts, setNoticePosts] = useState(
        () => readPosts("noticePosts")
    );

    // 미완료 프로젝트 · 최신 3개
    const recentProjects = [...projects]
        .filter(project => getProjectStatus(project) !== "완료")
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 3);

    // 일반 공지 · 최신 6개
    const recentNotices = [...noticePosts]
        .filter(post => post.type === "normal")
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 6);

    // 중요공지 · 최신 1개
    const importantNotice = [...noticePosts]
        .filter(post => post.type === "important")
        .sort((a, b) => Number(b.id) - Number(a.id))[0];

    // 커뮤니티 · 최신 6개
    const recentPosts = [...posts]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 6);

    // 커뮤니티 화면
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
                key={searchParams.get("id")}
                posts={posts}
                setPosts={setPosts}
                postId={searchParams.get("id")}
            />
        );
    }

    // 공지사항 화면
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

            {/* 프로젝트 관리 카드 */}
            <div className="dashboard-card dashboard-project-card">

                {/* 프로젝트 목록 이동 */}
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
                            {/* 프로젝트 상세 이동 */}
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

            {/* 게시판·일정 배치 */}
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

                {/* 오늘의 일정 */}
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
