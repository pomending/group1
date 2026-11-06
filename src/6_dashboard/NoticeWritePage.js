import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import { getBoardUser } from "./MyPage";
import "./CommunityWrite.css";

function NoticeWritePage({ posts, setPosts }) {
    const navigate = useNavigate();
    const { currentUser } = useERP();
    const isAdmin = currentUser?.status === "활성" && currentUser.role === "ADMIN";
    const canWrite = isAdmin || (currentUser?.status === "활성" && currentUser.role === "MANAGER");
    const [type, setType] = useState("normal");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const addPost = () => {
        if (!canWrite) return alert("공지사항 작성 권한이 없습니다.");
        const user = getBoardUser();
        if (!user) return alert("로그인한 직원 정보를 찾을 수 없습니다.");
        if (!title.trim() || !content.trim()) return alert("제목과 내용을 모두 입력하세요.");

        // 중요공지는 관리자만 등록할 수 있습니다.
        const post = {
            id: Date.now(), type: isAdmin ? type : "normal",
            title: title.trim(), content: content.trim(),
            writer: user.name, authorEmail: user.email, authorEmployeeId: user.employeeId,
            date: new Date().toLocaleDateString("ko-KR")
        };
        const updated = [...posts, post];
        setPosts(updated);
        localStorage.setItem("noticePosts", JSON.stringify(updated));
        navigate("/?page=notice");
    };

    if (!canWrite) {
        return (
            <div className="community">
                <div className="community-board">
                    <h1>공지사항 글쓰기</h1>
                    <p>공지사항 작성 권한이 없습니다.</p>
                    <Link to="/?page=notice" className="community-cancel">목록으로</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="community">
            <Link to="/?page=notice" className="community-back">← 공지사항 목록으로</Link>
            <div className="community-board">
                <h1>공지사항 글쓰기</h1>
                <div className="community-write">
                    <label htmlFor="notice-type">공지 유형</label>
                    <select
                        id="notice-type"
                        className="notice-type-select"
                        value={isAdmin ? type : "normal"}
                        onChange={event => setType(event.target.value)}>
                        <option value="normal">일반 공지</option>
                        {isAdmin && <option value="important">중요공지</option>}
                    </select>
                    <label htmlFor="notice-title">제목</label>
                    <input
                        id="notice-title"
                        type="text"
                        placeholder="제목을 입력하세요."
                        value={title}
                        onChange={event => setTitle(event.target.value)}/>
                    <label htmlFor="notice-content">내용</label>
                    <textarea
                        id="notice-content"
                        placeholder="내용을 입력하세요."
                        value={content}
                        onChange={event => setContent(event.target.value)}/>
                    <div className="community-actions">
                        <Link to="/?page=notice" className="community-cancel">취소</Link>
                        <button type="button" className="community-button" onClick={addPost}>등록하기</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NoticeWritePage;
