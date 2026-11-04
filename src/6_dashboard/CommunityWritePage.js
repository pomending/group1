
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CommunityWrite.css";
import { getBoardUser } from "./MyPage";

function CommunityWritePage({ posts, setPosts }) {

    const navigate = useNavigate();

    // 입력 상태
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    // 게시글 등록
    const addPost = () => {
        const currentUser = getBoardUser();
        if (!currentUser) {
            alert("직원 정보를 찾을 수 없습니다. 마이페이지에서 이메일을 확인하세요.");
            return;
        }

        // 필수 입력 검사
        if (!title.trim() || !content.trim()) {
            alert("제목과 내용을 모두 입력하세요.");
            return;
        }

        // 신규 게시글
        const newPost = {
            id: Date.now(),
            title: title.trim(),
            writer: currentUser.name,
            authorEmail: currentUser.email,
            authorEmployeeId: currentUser.employeeId,
            content: content.trim(),
            date: new Date().toLocaleDateString("ko-KR")
        };

        // 게시글 목록 갱신
        const newPosts = [...posts, newPost];

        // 상태·로컬 저장
        setPosts(newPosts);
        localStorage.setItem("communityPosts", JSON.stringify(newPosts));

        // 목록 이동
        navigate("/?page=community");
    };

    return (
        <div className="community">

            <Link to="/?page=community" className="community-back">
                ← 게시글 목록으로
            </Link>

            <div className="community-board">

                <h1>글쓰기</h1>

                <div className="community-write">

                    {/* 제목 */}
                    <label>제목</label>
                    <input
                        type="text"
                        placeholder="제목을 입력하세요."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    {/* 내용 */}
                    <label>내용</label>
                    <textarea
                        placeholder="내용을 입력하세요."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    {/* 취소·등록 버튼 */}
                    <div className="community-actions">

                        <Link
                            to="/?page=community"
                            className="community-cancel"
                        >
                            취소
                        </Link>

                        <button
                            className="community-button"
                            onClick={addPost}
                        >
                            등록하기
                        </button>

                    </div>

                </div>
            </div>
        </div>
    );
}

export default CommunityWritePage;
