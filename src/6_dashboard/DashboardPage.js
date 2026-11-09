import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import { getProjectStatus } from "../utils/projectUtils";
import DashboardToday from "./DashboardToday";
import CommunityPage from "./CommunityPage";
import CommunityWritePage from "./CommunityWritePage";
import CommunityDetailPage from "./CommunityDetailPage";
import NoticePage from "./NoticePage";
import NoticeWritePage from "./NoticeWritePage";
import NoticeDetailPage from "./NoticeDetailPage";
import MyPage from "./MyPage";
import "./Dashboard.css";

// 저장된 게시글이 없거나 저장 형식이 잘못되었으면 빈 목록을 사용합니다.
function loadPosts(key) {
    try {
        const saved = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

// 프로젝트의 남은 날짜와 긴급 표시 여부를 계산합니다.
function getRemainingDays(project) {
    const date = String(project.dueDate || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    if (!date) return { label: "마감 미정", urgent: false };

    const year = Number(date[1]);
    const month = Number(date[2]) - 1;
    const day = Number(date[3]);
    const deadline = Date.UTC(year, month, day);
    const checkDate = new Date(deadline);

    // 2026-02-30과 같은 잘못된 날짜는 표시하지 않습니다.
    if (checkDate.getUTCFullYear() !== year ||
        checkDate.getUTCMonth() !== month ||
        checkDate.getUTCDate() !== day) {
        return { label: "마감 미정", urgent: false };
    }

    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((deadline - today) / 86400000);

    if (days > 0) return { label: `D-${days}`, urgent: days <= 3 };
    if (days === 0) return { label: "D-Day", urgent: true };
    return { label: `D+${Math.abs(days)}`, urgent: true };
}

function DashboardPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { projects } = useERP();
    const page = searchParams.get("page");
    const postId = searchParams.get("id");

    // 게시판 목록은 글을 작성하거나 수정하면 바로 갱신됩니다.
    const [posts, setPosts] = useState(() => loadPosts("communityPosts"));
    const [noticePosts, setNoticePosts] = useState(() => loadPosts("noticePosts"));

    // 메인 화면에 보여 줄 최근 항목을 정리합니다.
    const recentProjects = [...projects]
        .filter(project => getProjectStatus(project) !== "완료" && !project.completedDate)
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 4);

    const recentNotices = [...noticePosts]
        .filter(post => post.type === "normal")
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 6);

    const importantNotice = [...noticePosts]
        .filter(post => post.type === "important")
        .sort((a, b) => Number(b.id) - Number(a.id))[0];

    const recentPosts = [...posts]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 6);

    // 주소의 page 값에 따라 기존 게시판 또는 마이페이지를 보여 줍니다.
    if (page === "community") return <CommunityPage posts={posts} />;
    if (page === "write") {
        return <CommunityWritePage posts={posts} setPosts={setPosts} />;
    }
    if (page === "detail") {
        return (
            <CommunityDetailPage
                key={postId}
                posts={posts}
                setPosts={setPosts}
                postId={postId} />
        );
    }

    if (page === "notice") return <NoticePage posts={noticePosts} />;
    if (page === "notice-write") {
        return <NoticeWritePage posts={noticePosts} setPosts={setNoticePosts} />;
    }
    if (page === "notice-detail") {
        return (
            <NoticeDetailPage
                key={postId}
                posts={noticePosts}
                setPosts={setNoticePosts}
                postId={postId} />
        );
    }
    if (page === "mypage") return <MyPage />;

    return (
        <div className="dashboard">
            <h1>대시보드</h1>

            {/* 중요공지: 최신 1건 */}
            <div className="dashboard-banner">
                <strong>NOTICE</strong>
                {importantNotice ? (
                    <Link
                        to={`/?page=notice-detail&id=${importantNotice.id}`}
                        className="notice-banner-link">
                        {importantNotice.title}
                    </Link>
                ) : (
                    <span>등록된 중요공지가 없습니다.</span>
                )}
            </div>

            {/* 프로젝트: 완료되지 않은 최근 4건 */}
            <div className="dashboard-card dashboard-project-card">
                <Link
                    to="/projects"
                    className="dashboard-project-cover"
                    aria-label="프로젝트 관리 목록으로 이동" />
                <h3>프로젝트 관리</h3>
                {recentProjects.length === 0 ? (
                    <p>등록된 프로젝트가 없습니다.</p>
                ) : (
                    recentProjects.map(project => {
                        const remaining = getRemainingDays(project);
                        return (
                            <div className="dashboard-post" key={project.id}>
                                {/* 이름이 같아도 정확한 프로젝트 ID로 상세 화면을 엽니다. */}
                                <button
                                    type="button"
                                    className="dashboard-post-link dashboard-project-link"
                                    onClick={() => navigate("/projects", { state: { openProjectId: project.id } })}
                                    style={{
                                        background: "transparent",
                                        border: 0,
                                        textAlign: "left",
                                        cursor: "pointer",
                                        font: "inherit",
                                        width: "100%"
                                    }}>
                                    <span className="dashboard-post-title">{project.name}</span>
                                    <span className="dashboard-post-writer">{getProjectStatus(project)}</span>
                                    <span
                                        className="dashboard-post-date"
                                        style={remaining.urgent ? { color: "#c0392b", fontWeight: 700 } : undefined}>
                                        {remaining.label}
                                    </span>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-left">
                    {/* 공지사항: 최신 일반 공지 6건 */}
                    <div className="dashboard-card">
                        <Link to="/?page=notice" className="dashboard-community-heading">
                            <h3>공지사항</h3>
                        </Link>
                        {recentNotices.length === 0 ? (
                            <p>등록된 공지사항이 없습니다.</p>
                        ) : (
                            recentNotices.map(post => (
                                <div className="dashboard-post" key={post.id}>
                                    <Link
                                        to={`/?page=notice-detail&id=${post.id}`}
                                        className="dashboard-post-link">
                                        <span className="dashboard-post-title">{post.title}</span>
                                        <span className="dashboard-post-writer">{post.writer}</span>
                                        <span className="dashboard-post-date">{post.date}</span>
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 사내 커뮤니티: 최신 게시글 6건 */}
                    <div className="dashboard-card">
                        <Link to="/?page=community" className="dashboard-community-heading">
                            <h3>사내 커뮤니티</h3>
                        </Link>
                        {recentPosts.length === 0 ? (
                            <p>등록된 게시글이 없습니다.</p>
                        ) : (
                            recentPosts.map(post => (
                                <div className="dashboard-post" key={post.id}>
                                    <Link
                                        to={`/?page=detail&id=${post.id}`}
                                        className="dashboard-post-link">
                                        <span className="dashboard-post-title">{post.title}</span>
                                        <span className="dashboard-post-writer">{post.writer}</span>
                                        <span className="dashboard-post-date">{post.date}</span>
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 오늘의 일정 */}
                <div className="dashboard-right">
                    <div className="dashboard-card schedule-card">
                        <Link to="/schedule" className="dashboard-community-heading">
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
