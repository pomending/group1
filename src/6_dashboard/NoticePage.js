import React from "react";
import { Link, useNavigate } from "react-router-dom";

function NoticePage({ posts }) {

    const navi = useNavigate()

    return (
        <div className="community">

            <h1>공지사항</h1>
            <p>사내 공지사항을 확인하는 공간입니다.</p>

            <div className="community-board">

                <div className="community-top">
                    <h3>공지사항 목록</h3>

                    {/* 공지사항 글쓰기 이동 */}
                    <Link to="/?page=notice-write"
                        className="community-button">
                        글쓰기
                    </Link>
                </div>

                {/* 공지사항 목록 */}
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
                        {postMessage.map((posy, index) => (
                            <tr key={post.id}
                                onClick={() => navi("/?page=notice-detail&id=" + post.id)}
                                style={{ cursor: "pointer" }}>
                                <td>{index + 1}</td>
                                <td>
                                    {/* 조건이 참이면 중요공지, 거짓이면 일반공지 */}
                                    {post.type === "important" ? (
                                        <strong>중요공지</strong>
                                    ) : ("일반공지")}
                                </td>
                                <td>{post.title}</td>
                                <td>{post.writer}</td>
                                <td>{post.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {posts.length === 0 && (
                    <p className="community-empty">
                        등록된 공지사항이 없습니다.
                    </p>
                )}
            </div>

        </div>
    )

}

export default NoticePage