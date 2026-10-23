
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CommunityWrite.css";

function CommunityWritePage({ posts, setPosts }) {

    const navigate = useNavigate();

    // 입력한 제목, 작성자, 내용
    const [title, setTitle] = useState("");
    const [writer, setWriter] = useState("");
    const [content, setContent] = useState("");


    // 게시글 등록
    const addPost = () => {

        // 빈칸 검사
        if (!title.trim() || !writer.trim() || !content.trim()) {
            alert("제목, 작성자, 내용을 모두 입력하세요.");
            return;
        }

        // 새 게시글 만들기
        const newPost = {
            id: Date.now(),
            title: title.trim(),
            writer: writer.trim(),
            content: content.trim(),
            date: new Date().toLocaleDateString("ko-KR")
        };

        // 기존 글에 새 글 추가
        const newPosts = [...posts, newPost];

        // 화면과 브라우저에 저장
        setPosts(newPosts);
        localStorage.setItem("communityPosts", JSON.stringify(newPosts));

        // 작성 완료 후 목록으로 이동
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

                    {/* 작성자 */}
                    <label>작성자</label>
                    <input
                        type="text"
                        placeholder="작성자 이름"
                        value={writer}
                        onChange={(e) => setWriter(e.target.value)}
                    />

                    {/* 내용 */}
                    <label>내용</label>
                    <textarea
                        placeholder="내용을 입력하세요."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    {/* 취소, 등록 버튼 */}
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
