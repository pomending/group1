
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Community.css";


// 공지사항 목록 페이지
function NoticePage({ posts }) {

    // 다른 페이지로 이동할 때 사용하는 함수
    const navigate = useNavigate();

    return (
        <div className="community">

            <h1>공지사항</h1>
            <p>사내 공지사항을 확인하는 공간입니다.</p>

            <div className="community-board">

                <div className="community-top">
                    <h3>공지사항 목록</h3>

                    {/* 글쓰기 페이지로 이동 */}
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
                        {/* notice는 목록에서 현재 가져온 공지사항 하나 */}
                        {posts.map((notice, index) =>
                            <tr
                                key={notice.id}
                                onClick={() => navigate("/?page=notice-detail&id=" + notice.id)}
                                style={{ cursor: "pointer" }}
                            >
                                <td>{index + 1}</td>
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

                {/* 등록된 공지가 없을 때만 보임 */}
                {posts.length === 0 && (
                    <p className="community-empty">등록된 공지사항이 없습니다.</p>
                )}
            </div>
        </div>
    );
}

export default NoticePage;
