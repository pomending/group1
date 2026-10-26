
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./Dashboard.css";

// 커뮤니티 페이지 연결
import CommunityPage from "./CommunityPage";
import CommunityWritePage from "./CommunityWritePage";
import CommunityDetailPage from "./CommunityDetailPage";

function DashboardPage() {

    // 페이지 이동 및 현재 주소 확인
    const [searchParams] = useSearchParams();
    const page = searchParams.get("page");

    // 저장된 게시글 불러오기
    const [posts, setPosts] = useState(() => {
        const saved = localStorage.getItem("communityPosts");

        if (!saved) return [];

        try {
            const data = JSON.parse(saved);
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    });

    // 최근 게시글 3개 가져오기
    const recentPosts = posts.slice(-3).reverse();


    // 게시글 목록 페이지
    if (page === "community") {
        return <CommunityPage posts={posts} />;
    }

    // 글쓰기 페이지
    if (page === "write") {
        return <CommunityWritePage posts={posts} setPosts={setPosts} />;
    }

    // 게시글 상세 페이지
    if (page === "detail") {
        return (
            <CommunityDetailPage
                posts={posts}
                setPosts={setPosts}
                postId={searchParams.get("id")}
            />
        );
    }


    // 대시보드 화면
    return (
        <div className="dashboard">

            <h1>대시보드</h1>

            {/* 상단 공지 */}
            <div className="dashboard-banner">
                <strong>NOTICE</strong>
                <span>중요 공지사항 표시</span>
            </div>

            <div className="dashboard-grid">

                <div className="dashboard-left">

                    {/* 공지사항 */}
                    <div className="dashboard-card">
                        <h3>공지사항</h3>
                        <p>사내 정기회의 안내</p>
                        <p>프로젝트 관리 안내</p>
                        <p>신규 시스템 이용 안내</p>
                    </div>

                    {/* 사내 커뮤니티 */}
                    <div className="dashboard-card">
                    
                        <Link to="/?page=community"
                        className="dashboard-community-heading">
                            <h3>사내 커뮤니티</h3>
                        </Link>                 

                        {recentPosts.length === 0 ? (
                            <p>등록된 게시글이 없습니다.</p>
                        ) : (
                            recentPosts.map((post) => (
                                <div className="dashboard-post" key={post.id}>

                                    <Link
                                        className="dashboard-post-link"
                                        to={"/?page=detail&id=" + post.id}
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

                <div className="dashboard-right">

                    {/* 오늘의 일정 */}
                    <div className="dashboard-card schedule-card">
                        <h3>오늘의 일정</h3>
                        <p>오늘의 업무일정 표시</p>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default DashboardPage;
