
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CommunityWrite.css";


// 공지사항 글쓰기 페이지
function NoticeWritePage({ posts, setPosts }) {

    const navigate = useNavigate();

    // 사용자가 입력한 값들을 각각 기억함
    const [type, setType] = useState("normal");
    const [title, setTitle] = useState("");
    const [writer, setWriter] = useState("");
    const [content, setContent] = useState("");

    // 등록하기 버튼을 눌렀을 때 실행
    const addPost = () => {

        // 빈칸이 하나라도 있으면 등록하지 않음
        if (!title.trim() || !writer.trim() || !content.trim()) {
            alert("제목, 작성자, 내용을 모두 입력하세요.");
            return;
        }

        // 새 게시글을 만듦
        // Date.now()는 현재 시간을 숫자로 가져옴
        const newPost = {
            id: Date.now(),
            type: type,
            title: title.trim(),
            writer: writer.trim(),
            content: content.trim(),
            date: new Date().toLocaleDateString("ko-KR")
        };

        // 기존 공지사항 뒤에 새 공지사항 추가
        const newPosts = [...posts, newPost];

        // 화면과 브라우저에 저장
        setPosts(newPosts);
        localStorage.setItem("noticePosts", JSON.stringify(newPosts));

        // 작성이 끝나면 공지사항 목록으로 이동
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

                    {/* normal은 일반 공지, important는 중요공지 */}
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
