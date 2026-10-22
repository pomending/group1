
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Community.css";

function CommunityPage({ posts }) {

    const navi = useNavigate()

    return (
        <div className="community">

            <h1>사내 커뮤니티</h1>
            <p>직원들과 자유롭게 소통하는 공간입니다.</p>

            <div className="community-board">

                <div className="community-top">
                    <h3>게시글 목록</h3>

                    {/* 글쓰기 페이지 이동 */}
                    <Link to="/?page=write" className="community-button">
                        글쓰기
                    </Link>
                </div>

                {/* 게시글 목록 */}
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
                        {posts.map((post, index) => (
                            <tr key={post.id}
                                onClick={() => navi("/?page=detail&id=" + post.id)}
                                style={{ cursor: "pointer" }}>

                                <td>{index + 1}</td>
                                <td>{post.title} </td>
                                <td>{post.writer}</td>
                                <td>{post.date}</td>

                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* 등록된 게시글이 없을 때 */}
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
