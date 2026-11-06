import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import "./Community.css";

function NoticePage({ posts }) {
    const navigate = useNavigate();
    const { currentUser } = useERP();
    const [page, setPage] = useState(1);
    const canWrite = currentUser?.status === "활성" && ["ADMIN", "MANAGER"].includes(currentUser.role);

    // 공지는 최신순으로, 한 페이지에 15개씩 보여 줍니다.
    const sorted = [...posts].sort((a, b) => Number(b.id) - Number(a.id));
    const totalPages = Math.ceil(sorted.length / 15);
    const currentPage = Math.min(page, Math.max(totalPages, 1));
    const start = (currentPage - 1) * 15;
    const visible = sorted.slice(start, start + 15);

    return (
        <div className="community">
            <h1>공지사항</h1>
            <p>사내 공지사항을 확인하는 공간입니다.</p>
            <div className="community-board">
                <div className="community-top">
                    <h3>공지사항 목록</h3>
                    {canWrite && <Link to="/?page=notice-write" className="community-button">글쓰기</Link>}
                </div>
                <table>
                    <thead>
                        <tr><th>번호</th><th>구분</th><th>제목</th><th>작성자</th><th>작성일</th></tr>
                    </thead>
                    <tbody>
                        {visible.map((post, index) => (
                            <tr
                                key={post.id}
                                onClick={() => navigate(`/?page=notice-detail&id=${post.id}`)}
                                style={{ cursor: "pointer" }}>
                                <td>{sorted.length - start - index}</td>
                                <td>{post.type === "important" ? "중요공지" : "일반 공지"}</td>
                                <td>{post.title}</td>
                                <td>{post.writer}</td>
                                <td>{post.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <nav className="board-pagination" aria-label="공지사항 페이지 이동">
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
                {posts.length === 0 && <p className="community-empty">등록된 공지사항이 없습니다.</p>}
            </div>
        </div>
    );
}

export default NoticePage;
