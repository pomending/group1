import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBoardUser } from "./MyPage";
import "./CommunityWrite.css";

function CommunityWritePage({ posts, setPosts }) {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const addPost = () => {
        const user = getBoardUser();
        if (!user) return alert("로그인한 직원 정보를 찾을 수 없습니다.");
        if (!title.trim() || !content.trim()) return alert("제목과 내용을 모두 입력하세요.");

        // 작성자 정보는 입력받지 않고 로그인 계정에서 가져옵니다.
        const post = {
            id: Date.now(), title: title.trim(), content: content.trim(),
            writer: user.name, authorEmail: user.email, authorEmployeeId: user.employeeId,
            date: new Date().toLocaleDateString("ko-KR")
        };
        const updated = [...posts, post];
        setPosts(updated);
        localStorage.setItem("communityPosts", JSON.stringify(updated));
        navigate("/?page=community");
    };

    return (
        <div className="community">
            <Link to="/?page=community" className="community-back">← 게시글 목록으로</Link>
            <div className="community-board">
                <h1>글쓰기</h1>
                <div className="community-write">
                    <label htmlFor="community-title">제목</label>
                    <input
                        id="community-title"
                        type="text"
                        placeholder="제목을 입력하세요."
                        value={title}
                        onChange={event => setTitle(event.target.value)}/>
                    <label htmlFor="community-content">내용</label>
                    <textarea
                        id="community-content"
                        placeholder="내용을 입력하세요."
                        value={content}
                        onChange={event => setContent(event.target.value)}/>
                    <div className="community-actions">
                        <Link to="/?page=community" className="community-cancel">취소</Link>
                        <button type="button" className="community-button" onClick={addPost}>등록하기</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CommunityWritePage;
