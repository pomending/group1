import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CommunityDetail.css";
import "./CommunityWrite.css";

function NoticeDetailPage({ posts, setPosts, postId }) {

    const navigate = useNavigate();

    // 현재 공지사항
    const post = posts.find(
        (item) => String(item.id) === String(postId)
    );

    // 일반 공지 댓글 · 중요공지 제외
    const showComments = post ? post.type === "normal" : false;

    // 하단 공지 목록 · 현재 페이지
    const sortedPosts = [...posts].sort((a, b) => Number(b.id) - Number(a.id));
    const initialIndex = sortedPosts.findIndex(item => String(item.id) === String(postId));
    const [listPage, setListPage] = useState(() => Math.floor(Math.max(0, initialIndex) / 15) + 1);
    const totalListPages = Math.max(1, Math.ceil(sortedPosts.length / 15));
    const activeListPage = Math.min(listPage, totalListPages);
    const listStart = (activeListPage - 1) * 15;
    const visibleListPosts = sortedPosts.slice(listStart, listStart + 15);

    // 댓글 입력 상태
    const [writer, setWriter] = useState("");
    const [content, setContent] = useState("");

    // 공지별 댓글 저장
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
    // 공지사항 수정 · 전체 유형
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editType, setEditType] = useState("normal");
    const [editTitle, setEditTitle] = useState("");
    const [editWriter, setEditWriter] = useState("");
    const [editContent, setEditContent] = useState("");

    // 공지 수정 초기값
    const startEditPost = () => {
        if (!post) return;

        setEditType(post.type);
        setEditTitle(post.title);
        setEditWriter(post.writer);
        setEditContent(post.content);
        setIsEditingPost(true);
    };

    // 공지 수정 저장
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

    // 댓글 수정 · 일반 공지 전용
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentWriter, setEditCommentWriter] = useState("");
    const [editCommentContent, setEditCommentContent] = useState("");

    // 댓글 수정 초기값
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

    // 댓글 등록
    const addComment = (e) => {
        e.preventDefault();

        if (!showComments) return;

        if (!writer.trim() || !content.trim()) {
            alert("작성자와 댓글 내용을 입력하세요.");
            return;
        }

        // 댓글 ID 중복 방지
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

    // 댓글 삭제
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

    // 공지사항 삭제
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

            <div className="community-board">

                {post ? (
                    <div>

                        {/* 공지 수정 폼 */}
                        {isEditingPost ? (

                            <form
                                className="community-write"
                                onSubmit={saveEditPost}
                            >

                                <h1>공지사항 수정</h1>

                                {/* 수정 중 이동·삭제 */}
                                <div className="community-actions detail-top-actions">
                                    <Link to="/?page=notice" className="community-cancel">목록으로</Link>
                                    <Link to="/?page=notice-write" className="community-button">글쓰기</Link>
                                    <button type="button" className="community-cancel" onClick={deletePost}>삭제</button>
                                </div>

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
                                    <div className="detail-post-meta">
                                        <span>작성자: {post.writer}</span>
                                        <span>작성일: {post.date}</span>
                                    </div>
                                    <div className="community-actions detail-top-actions">
                                        <Link to="/?page=notice" className="community-cancel">목록으로</Link>
                                        <Link to="/?page=notice-write" className="community-button">글쓰기</Link>
                                        <button
                                            type="button"
                                            className="community-button"
                                            onClick={startEditPost}
                                        >수정</button>
                                        <button type="button" className="community-cancel" onClick={deletePost}>삭제</button>
                                    </div>
                                </div>

                                <div
                                    className="community-content"
                                    style={{ minHeight: "180px" }}
                                >
                                    {post.content}
                                </div>
                            </>

                        )}

                        {/* 일반 공지 댓글 */}
                        {/* 중요공지 댓글 제외 */}
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

                                            {/* 댓글 수정·삭제 */}
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

                                        {/* 선택 댓글 수정 */}
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

                                {/* 댓글 입력 폼 */}
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

                        {/* 하단 공지 목록 · 15개 */}
                        {!isEditingPost && (
                            <div className="detail-post-list" aria-label="다른 공지사항 바로가기">
                                <div className="detail-post-list-scroll">
                                    <table className="detail-post-list-table">
                                        <thead>
                                            <tr><th>번호</th><th>구분</th><th>제목</th><th>작성자</th><th>작성일</th></tr>
                                        </thead>
                                        <tbody>
                                            {visibleListPosts.map((item, index) => (
                                                <tr
                                                    key={item.id}
                                                    className={String(item.id) === String(postId) ? "detail-post-list-current" : ""}
                                                    role={String(item.id) === String(postId) ? undefined : "link"}
                                                    tabIndex={String(item.id) === String(postId) ? undefined : 0}
                                                    style={String(item.id) === String(postId) ? undefined : { cursor: "pointer" }}
                                                    onClick={() => {
                                                        if (String(item.id) !== String(postId)) {
                                                            navigate("/?page=notice-detail&id=" + encodeURIComponent(item.id));
                                                        }
                                                    }}
                                                    onKeyDown={(event) => {
                                                        if (event.target !== event.currentTarget) return;
                                                        if (event.key !== "Enter" && event.key !== " ") return;
                                                        if (String(item.id) === String(postId)) return;
                                                        event.preventDefault();
                                                        navigate("/?page=notice-detail&id=" + encodeURIComponent(item.id));
                                                    }}
                                                >
                                                    <td>{sortedPosts.length - listStart - index}</td>
                                                    <td>{item.type === "important" ? "중요공지" : "일반 공지"}</td>
                                                    <td className="detail-post-list-title">
                                                        {String(item.id) === String(postId)
                                                            ? <strong>{item.title} (현재 글)</strong>
                                                            : <Link
                                                                to={"/?page=notice-detail&id=" + encodeURIComponent(item.id)}
                                                                onClick={(event) => event.stopPropagation()}
                                                            >{item.title}</Link>}
                                                    </td>
                                                    <td>{item.writer}</td>
                                                    <td>{item.date}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {totalListPages > 1 && (
                                    <nav className="board-pagination" aria-label="다른 공지사항 페이지 이동">
                                        <button
                                            type="button"
                                            disabled={activeListPage === 1}
                                            onClick={() => setListPage(activeListPage - 1)}
                                        >이전</button>
                                        {Array.from({ length: totalListPages }, (_, index) => index + 1).map(number => (
                                            <button
                                                type="button"
                                                key={number}
                                                className={number === activeListPage ? "active" : ""}
                                                aria-current={number === activeListPage ? "page" : undefined}
                                                onClick={() => setListPage(number)}
                                            >{number}</button>
                                        ))}
                                        <button
                                            type="button"
                                            disabled={activeListPage === totalListPages}
                                            onClick={() => setListPage(activeListPage + 1)}
                                        >다음</button>
                                    </nav>
                                )}
                            </div>
                        )}

                    </div>
                ) : (
                    <p>공지사항을 찾을 수 없습니다.</p>
                )}

                {!post && (
                    <div className="community-actions">
                        <Link to="/?page=notice" className="community-cancel">목록으로</Link>
                        <Link to="/?page=notice-write" className="community-button">글쓰기</Link>
                    </div>
                )}

            </div>
        </div>
    );
}

export default NoticeDetailPage;
