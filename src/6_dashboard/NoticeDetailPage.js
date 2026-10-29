
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CommunityDetail.css";
import "./CommunityWrite.css";

function NoticeDetailPage({ posts, setPosts, postId }) {

    const navigate = useNavigate();

    // 현재 보고 있는 공지사항 찾기
    const post = posts.find(
        (item) => String(item.id) === String(postId)
    );

    // 일반 공지일 때만 댓글을 보여줌
    // 중요공지라면 false가 됨
    const showComments = post ? post.type === "normal" : false;

    // 댓글 입력값
    const [writer, setWriter] = useState("");
    const [content, setContent] = useState("");

    // 공지사항마다 댓글을 따로 저장
    const commentKey = "noticeComments_" + postId;

    const [comments, setComments] = useState(() => {
        const saved = localStorage.getItem(commentKey);

        if (!saved) return [];

        try {
            const data = JSON.parse(saved);
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    });


    // ==========================
    // 공지사항 수정
    // 일반공지 / 중요공지 공통
    // ==========================

    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editType, setEditType] = useState("normal");
    const [editTitle, setEditTitle] = useState("");
    const [editWriter, setEditWriter] = useState("");
    const [editContent, setEditContent] = useState("");

    // 현재 공지사항의 내용으로 수정창 열기
    const startEditPost = () => {
        if (!post) return;

        setEditType(post.type);
        setEditTitle(post.title);
        setEditWriter(post.writer);
        setEditContent(post.content);
        setIsEditingPost(true);
    };

    // 수정한 공지사항 저장
    const saveEditPost = (e) => {
        e.preventDefault();

        if (
            !editTitle.trim() ||
            !editWriter.trim() ||
            !editContent.trim()
        ) {
            alert("제목, 작성자, 내용을 모두 입력하세요.");
            return;
        }

        const newPosts = posts.map((item) =>
            String(item.id) === String(postId)
                ? {
                    ...item,
                    type: editType,
                    title: editTitle.trim(),
                    writer: editWriter.trim(),
                    content: editContent.trim()
                }
                : item
        );

        setPosts(newPosts);
        localStorage.setItem(
            "noticePosts",
            JSON.stringify(newPosts)
        );

        setIsEditingPost(false);
    };


    // ==========================
    // 댓글 수정
    // 일반공지에서만 가능
    // ==========================

    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentWriter, setEditCommentWriter] = useState("");
    const [editCommentContent, setEditCommentContent] = useState("");

    // 선택한 댓글의 내용으로 수정창 열기
    const startEditComment = (comment) => {
        if (!showComments) return;

        setEditingCommentId(comment.id);
        setEditCommentWriter(comment.writer);
        setEditCommentContent(comment.content);
    };

    // 댓글 수정 저장
    const saveEditComment = (e) => {
        e.preventDefault();

        if (!showComments) return;

        if (
            !editCommentWriter.trim() ||
            !editCommentContent.trim()
        ) {
            alert("작성자와 댓글 내용을 입력하세요.");
            return;
        }

        const newComments = comments.map((comment) =>
            String(comment.id) === String(editingCommentId)
                ? {
                    ...comment,
                    writer: editCommentWriter.trim(),
                    content: editCommentContent.trim()
                }
                : comment
        );

        setComments(newComments);
        localStorage.setItem(
            commentKey,
            JSON.stringify(newComments)
        );

        setEditingCommentId(null);
    };


    // ==========================
    // 기존 댓글 등록 기능
    // ==========================

    const addComment = (e) => {
        e.preventDefault();

        if (!showComments) return;

        if (!writer.trim() || !content.trim()) {
            alert("작성자와 댓글 내용을 입력하세요.");
            return;
        }

        // 같은 댓글 번호가 생기지 않도록 확인
        let newId = Date.now();

        for (let i = 0; i < comments.length; i++) {
            if (Number(comments[i].id) >= newId) {
                newId = Number(comments[i].id) + 1;
            }
        }

        const newComment = {
            id: newId,
            writer: writer.trim(),
            content: content.trim(),
            date: new Date().toLocaleDateString("ko-KR")
        };

        const newComments = [...comments, newComment];

        setComments(newComments);
        localStorage.setItem(
            commentKey,
            JSON.stringify(newComments)
        );

        setWriter("");
        setContent("");
    };


    // ==========================
    // 기존 댓글 삭제 기능
    // ==========================

    const delComment = (commentId) => {

        if (!showComments) return;

        if (!window.confirm("댓글을 삭제하겠습니까?")) {
            return;
        }

        const newComments = comments.filter(
            (comment) => comment.id !== commentId
        );

        setComments(newComments);
        localStorage.setItem(
            commentKey,
            JSON.stringify(newComments)
        );
    };


    // ==========================
    // 기존 공지사항 삭제 기능
    // ==========================

    const deletePost = () => {

        if (!window.confirm("공지사항을 삭제하시겠습니까?")) {
            return;
        }

        const newPosts = posts.filter(
            (item) => String(item.id) !== String(postId)
        );

        setPosts(newPosts);
        localStorage.setItem(
            "noticePosts",
            JSON.stringify(newPosts)
        );
        localStorage.removeItem(commentKey);

        navigate("/?page=notice");
    };


    return (
        <div className="community">

            <Link to="/?page=notice" className="community-back">
                ← 공지사항 목록으로
            </Link>

            <div className="community-board">

                {post ? (
                    <div>

                        {/* 수정 중에는 현재 글 대신 입력창 표시 */}
                        {isEditingPost ? (

                            <form
                                className="community-write"
                                onSubmit={saveEditPost}
                            >

                                <h1>공지사항 수정</h1>

                                <label htmlFor="notice-edit-type">
                                    공지 유형
                                </label>

                                <select
                                    id="notice-edit-type"
                                    className="notice-type-select"
                                    value={editType}
                                    onChange={(e) =>
                                        setEditType(e.target.value)
                                    }
                                >
                                    <option value="normal">
                                        일반 공지
                                    </option>
                                    <option value="important">
                                        중요공지
                                    </option>
                                </select>

                                <label htmlFor="notice-edit-title">
                                    제목
                                </label>

                                <input
                                    id="notice-edit-title"
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) =>
                                        setEditTitle(e.target.value)
                                    }
                                />

                                <label htmlFor="notice-edit-writer">
                                    작성자
                                </label>

                                <input
                                    id="notice-edit-writer"
                                    type="text"
                                    value={editWriter}
                                    onChange={(e) =>
                                        setEditWriter(e.target.value)
                                    }
                                />

                                <label htmlFor="notice-edit-content">
                                    내용
                                </label>

                                <textarea
                                    id="notice-edit-content"
                                    value={editContent}
                                    onChange={(e) =>
                                        setEditContent(e.target.value)
                                    }
                                />

                                <div className="community-actions">

                                    <button
                                        type="button"
                                        className="community-cancel"
                                        onClick={() =>
                                            setIsEditingPost(false)
                                        }
                                    >
                                        취소
                                    </button>

                                    <button
                                        type="submit"
                                        className="community-button"
                                    >
                                        수정 완료
                                    </button>

                                </div>

                            </form>

                        ) : (

                            <>
                                <h1>{post.title}</h1>

                                <div className="community-info">

                                    {/* 기존 작성자와 작성일 표시 */}
                                    <span>작성자: {post.writer}</span>
                                    <span>작성일: {post.date}</span>

                                </div>

                                <div className="community-content">
                                    {post.content}
                                </div>
                            </>

                        )}


                        {/* 일반 공지일 때만 댓글 표시 */}
                        {/* 중요공지에서는 댓글 영역을 만들지 않음 */}
                        {showComments && !isEditingPost && (

                            <div className="detail-comments">

                                <h3>댓글 ({comments.length})</h3>

                                {comments.length === 0 && (
                                    <p className="detail-comment-empty">
                                        등록된 댓글이 없습니다.
                                    </p>
                                )}


                                {/* 댓글 목록 */}
                                {comments.map((comment) => (

                                    <div
                                        className="detail-comment-item"
                                        key={comment.id}
                                    >

                                        <div className="detail-comment-info">

                                            <strong>{comment.writer}</strong>
                                            <span>{comment.date}</span>


                                            {/* 수정 버튼과 기존 삭제 버튼 */}
                                            <div
                                                style={{
                                                    marginLeft: "auto",
                                                    display: "flex",
                                                    gap: "12px"
                                                }}
                                            >

                                                <button
                                                    type="button"
                                                    style={{ marginLeft: 0 }}
                                                    onClick={() =>
                                                        startEditComment(comment)
                                                    }
                                                >
                                                    수정
                                                </button>

                                                <button
                                                    type="button"
                                                    style={{ marginLeft: 0 }}
                                                    onClick={() =>
                                                        delComment(comment.id)
                                                    }
                                                >
                                                    삭제
                                                </button>

                                            </div>

                                        </div>


                                        {/* 수정 중인 댓글만 입력창 표시 */}
                                        {String(editingCommentId) ===
                                        String(comment.id) ? (

                                            <form
                                                className="detail-comment-write"
                                                onSubmit={saveEditComment}
                                            >

                                                <input
                                                    type="text"
                                                    placeholder="작성자 이름"
                                                    value={editCommentWriter}
                                                    onChange={(e) =>
                                                        setEditCommentWriter(
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                                <textarea
                                                    placeholder="댓글 내용을 입력하세요"
                                                    value={editCommentContent}
                                                    onChange={(e) =>
                                                        setEditCommentContent(
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "flex-end",
                                                        gap: "10px"
                                                    }}
                                                >

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setEditingCommentId(null)
                                                        }
                                                    >
                                                        취소
                                                    </button>

                                                    <button type="submit">
                                                        수정 완료
                                                    </button>

                                                </div>

                                            </form>

                                        ) : (

                                            <p>{comment.content}</p>

                                        )}

                                    </div>

                                ))}


                                {/* 기존 댓글 작성 기능 */}
                                <hr />

                                <form
                                    className="detail-comment-write"
                                    onSubmit={addComment}
                                >

                                    <input
                                        type="text"
                                        placeholder="작성자 이름"
                                        value={writer}
                                        onChange={(e) =>
                                            setWriter(e.target.value)
                                        }
                                    />

                                    <textarea
                                        placeholder="댓글 내용을 입력하세요"
                                        value={content}
                                        onChange={(e) =>
                                            setContent(e.target.value)
                                        }
                                    />

                                    <button type="submit">
                                        댓글 등록
                                    </button>

                                </form>

                            </div>

                        )}

                    </div>
                ) : (
                    <p>공지사항을 찾을 수 없습니다.</p>
                )}


                {/* 기존 하단 버튼과 새 수정 버튼 */}
                <div className="community-actions">

                    <Link
                        to="/?page=notice"
                        className="community-cancel"
                    >
                        목록으로
                    </Link>

                    <Link
                        to="/?page=notice-write"
                        className="community-button"
                    >
                        글쓰기
                    </Link>

                    {post && !isEditingPost && (
                        <button
                            type="button"
                            className="community-button"
                            onClick={startEditPost}
                        >
                            수정
                        </button>
                    )}

                    {post && (
                        <button
                            className="community-cancel"
                            onClick={deletePost}
                        >
                            삭제
                        </button>
                    )}

                </div>

            </div>
        </div>
    );
}

export default NoticeDetailPage;
