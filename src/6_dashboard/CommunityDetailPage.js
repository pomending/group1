
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CommunityDetail.css";
import "./CommunityWrite.css";

function CommunityDetailPage({ posts, setPosts, postId }) {

    const navi = useNavigate();

    // 현재 선택한 게시글 찾기
    const post = posts.find(
        (item) => String(item.id) === String(postId)
    );

    // 댓글을 작성할 때 입력하는 값
    const [writer, setWriter] = useState("");
    const [content, setContent] = useState("");

    // 게시글에 저장된 댓글 불러오기
    const commentKey = "communityComments_" + postId;

    const [comments, setComments] = useState(() => {
        const saved = localStorage.getItem(commentKey);

        if (!saved) {
            return [];
        }

        try {
            return JSON.parse(saved);
        } catch {
            return [];
        }
    });


    // ========================================
    // 게시글 수정 기능 추가
    // 기존 게시글의 번호와 작성일은 그대로 유지
    // ========================================

    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editWriter, setEditWriter] = useState("");
    const [editContent, setEditContent] = useState("");

    // 수정 버튼을 누르면 현재 글을 입력칸에 표시
    const startEditPost = () => {
        if (!post) return;

        setEditTitle(post.title || "");
        setEditWriter(post.writer || "");
        setEditContent(post.content || "");
        setIsEditingPost(true);
    };

    // 수정한 게시글 저장
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


    // ========================================
    // 댓글 수정 기능 추가
    // ========================================

    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentWriter, setEditCommentWriter] = useState("");
    const [editCommentContent, setEditCommentContent] = useState("");

    // 선택한 댓글의 작성자와 내용을 입력칸에 표시
    const startEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditCommentWriter(comment.writer || "");
        setEditCommentContent(comment.content || "");
    };

    // 수정한 댓글 저장
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


    // 기존 댓글 등록 기능
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

    // 기존 댓글 삭제 기능
    const delComment = (commentId) => {
        if (!window.confirm("댓글을 삭제하겠습니까?")) {
            return;
        }

        const newComments = comments.filter(
            (comment) => comment.id !== commentId
        );

        setComments(newComments);
        localStorage.setItem("commentKey", JSON.stringify(newComments));
    };

    // 기존 게시글 삭제 기능
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

            <Link to="/?page=community" className="community-back">
                ← 게시글 목록으로
            </Link>

            <div className="community-board">

                {post ? (
                    <div>

                        {/* 게시글 수정 중에는 제목·작성자·내용 입력칸 표시 */}
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
                                {/* 기존 게시글 내용 */}
                                <h1>{post.title}</h1>

                                <div className="community-info">
                                    <span>작성자: {post.writer}</span>
                                    <span>작성일: {post.date}</span>
                                </div>

                                <div className="community-content">
                                    {post.content}
                                </div>

                                {/* 기존 댓글 영역 */}
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

                                                {/* 댓글의 수정·삭제 버튼 */}
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

                                            {/* 선택한 댓글만 수정 입력칸으로 전환 */}
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

                                    {/* 기존 댓글 등록 */}
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
                            </>
                        )}
                    </div>
                ) : (
                    <p>게시글을 찾을 수 없습니다.</p>
                )}

                {/* 기존 버튼을 유지하고 게시글 수정 버튼만 추가 */}
                <div className="community-actions">
                    <Link to="/?page=community" className="community-cancel">
                        목록으로
                    </Link>

                    <Link to="/?page=write" className="community-button">
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
                            type="button"
                            className="community-cancel"
                            onClick={delePost}
                        >
                            삭제
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CommunityDetailPage;
