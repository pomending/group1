import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CommunityDetail.css";
import "./CommunityWrite.css";

function CommunityDetailPage({ posts, setPosts, postId }) {

    const navi = useNavigate();

    // 현재 게시글
    const post = posts.find(
        (item) => String(item.id) === String(postId)
    );

    // 상세 목록 · 현재 페이지
    const sortedPosts = [...posts].sort((a, b) => Number(b.id) - Number(a.id));
    const initialIndex = sortedPosts.findIndex(item => String(item.id) === String(postId));
    const [listPage, setListPage] = useState(() => Math.floor(Math.max(0, initialIndex) / 15) + 1);
    const totalListPages = Math.max(1, Math.ceil(sortedPosts.length / 15));
    const activeListPage = Math.min(listPage, totalListPages);
    const listStart = (activeListPage - 1) * 15;
    const visibleListPosts = sortedPosts.slice(listStart, listStart + 15);

    // 댓글 입력값
    const [writer, setWriter] = useState("");
    const [content, setContent] = useState("");

    // 댓글 불러오기
    const commentKey = "communityComments_" + postId;

    const [comments, setComments] = useState(() => {
        const saved = localStorage.getItem(commentKey);

        if (!saved) {
            return [];
        }

        try {
            const data = JSON.parse(saved);
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    });
    // 게시글 수정 · 번호·작성일 유지
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editWriter, setEditWriter] = useState("");
    const [editContent, setEditContent] = useState("");

    // 게시글 수정 초기값
    const startEditPost = () => {
        if (!post) return;

        setEditTitle(post.title || "");
        setEditWriter(post.writer || "");
        setEditContent(post.content || "");
        setIsEditingPost(true);
    };

    // 게시글 수정 저장
    const saveEditPost = (e) => {
        e.preventDefault();

        if (!editTitle.trim() || !editWriter.trim() || !editContent.trim()) {
            alert("제목, 작성자, 내용을 모두 입력하세요.");
            return;
        }

        const newPosts = posts.map((item) =>
            String(item.id) === String(postId)
                ? {
                    ...item,
                    title: editTitle.trim(),
                    writer: editWriter.trim(),
                    content: editContent.trim()
                }
                : item
        );

        setPosts(newPosts);
        localStorage.setItem("communityPosts", JSON.stringify(newPosts));
        setIsEditingPost(false);
    };

    // 댓글 수정
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentWriter, setEditCommentWriter] = useState("");
    const [editCommentContent, setEditCommentContent] = useState("");

    // 댓글 수정 초기값
    const startEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditCommentWriter(comment.writer || "");
        setEditCommentContent(comment.content || "");
    };

    // 댓글 수정 저장
    const saveEditComment = (e) => {
        e.preventDefault();

        if (!editCommentWriter.trim() || !editCommentContent.trim()) {
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
        localStorage.setItem(commentKey, JSON.stringify(newComments));
        setEditingCommentId(null);
    };

    // 댓글 등록
    const addComment = (e) => {
        e.preventDefault();

        if (!writer.trim() || !content.trim()) {
            alert("작성자와 댓글 내용을 입력하세요");
            return;
        }

        const newComment = {
            id: Date.now(),
            writer: writer.trim(),
            content: content.trim(),
            date: new Date().toLocaleDateString("ko-KR")
        };

        const newComments = [...comments, newComment];

        setComments(newComments);
        localStorage.setItem(commentKey, JSON.stringify(newComments));
        setWriter("");
        setContent("");
    };

    // 댓글 삭제
    const delComment = (commentId) => {
        if (!window.confirm("댓글을 삭제하겠습니까?")) {
            return;
        }

        const newComments = comments.filter(
            (comment) => comment.id !== commentId
        );

        setComments(newComments);
        localStorage.setItem(commentKey, JSON.stringify(newComments));
    };

    // 게시글 삭제
    const delePost = () => {
        if (!window.confirm("게시글을 삭제하시겠습니까?")) {
            return;
        }

        const newPosts = posts.filter(
            (item) => String(item.id) !== String(postId)
        );

        setPosts(newPosts);
        localStorage.setItem("communityPosts", JSON.stringify(newPosts));
        localStorage.removeItem(commentKey);
        navi("/?page=community");
    };

    return (
        <div className="community">

            <div className="community-board">

                {post ? (
                    <div>

                        {/* 게시글 수정 폼 */}
                        {isEditingPost ? (
                            <form
                                className="community-write"
                                onSubmit={saveEditPost}
                            >
                                <h1>게시글 수정</h1>

                                <label htmlFor="edit-post-title">제목</label>
                                <input
                                    id="edit-post-title"
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                />

                                <label htmlFor="edit-post-writer">작성자</label>
                                <input
                                    id="edit-post-writer"
                                    type="text"
                                    value={editWriter}
                                    onChange={(e) => setEditWriter(e.target.value)}
                                />

                                <label htmlFor="edit-post-content">내용</label>
                                <textarea
                                    id="edit-post-content"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                />

                                <div className="community-actions">
                                    <button
                                        type="button"
                                        className="community-cancel"
                                        onClick={() => setIsEditingPost(false)}
                                    >
                                        취소
                                    </button>
                                    <button type="submit" className="community-button">
                                        수정 완료
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                {/* 게시글 본문 */}
                                <h1>{post.title}</h1>

                                <div className="community-info">
                                    <div className="detail-post-meta">
                                        <span>작성자: {post.writer}</span>
                                        <span>작성일: {post.date}</span>
                                    </div>
                                    <div className="community-actions detail-top-actions">
                                        <Link to="/?page=community" className="community-cancel">목록으로</Link>
                                        <Link to="/?page=write" className="community-button">글쓰기</Link>
                                        <button
                                            type="button"
                                            className="community-button"
                                            onClick={startEditPost}
                                        >수정</button>
                                        <button type="button" className="community-cancel" onClick={delePost}>삭제</button>
                                    </div>
                                </div>

                                <div className="community-content">
                                    {post.content}
                                </div>

                                {/* 댓글 영역 */}
                                <div className="detail-comments">
                                    <h3>댓글 ({comments.length})</h3>

                                    {comments.length === 0 && (
                                        <p className="detail-comment-empty">
                                            등록된 댓글이 없습니다.
                                        </p>
                                    )}

                                    {comments.map((comment) => (
                                        <div
                                            className="detail-comment-item"
                                            key={comment.id}
                                        >
                                            <div className="detail-comment-info">
                                                <strong>{comment.writer}</strong>
                                                <span>{comment.date}</span>

                                                {/* 댓글 수정·삭제 */}
                                                <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
                                                    <button
                                                        type="button"
                                                        style={{ marginLeft: 0 }}
                                                        onClick={() => startEditComment(comment)}
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        type="button"
                                                        style={{ marginLeft: 0 }}
                                                        onClick={() => delComment(comment.id)}
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 선택 댓글 수정 */}
                                            {editingCommentId !== null &&
                                            String(editingCommentId) === String(comment.id) ? (
                                                <form
                                                    className="detail-comment-write"
                                                    onSubmit={saveEditComment}
                                                >
                                                    <input
                                                        type="text"
                                                        placeholder="작성자 이름"
                                                        value={editCommentWriter}
                                                        onChange={(e) => setEditCommentWriter(e.target.value)}
                                                    />

                                                    <textarea
                                                        placeholder="댓글 내용을 입력하세요"
                                                        value={editCommentContent}
                                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                                    />

                                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingCommentId(null)}
                                                        >
                                                            취소
                                                        </button>
                                                        <button type="submit">수정 완료</button>
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
                                            placeholder="작성자이름"
                                            value={writer}
                                            onChange={(e) => setWriter(e.target.value)}
                                        />

                                        <textarea
                                            placeholder="댓글 내용을 입력하세요"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        />

                                        <button type="submit">댓글 등록</button>
                                    </form>
                                </div>

                                {/* 하단 글 목록 · 15개 */}
                                <div className="detail-post-list" aria-label="다른 게시글 바로가기">
                                    <div className="detail-post-list-scroll">
                                        <table className="detail-post-list-table">
                                            <thead>
                                                <tr><th>번호</th><th>제목</th><th>작성자</th><th>작성일</th></tr>
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
                                                                navi("/?page=detail&id=" + encodeURIComponent(item.id));
                                                            }
                                                        }}
                                                        onKeyDown={(event) => {
                                                            if (event.target !== event.currentTarget) return;
                                                            if (event.key !== "Enter" && event.key !== " ") return;
                                                            if (String(item.id) === String(postId)) return;
                                                            event.preventDefault();
                                                            navi("/?page=detail&id=" + encodeURIComponent(item.id));
                                                        }}
                                                    >
                                                        <td>{sortedPosts.length - listStart - index}</td>
                                                        <td className="detail-post-list-title">
                                                            {String(item.id) === String(postId)
                                                                ? <strong>{item.title} (현재 글)</strong>
                                                                : <Link
                                                                    to={"/?page=detail&id=" + encodeURIComponent(item.id)}
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
                                        <nav className="board-pagination" aria-label="다른 게시글 페이지 이동">
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
                            </>
                        )}
                    </div>
                ) : (
                    <p>게시글을 찾을 수 없습니다.</p>
                )}

                {!post && (
                    <div className="community-actions">
                        <Link to="/?page=community" className="community-cancel">목록으로</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CommunityDetailPage;
