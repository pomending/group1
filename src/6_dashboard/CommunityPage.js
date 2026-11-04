import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Community.css";

function CommunityPage({ posts }) {

    const navi = useNavigate();
    const [page, setPage] = useState(1);

    // 최신순 정렬
    const recentPosts = [...posts].sort(
        (a, b) => Number(b.id) - Number(a.id)
    );

    // 15개 페이지 분할
    const pageSize = 15;
    const totalPages = Math.ceil(recentPosts.length / pageSize);
    const currentPage = Math.min(page, Math.max(1, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const visiblePosts = recentPosts.slice(startIndex, startIndex + pageSize);
    return (
        <div className="community">
            <h1>사내 커뮤니티</h1>
            <p>직원들과 자유롭게 소통하는 공간입니다.</p>
            <div className="community-board">
                <div className="community-top">
                    <h3>게시글 목록</h3>
                    {/* 글쓰기 이동 */}
                    <Link to="/?page=write" className="community-button">
                        글쓰기
                    </Link>
                </div>
                {/* 게시글 표 */}
                <table>
                    <thead>
                        <tr>
                            <th>번호</th>
                            <th>제목</th>
                            <th>작성자</th>
                            <th>작성일</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visiblePosts.map((post, index) => (
                            <tr key={post.id}
                                onClick={() => navi("/?page=detail&id=" + post.id)}
                                style={{ cursor: "pointer" }}>
                                <td>{recentPosts.length - startIndex - index}</td>
                                <td>{post.title} </td>
                                <td>{post.writer}</td>
                                <td>{post.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* 페이지 이동 */}
                {totalPages > 1 && (
                    <nav className="board-pagination" aria-label="게시글 페이지 이동">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setPage(currentPage - 1)}
                        >이전</button>
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map(number => (
                            <button
                                type="button"
                                key={number}
                                className={number === currentPage ? "active" : ""}
                                aria-current={number === currentPage ? "page" : undefined}
                                onClick={() => setPage(number)}>
                                {number}
                            </button>
                        ))}
                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setPage(currentPage + 1)}
                        >다음</button>
                    </nav>
                )}
                {/* 빈 목록 */}
                {posts.length === 0 && (
                    <p className="community-empty">
                        등록된 게시글이 없습니다.
                    </p>
                )}
            </div>
        </div>
    );
}

export default CommunityPage;
