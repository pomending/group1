
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import "./CommunityDetail.css";
import "./CommunityWrite.css";
import { getBoardUser, isBoardAuthor } from "./MyPage";


function NoticeDetailPage({ posts, setPosts, postId }) {

    const navigate = useNavigate();

    // 현재 공지사항
    const post = posts.find(
        (item) => String(item.id) === String(postId)
    );

    const { currentUser: account } = useERP();
    const isAdmin = account?.status === "활성" && account?.role === "ADMIN";
    const canWrite = isAdmin || (account?.status === "활성" && account?.role === "MANAGER");
    const currentUser = getBoardUser();
    const canEditPost = isBoardAuthor(post, currentUser) &&
        (isAdmin || (canWrite && post?.type === "normal"));
    const canDeletePost = isAdmin || canEditPost;


    // 하단 공지 목록 · 현재 페이지
    const sortedPosts = [...posts].sort((a, b) => Number(b.id) - Number(a.id));
    const initialIndex = sortedPosts.findIndex(item => String(item.id) === String(postId));
    const [listPage, setListPage] = useState(() => Math.floor(Math.max(0, initialIndex) / 15) + 1);
    const totalListPages = Math.max(1, Math.ceil(sortedPosts.length / 15));
    const activeListPage = Math.min(listPage, totalListPages);
    const listStart = (activeListPage - 1) * 15;
    const visibleListPosts = sortedPosts.slice(listStart, listStart + 15);


    // 공지사항 수정 · 전체 유형
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editType, setEditType] = useState("normal");
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");

    const startEditPost = () => {
        if (!canEditPost) return;
        setEditType(post.type);
        setEditTitle(post.title);
        setEditContent(post.content);
        setIsEditingPost(true);
    };

    const saveEditPost = (e) => {
        e.preventDefault();
        if (!canEditPost || !isBoardAuthor(post, getBoardUser())) {
            alert("이 공지사항을 수정할 권한이 없습니다.");
            return;
        }
        if (editType !== "normal" && (!isAdmin || editType !== "important")) {
            alert("중요공지는 관리자만 작성하거나 수정할 수 있습니다.");
            return;
        }
        if (
            !editTitle.trim() ||
            !editContent.trim()
        ) {
            alert("제목과 내용을 모두 입력하세요.");
            return;
        }

        const newPosts = posts.map((item) =>
            String(item.id) === String(postId)
                ? {
                    ...item,
                    type: editType,
                    title: editTitle.trim(),
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


    const deletePost = () => {
        if (!post || (!isAdmin && !canEditPost)) {
            alert("이 공지사항을 삭제할 권한이 없습니다.");
            return;
        }
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
        navigate("/?page=notice");
    };

    return (
        <div className="community">
            <div className="community-board">
                {post ? (
                    <div>
                        {/* 공지 수정 폼 */}
                        {isEditingPost && canEditPost ? (
                            <form
                                className="community-write"
                                onSubmit={saveEditPost}>
                                <h1>공지사항 수정</h1>
                                {/* 수정 중 이동·삭제 */}
                                <div className="community-actions detail-top-actions">
                                    <Link to="/?page=notice" className="community-cancel">목록으로</Link>
                                    {canWrite && <Link to="/?page=notice-write" className="community-button">글쓰기</Link>}
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
                                    }>
                                    <option value="normal">
                                        일반 공지
                                    </option>
                                    {isAdmin && (
                                        <option value="important">중요 공지</option>
                                    )}
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
                                    }/>
                                <label htmlFor="notice-edit-content">
                                    내용
                                </label>
                                <textarea
                                    id="notice-edit-content"
                                    value={editContent}
                                    onChange={(e) =>
                                        setEditContent(e.target.value)
                                    }/>
                                <div className="community-actions">
                                    <button
                                        type="button"
                                        className="community-cancel"
                                        onClick={() =>
                                            setIsEditingPost(false)
                                        }>
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        className="community-button">
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
                                        {canWrite && <Link to="/?page=notice-write" className="community-button">글쓰기</Link>}
                                        {canEditPost && (
                                            <button
                                                type="button"
                                                className="community-button"
                                                onClick={startEditPost}
                                            >수정</button>
                                        )}
                                        {canDeletePost && (
                                            <button type="button" className="community-cancel" onClick={deletePost}>삭제</button>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="community-content"
                                    style={{ minHeight: "180px" }}>
                                    {post.content}
                                </div>
                            </>
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
                                                    }}>
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
                        {canWrite && <Link to="/?page=notice-write" className="community-button">글쓰기</Link>}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NoticeDetailPage;
