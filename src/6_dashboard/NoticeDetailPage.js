
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CommunityDetail.css";

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

    // 댓글 등록 (일반 공지에서만 가능)
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
        localStorage.setItem(commentKey, JSON.stringify(newComments));

        setWriter("");
        setContent("");
    };

    // 댓글 삭제 (일반 공지에서만 가능)
    const delComment = (commentId) => {

        if (!showComments) return;

        if (!window.confirm("댓글을 삭제하겠습니까?")) {
            return;
        }

        const newComments = comments.filter(
            (comment) => comment.id !== commentId
        );

        setComments(newComments);
        localStorage.setItem(commentKey, JSON.stringify(newComments));
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
        localStorage.setItem("noticePosts", JSON.stringify(newPosts));
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

                        <h1>{post.title}</h1>

                        <div className="community-info">

                            {/* 구분은 표시하지 않고 작성자와 작성일만 표시 */}
                            <span>작성자: {post.writer}</span>
                            <span>작성일: {post.date}</span>

                        </div>

                        <div className="community-content">
                            {post.content}
                        </div>

                        {/* 일반 공지일 때만 댓글 표시 */}
                        {/* 중요공지에서는 댓글 영역을 만들지 않음 */}
                        {showComments && (

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

                                            <button
                                                type="button"
                                                onClick={() => delComment(comment.id)}
                                            >
                                                삭제
                                            </button>

                                        </div>

                                        <p>{comment.content}</p>

                                    </div>
                                ))}

                                {/* 댓글 작성 */}
                                <hr />

                                <form
                                    className="detail-comment-write"
                                    onSubmit={addComment}
                                >
                                    <input
                                        type="text"
                                        placeholder="작성자 이름"
                                        value={writer}
                                        onChange={(e) => setWriter(e.target.value)}
                                    />

                                    <textarea
                                        placeholder="댓글 내용을 입력하세요"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
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

                {/* 기존 버튼 유지 */}
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
