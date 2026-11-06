
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import "./CommunityDetail.css";
import "./CommunityWrite.css";
import { getBoardUser, isBoardAuthor } from "./MyPage";
import { addNotification, getNotificationAuthorId } from "../components/Topbar";

// 댓글은 게시글 번호별로 저장합니다.
function readComments(key) {
    try {
        const list = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function CommunityDetailPage({ posts, setPosts, postId }) {

    const navi = useNavigate();

    // 현재 게시글
    const post = posts.find(
        (item) => String(item.id) === String(postId)
    );

    const { currentUser: account, employees } = useERP();
    const isAdmin = account?.status === "활성" && account?.role === "ADMIN";
    const currentUser = getBoardUser();
    const canEditPost = isBoardAuthor(post, currentUser);
    const canDeletePost = isAdmin || canEditPost;

    // 상세 목록 · 현재 페이지
    const sortedPosts = [...posts].sort((a, b) => Number(b.id) - Number(a.id));
    const initialIndex = sortedPosts.findIndex(item => String(item.id) === String(postId));
    const [listPage, setListPage] = useState(() => Math.floor(Math.max(0, initialIndex) / 15) + 1);
    const totalListPages = Math.max(1, Math.ceil(sortedPosts.length / 15));
    const activeListPage = Math.min(listPage, totalListPages);
    const listStart = (activeListPage - 1) * 15;
    const visibleListPosts = sortedPosts.slice(listStart, listStart + 15);

    const [content, setContent] = useState("");

    const commentKey = "communityComments_" + postId;

    const [comments, setComments] = useState(() => readComments(commentKey));

    // 댓글 수정·등록·삭제가 모두 같은 저장 방법을 사용합니다.
    const saveComments = list => {
        setComments(list);
        localStorage.setItem(commentKey, JSON.stringify(list));
    };

    // 게시글 수정 · 번호·작성일 유지
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");

    const startEditPost = () => {
        if (!canEditPost) return;
        setEditTitle(post.title || "");
        setEditContent(post.content || "");
        setIsEditingPost(true);
    };

    const saveEditPost = (e) => {
        e.preventDefault();
        if (!isBoardAuthor(post, getBoardUser())) {
            alert("작성자만 수정할 수 있습니다.");
            return;
        }
        if (!editTitle.trim() || !editContent.trim()) {
            alert("제목과 내용을 모두 입력하세요.");
            return;
        }

        const newPosts = posts.map((item) =>
            String(item.id) === String(postId)
                ? {
                    ...item,
                    title: editTitle.trim(),
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
    const [editCommentContent, setEditCommentContent] = useState("");

    // 원댓글 아래 답글 입력 상태 (기존 댓글 배열을 그대로 사용)
    const [replyToId, setReplyToId] = useState(null);
    const [replyContent, setReplyContent] = useState("");

    // 글을 바꾸면 해당 글의 댓글과 답글을 다시 읽어 잘못 저장되는 문제를 막습니다.
    useEffect(() => {
        setComments(readComments(commentKey));
        setReplyToId(null);
        setReplyContent("");
        setEditingCommentId(null);
    }, [commentKey]);

    const startEditComment = (comment) => {
        if (comment.deleted || !isBoardAuthor(comment, getBoardUser())) return;
        setEditingCommentId(comment.id);
        setEditCommentContent(comment.content || "");
    };

    const saveEditComment = (e) => {
        e.preventDefault();

        const targetComment = comments.find(
            item => String(item.id) === String(editingCommentId)
        );
        if (targetComment?.deleted || !isBoardAuthor(targetComment, getBoardUser())) {
            alert("댓글 작성자만 수정할 수 있습니다.");
            return;
        }
        if (!editCommentContent.trim()) {
            alert("댓글 내용을 입력하세요.");
            return;
        }

        const newComments = comments.map((comment) =>
            String(comment.id) === String(editingCommentId)
                ? {
                    ...comment,
                    content: editCommentContent.trim()
                }
                : comment
        );
        saveComments(newComments);
        setEditingCommentId(null);
    };

    // 일반 댓글과 답글의 저장·알림 처리 방법을 함께 사용합니다.
    const submitComment = (event, parentComment = null) => {
        event.preventDefault();
        const parent = parentComment && comments.find(item => String(item.id) === String(parentComment.id));
        if (parentComment && (!parent || parent.deleted)) return;

        const user = getBoardUser();
        if (!user) return alert("직원 정보를 찾을 수 없습니다.");
        const message = parentComment ? replyContent : content;
        if (!message.trim()) return alert(parentComment ? "답글 내용을 입력하세요." : "댓글 내용을 입력하세요.");

        // 같은 글 안에서 댓글 ID가 겹치지 않게 정합니다.
        let id = Date.now();
        comments.forEach(item => {
            if (Number(item.id) >= id) id = Number(item.id) + 1;
        });
        const item = {
            id,
            ...(parent ? { parentId: parent.id } : {}),
            writer: user.name,
            authorEmail: user.email,
            authorEmployeeId: user.employeeId,
            content: message.trim(),
            date: new Date().toLocaleDateString("ko-KR")
        };
        saveComments([...comments, item]);

        // 자신이 쓴 글·댓글에 대해서는 알림을 보내지 않습니다.
        const ownerId = getNotificationAuthorId(parent || post, employees);
        if (ownerId != null && String(ownerId) !== String(user.employeeId)) {
            addNotification(ownerId, {
                key: `community:${parent ? "reply" : "comment"}:${postId}:${id}`,
                title: parent ? "새 답글" : "새 댓글",
                message: `${user.name}님이 내 ${parent ? "댓글에 답글" : "커뮤니티 글에 댓글"}을 남겼습니다.`,
                link: `/?page=detail&id=${encodeURIComponent(postId)}`
            });
        }
        if (parent) {
            setReplyToId(null);
            setReplyContent("");
        } else {
            setContent("");
        }
    };

    const addComment = event => submitComment(event);
    const addReply = (event, parent) => submitComment(event, parent);

    const delComment = (commentId) => {
        const targetComment = comments.find(
            item => String(item.id) === String(commentId)
        );
        if (!targetComment || targetComment.deleted || (!isAdmin && !isBoardAuthor(targetComment, getBoardUser()))) {
            alert("댓글 삭제 권한이 없습니다.");
            return;
        }
        if (!window.confirm("댓글을 삭제하겠습니까?")) {
            return;
        }

        // 남의 답글이 연결되어 있으면 원댓글 내용만 지워 답글을 보존합니다.
        const hasReplies = comments.some(
            (item) => item.parentId != null && String(item.parentId) === String(commentId)
        );
        const newComments = hasReplies
            ? comments.map((item) =>
                String(item.id) === String(commentId)
                    ? { ...item, content: "", deleted: true }
                    : item
            )
            : comments.filter((item) => String(item.id) !== String(commentId));

        // 마지막 답글이 삭제되었다면 비어 있는 원댓글 자리도 정리합니다.
        let cleanedComments = newComments;
        let previousLength;
        do {
            previousLength = cleanedComments.length;
            cleanedComments = cleanedComments.filter((item) =>
                !item.deleted || cleanedComments.some((reply) =>
                    reply.parentId != null && String(reply.parentId) === String(item.id)
                )
            );
        } while (cleanedComments.length !== previousLength);
        saveComments(cleanedComments);
    };

    const delePost = () => {
        if (!post || (!isAdmin && !isBoardAuthor(post, getBoardUser()))) {
            alert("게시글 삭제 권한이 없습니다.");
            return;
        }
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

    // 댓글과 답글을 모든 단계에서 부모 바로 아래 순서로 펼칩니다.
    // 깊이가 늘어나도 카드 너비가 지나치게 좁아지지 않도록 들여쓰기만 제한합니다.
    const threadedComments = [];
    const visitedCommentIds = new Set();
    const pendingComments = comments
        .filter((item) => item.parentId == null)
        .map((item) => ({ item, depth: 0 }))
        .reverse();
    while (pendingComments.length > 0) {
        const { item, depth } = pendingComments.pop();
        const itemId = String(item.id);
        if (visitedCommentIds.has(itemId)) continue;
        visitedCommentIds.add(itemId);
        threadedComments.push({ item, depth });

        // 기존 저장 배열 순서를 유지하며 자식 답글을 바로 아래에 배치합니다.
        for (let i = comments.length - 1; i >= 0; i--) {
            const reply = comments[i];
            if (reply.parentId != null && String(reply.parentId) === itemId) {
                pendingComments.push({ item: reply, depth: depth + 1 });
            }
        }
    }
    return (
        <div className="community">
            <div className="community-board">
                {post ? (
                    <div>
                        {/* 게시글 수정 폼 */}
                        {isEditingPost && canEditPost ? (
                            <form
                                className="community-write"
                                onSubmit={saveEditPost}>
                                <h1>게시글 수정</h1>
                                <label htmlFor="edit-post-title">제목</label>
                                <input
                                    id="edit-post-title"
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}/>
                                <label htmlFor="edit-post-content">내용</label>
                                <textarea
                                    id="edit-post-content"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}/>
                                <div className="community-actions">
                                    <button
                                        type="button"
                                        className="community-cancel"
                                        onClick={() => setIsEditingPost(false)}>
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
                                        {canEditPost && (
                                            <button
                                                type="button"
                                                className="community-button"
                                                onClick={startEditPost}
                                            >수정</button>
                                        )}
                                        {canDeletePost && (
                                            <button type="button" className="community-cancel" onClick={delePost}>삭제</button>
                                        )}
                                    </div>
                                </div>
                                <div className="community-content">
                                    {post.content}
                                </div>
                                {/* 댓글 영역 */}
                                <div className="detail-comments">
                                    <h3>댓글 ({comments.filter((item) => !item.deleted).length})</h3>
                                    {comments.filter((item) => !item.deleted).length === 0 && (
                                        <p className="detail-comment-empty">
                                            등록된 댓글이 없습니다.
                                        </p>
                                    )}
                                    {threadedComments.map(({ item: comment, depth }) => {
                                        const indent = Math.min(depth * 30, 150);
                                        const replyIndent = Math.min((depth + 1) * 30, 150);
                                        return (
                                        <React.Fragment key={comment.id}>
                                            {/* 댓글과 모든 단계의 답글을 별도 카드로 표시 */}
                                            <div
                                                className="detail-comment-item"
                                                style={depth > 0 ? {
                                                    width: `calc(100% - ${indent}px)`,
                                                    marginLeft: `${indent}px`,
                                                    marginTop: "10px",
                                                    marginBottom: "10px",
                                                    paddingLeft: "12px",
                                                    borderLeft: "2px solid #cbd5e1",
                                                    backgroundColor: "#fff",
                                                    position: "relative",
                                                    boxSizing: "border-box"
                                                } : undefined}>
                                                {depth > 0 && (
                                                    <span aria-hidden="true" style={{ position: "absolute", left: "-22px", top: "10px", color: "#7b8794" }}>↳</span>
                                                )}
                                                <div className="detail-comment-info" style={{ borderBottom: "1px dashed #d5dce3", paddingBottom: "6px", flexWrap: "wrap" }}>
                                                    <strong>{comment.deleted ? "삭제된 댓글" : comment.writer}</strong>
                                                    {/* 답글은 모두 표시, 수정은 작성자만, 삭제는 작성자와 관리자 */}
                                                    {!comment.deleted && (
                                                        <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
                                                            <button
                                                                type="button"
                                                                style={{ marginLeft: 0 }}
                                                                onClick={() => {
                                                                    setReplyToId(comment.id);
                                                                    setReplyContent("");
                                                                }}>
                                                                답글
                                                            </button>
                                                            {isBoardAuthor(comment, currentUser) && (
                                                                <button type="button" style={{ marginLeft: 0 }} onClick={() => startEditComment(comment)}>수정</button>
                                                            )}
                                                            {(isAdmin || isBoardAuthor(comment, currentUser)) && (
                                                                <button type="button" style={{ marginLeft: 0 }} onClick={() => delComment(comment.id)}>삭제</button>
                                                            )}
                                                        </div>
                                                    )}
                                                    <span style={{ marginLeft: comment.deleted ? "auto" : "12px", whiteSpace: "nowrap" }}>{comment.date}</span>
                                                </div>
                                                {editingCommentId !== null &&
                                                String(editingCommentId) === String(comment.id) &&
                                                !comment.deleted && isBoardAuthor(comment, currentUser) ? (
                                                    <form className="detail-comment-write" onSubmit={saveEditComment}>
                                                        <textarea
                                                            placeholder="댓글 내용을 입력하세요"
                                                            value={editCommentContent}
                                                            onChange={(e) => setEditCommentContent(e.target.value)}/>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                                            <button type="button" onClick={() => setEditingCommentId(null)}>취소</button>
                                                            <button type="submit">수정 완료</button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <p>{comment.deleted ? "삭제된 댓글입니다." : comment.content}</p>
                                                )}
                                            </div>
                                            {replyToId !== null && String(replyToId) === String(comment.id) && !comment.deleted && (
                                                <form
                                                    className="detail-comment-write"
                                                    style={{ width: `calc(100% - ${replyIndent}px)`, marginLeft: `${replyIndent}px`, boxSizing: "border-box" }}
                                                    onSubmit={(e) => addReply(e, comment)}>
                                                    <textarea
                                                        placeholder="답글 내용을 입력하세요"
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}/>
                                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                                        <button type="button" onClick={() => { setReplyToId(null); setReplyContent(""); }}>취소</button>
                                                        <button type="submit">답글 등록</button>
                                                    </div>
                                                </form>
                                            )}
                                        </React.Fragment>
                                        );
                                    })}
                                    {/* 댓글 입력 폼 */}
                                    <hr />
                                    <form
                                        className="detail-comment-write"
                                        onSubmit={addComment}>
                                        <textarea
                                            placeholder="댓글 내용을 입력하세요"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}/>
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
                                                        }}>
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
