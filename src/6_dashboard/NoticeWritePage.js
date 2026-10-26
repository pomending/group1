import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function NoticeWritePage({ posts, setPosts }) {

    const navi = useNavigate()

    // 사용자가 입력하는 값
    // useState("normal")은 처음 선택된 값을 일반 공지로 지정
    const [type, setType] = useState("normal")
    const [title, setTitle] = useState("")
    const [writer, setWriter] = useState("")
    const [content, setContent] = useState("")

    const addPost = () => {
        if (!title.trim() || !writer.trim() || !content.trim()) {
            alert("제목, 작성자, 내용을 모두 입력하세요.")
            return
        }

        //현재 시간을 숫자로 만들어 글 번호로 사용
        let newID = Date.now()

        for (let i = 0; i < posts.length; i++) {
            if (Number(posts[i].id) >= newId) {
                newId = Number(posts[i].id) + 1
            }
        }

        // 새 게시글 만들기
        const newPost = {
            id: newId,
            type: type,
            title: title.trim(),
            writer: writer.trim(),
            content: content.trim(),
            date: new Date().toLocaleDateString("ko-KR")
        };

        // 기존 게시글은 남겨두고 새 게시글 추가
        const newPosts = [...posts, newPost]

        //React 화면에 반영
        setPosts(newPosts)

        localStorage.setItem(
            "noticePosts", JSON.stringify(newPosts)
        )

        //등록 후 목록으로 이동
        navi("/?page=notice")
    }

    return (
        <div className="community">

            <Link to="/?page=notice"
                className="community-back">
                공지사항 목록으로
            </Link>

            <div className="community-board">
                <h1>공지사항 글쓰기</h1>

                <div className="community-write">
                    <label>공지 유형</label>
                    <select className="notice-type-select"
                        value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="normal">일반 공지</option>
                        <option value="important">중요 공지</option>
                    </select>

                    <label>제목</label>
                    <input type="text" placeholder="제목을 입력하세요"
                        value={title} onChange={(e) => setTitle(e.target.value)} />

                    <label>작성자</label>
                    <input placeholder="작성자 이름"
                        value={writer} onChange={(e) => setWriter(e.target.value)} />

                    <label>내용</label>
                    <textarea placeholder="내용을 입력하세요."
                        value={content} onChange={(e) => setContent(e.target.value)} />

                    <div className="community-actions">
                        <Link to="/?page=notice" className="community-cancel">
                            취소
                        </Link>

                        <button className="community-button"
                            onClick={addPost}>
                                등록하기
                            </button>
                    </div>
                </div>
            </div>

        </div>
    )

}

export default NoticeWritePage