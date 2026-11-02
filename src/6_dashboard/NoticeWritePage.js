import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CommunityWrite.css";

// 공지사항 작성
function NoticeWritePage({ posts, setPosts }) {

    const navigate = useNavigate();

    // 입력 상태
    const [type, setType] = useState("normal");
    const [title, setTitle] = useState("");
    const [writer, setWriter] = useState("");
    const [content, setContent] = useState("");

    // 공지 등록
    const addPost = () => {

        // 필수 입력 검사
        if (!title.trim() || !writer.trim() || !content.trim()) {
            alert("제목, 작성자, 내용을 모두 입력하세요.");
            return;
        }

        // 신규 공지사항
        // 시간 기반 ID
        const newPost = {
            id: Date.now(),
            type: type,
            title: title.trim(),
            writer: writer.trim(),
            content: content.trim(),
            date: new Date().toLocaleDateString("ko-KR")
        };

        // 공지 목록 갱신
        const newPosts = [...posts, newPost];

        // 상태·로컬 저장
        setPosts(newPosts);
        localStorage.setItem("noticePosts", JSON.stringify(newPosts));

        // 목록 이동
        navigate("/?page=notice");
    };

    return (
        <div className="community">
            <Link to="/?page=notice" className="community-back">
                ← 공지사항 목록으로
            </Link>

            <div className="community-board">
                <h1>공지사항 글쓰기</h1>

                <div className="community-write">

                    {/* 공지 유형 선택 */}
                    <label>공지 유형</label>
                    <select
                        className="notice-type-select"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="normal">일반 공지</option>
                        <option value="important">중요공지</option>
                    </select>

                    <label>제목</label>
                    <input
                        type="text"
                        placeholder="제목을 입력하세요."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <label>작성자</label>
                    <input
                        type="text"
                        placeholder="작성자 이름"
                        value={writer}
                        onChange={(e) => setWriter(e.target.value)}
                    />

                    <label>내용</label>
                    <textarea
                        placeholder="내용을 입력하세요."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    <div className="community-actions">
                        <Link to="/?page=notice" className="community-cancel">
                            취소
                        </Link>

                        <button className="community-button" onClick={addPost}>
                            등록하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NoticeWritePage;
