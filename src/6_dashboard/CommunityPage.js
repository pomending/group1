import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Community.css";

function CommunityPage({ posts }) {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);

    // 최신 글부터 15개씩 나누어 보여 줍니다.
    const sorted = [...posts].sort((a, b) => Number(b.id) - Number(a.id));
    const totalPages = Math.ceil(sorted.length / 15);
    const currentPage = Math.min(page, Math.max(totalPages, 1));
    const start = (currentPage - 1) * 15;
    const visible = sorted.slice(start, start + 15);

    return (
        <div className="community">
            <h1>사내 커뮤니티</h1>
            <p>직원들과 자유롭게 소통하는 공간입니다.</p>
            <div className="community-board">
                <div className="community-top">
                    <h3>게시글 목록</h3>
                    <Link to="/?page=write" className="community-button">글쓰기</Link>
                </div>
                <table>
                    <thead>
                        <tr><th>번호</th><th>제목</th><th>작성자</th><th>작성일</th></tr>
                    </thead>
                    <tbody>
                        {visible.map((post, index) => (
                            <tr
                                key={post.id}
                                onClick={() => navigate(`/?page=detail&id=${post.id}`)}
                                style={{ cursor: "pointer" }}>
                                <td>{sorted.length - start - index}</td>
                                <td>{post.title}</td>
                                <td>{post.writer}</td>
                                <td>{post.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <nav className="board-pagination" aria-label="게시글 페이지 이동">
                        <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>이전</button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                            <button
                                type="button"
                                key={number}
                                className={number === currentPage ? "active" : ""}
                                aria-current={number === currentPage ? "page" : undefined}
                                onClick={() => setPage(number)}
                            >{number}</button>
                        ))}
                        <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>다음</button>
                    </nav>
                )}
                {posts.length === 0 && <p className="community-empty">등록된 게시글이 없습니다.</p>}
            </div>
        </div>
    );
}

export default CommunityPage;
