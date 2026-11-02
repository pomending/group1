import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Community.css";

// 공지사항 목록
function NoticePage({ posts }) {

    // 페이지 이동
    const navigate = useNavigate();
    const [page, setPage] = useState(1);

    // 최신순 정렬
    const recentNotices = [...posts].sort(
        (a, b) => Number(b.id) - Number(a.id)
    );

    // 15개 페이지 분할
    const pageSize = 15;
    const totalPages = Math.ceil(recentNotices.length / pageSize);
    const currentPage = Math.min(page, Math.max(1, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const visibleNotices = recentNotices.slice(startIndex, startIndex + pageSize);

    return (
        <div className="community">

            <h1>공지사항</h1>
            <p>사내 공지사항을 확인하는 공간입니다.</p>

            <div className="community-board">

                <div className="community-top">
                    <h3>공지사항 목록</h3>

                    {/* 글쓰기 이동 */}
                    <Link to="/?page=notice-write" className="community-button">
                        글쓰기
                    </Link>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>번호</th>
                            <th>구분</th>
                            <th>제목</th>
                            <th>작성자</th>
                            <th>작성일</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* 공지사항 행 */}
                        {visibleNotices.map((notice, index) =>
                            <tr
                                key={notice.id}
                                onClick={() => navigate("/?page=notice-detail&id=" + notice.id)}
                                style={{ cursor: "pointer" }}
                            >
                                <td>{recentNotices.length - startIndex - index}</td>
                                <td>
                                    {notice.type === "important" ? "중요공지" : "일반 공지"}
                                </td>
                                <td>{notice.title}</td>
                                <td>{notice.writer}</td>
                                <td>{notice.date}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* 페이지 이동 */}
                {totalPages > 1 && (
                    <nav className="board-pagination" aria-label="공지사항 페이지 이동">
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
                                onClick={() => setPage(number)}
                            >
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
                    <p className="community-empty">등록된 공지사항이 없습니다.</p>
                )}
            </div>
        </div>
    );
}

export default NoticePage;
