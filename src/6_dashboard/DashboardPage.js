
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./Dashboard.css";

// 커뮤니티 페이지 연결
import CommunityPage from "./CommunityPage";
import CommunityWritePage from "./CommunityWritePage";
import CommunityDetailPage from "./CommunityDetailPage";

// 공지사항 페이지 연결
import NoticePage from "./NoticePage";
import NoticeWritePage from "./NoticeWritePage";
import NoticeDetailPage from "./NoticeDetailPage";


function DashboardPage() {

    // 페이지 이동 및 현재 주소 확인
    const navigate = useNavigate();

    // 주소가 /?page=notice-detail&id=15 라면
    // ?는 추가 정보의 시작, &는 다음 정보를 연결하는 표시
    const [searchParams] = useSearchParams();

    // 주소에서 page에 해당하는 값을 가져옴
    const page = searchParams.get("page");


    // 저장된 커뮤니티 게시글 불러오기
    // useState는 값을 기억하고 변경할 때 사용하는 기능
    // posts는 현재 게시글, setPosts는 게시글을 바꾸는 함수
    const [posts, setPosts] = useState(() => {

        // 브라우저에 저장된 communityPosts를 가져옴
        const saved = localStorage.getItem("communityPosts");

        // 저장된 데이터가 없으면 빈 배열 반환
        if (!saved) return [];

        try {
            // JSON.parse는 저장된 문자열을 다시 배열로 바꿈
            const data = JSON.parse(saved);

            // 배열이라면 data, 아니면 빈 배열 사용
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    });


    // 저장된 공지사항 불러오기
    // 커뮤니티와 별도로 noticePosts에 저장
    const [noticePosts, setNoticePosts] = useState(() => {
        const saved = localStorage.getItem("noticePosts");

        if (!saved) return [];

        try {
            const data = JSON.parse(saved);
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    });


    // 일반 공지만 골라내기
    // filter는 조건에 맞는 것만 가져오는 함수
    const normalNotices = noticePosts.filter(
        (post) => post.type === "normal"
    );

    // 마지막 3개를 가져와 순서를 반대로 바꿈
    // slice(-3): 뒤에서 3개
    // reverse(): 순서를 반대로
    const recentNotices = normalNotices.slice(-3).reverse();


    // 중요공지만 골라내기
    const importantNotices = noticePosts.filter(
        (post) => post.type === "important"
    );

    // 배열에서 마지막 중요공지 하나 가져오기
    // length는 배열 안에 들어 있는 데이터의 개수
    const importantNotice = importantNotices[importantNotices.length - 1];


    // 최근 커뮤니티 게시글 3개
    const recentPosts = posts.slice(-3).reverse();


    // page 값에 따라 보여줄 화면 결정

    // 커뮤니티 목록
    if (page === "community") {
        return <CommunityPage posts={posts} />;
    }

    // 커뮤니티 글쓰기
    if (page === "write") {
        return <CommunityWritePage posts={posts} setPosts={setPosts} />;
    }

    // 커뮤니티 상세
    if (page === "detail") {
        return (
            <CommunityDetailPage
                posts={posts}
                setPosts={setPosts}
                postId={searchParams.get("id")}
            />
        );
    }


    // 공지사항 목록
    // posts={noticePosts}는 자식 페이지에 목록을 전달하는 props
    if (page === "notice") {
        return <NoticePage posts={noticePosts} />;
    }

    // 공지사항 글쓰기
    if (page === "notice-write") {
        return (
            <NoticeWritePage
                posts={noticePosts}
                setPosts={setNoticePosts}
            />
        );
    }

    // 공지사항 상세
    // key는 다른 공지를 열 때 댓글 입력 상태가 새로 시작하도록 사용
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


    // 대시보드 화면
    return (
        <div className="dashboard">

            <h1>대시보드</h1>

            {/* 중요공지 */}
            <div className="dashboard-banner">
                <strong>NOTICE</strong>

                {/* 중요공지가 있으면 제목을, 없으면 안내문 표시 */}
                {importantNotice ? (
                    <Link
                        to={"/?page=notice-detail&id=" + importantNotice.id}
                        className="notice-banner-link"
                    >
                        {importantNotice.title}
                    </Link>
                ) : (
                    <span>등록된 중요공지가 없습니다.</span>
                )}
            </div>

            <div className="dashboard-grid">

                <div className="dashboard-left">

                    {/* 일반 공지사항 */}
                    <div className="dashboard-card">
                        <Link
                            to="/?page=notice"
                            className="dashboard-community-heading"
                        >
                            <h3>공지사항</h3>
                        </Link>

                        {/* 공지가 없을 때 */}
                        {recentNotices.length === 0 ? (
                            <p>등록된 공지사항이 없습니다.</p>
                        ) : (
                            // map은 배열을 하나씩 화면에 표시하는 함수
                            recentNotices.map((post) => (
                                <div className="dashboard-post" key={post.id}>
                                    <Link
                                        className="dashboard-post-link"
                                        to={"/?page=notice-detail&id=" + post.id}
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

                    {/* 기존 사내 커뮤니티 */}
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

                    {/* 기존 오늘의 일정 */}
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
