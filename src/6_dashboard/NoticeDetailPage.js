
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CommunityDetail.css";


function NoticeDetailPage({ posts, setPosts, postId }) {

    const navigate = useNavigate();

    // 현재 선택한 공지사항 찾기
    // find는 조건에 맞는 데이터 하나를 가져오는 함수
    const post = posts.find(
        (item) => String(item.id) === String(postId)
    );

    // 댓글 입력값
    const [writer, setWriter] = useState("");
    const [content, setContent] = useState("");

    // 댓글을 게시글마다 따로 저장하기 위한 이름
    // 예: noticeComments_15
    const commentKey = "noticeComments_" + postId;

    // 저장된 댓글 불러오기
    const [comments, setComments] = useState(() => {

        const saved = localStorage.getItem(commentKey);

        // 저장된 댓글이 없으면 빈 배열
        if (!saved) {
            return [];
        }

        try {
            // 저장된 문자열을 배열로 바꿈
            const data = JSON.parse(saved);
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    });


    // 댓글 등록
    const addComment = (e) => {

        // form 제출 시 새로고침 방지
        e.preventDefault();

        // 빈칸 검사
        if (!writer.trim() || !content.trim()) {
            alert("작성자와 댓글 내용을 입력하세요.");
            return;
        }

        // 댓글 번호 만들기
        let newId = Date.now();

        // 댓글 번호 중복 방지
        for (let i = 0; i < comments.length; i++) {
            if (Number(comments[i].id) >= newId) {
                newId = Number(comments[i].id) + 1;
            }
        }

        // 새로운 댓글
        const newComment = {
            id: newId,
            writer: writer.trim(),
            content: content.trim(),
            date: new Date().toLocaleDateString("ko-KR")
        };

        // 기존 댓글에 새 댓글 추가
        const newComments = [...comments, newComment];

        // 화면과 브라우저에 저장
        setComments(newComments);
        localStorage.setItem(commentKey, JSON.stringify(newComments));

        // 입력창 초기화
        setWriter("");
        setContent("");
    };


    // 댓글 삭제
    const delComment = (commentId) => {

        // 삭제 확인
        if (!window.confirm("댓글을 삭제하겠습니까?")) {
            return;
        }

        // filter로 삭제할 댓글을 제외한 나머지만 가져옴
        const newComments = comments.filter(
            (comment) => comment.id !== commentId
        );

        // 삭제 결과 저장
        setComments(newComments);
        localStorage.setItem(commentKey, JSON.stringify(newComments));
    };


    // 공지사항 삭제
    const deletePost = () => {

        // 삭제 확인
        if (!window.confirm("공지사항을 삭제하시겠습니까?")) {
            return;
        }

        // 현재 공지사항을 제외한 게시글 목록
        const newPosts = posts.filter(
            (item) => String(item.id) !== String(postId)
        );

        // 삭제된 목록 저장
        setPosts(newPosts);
        localStorage.setItem("noticePosts", JSON.stringify(newPosts));

        // 삭제한 공지사항의 댓글도 삭제
        localStorage.removeItem(commentKey);

        // 공지사항 목록으로 이동
        navigate("/?page=notice");
    };


    return (
        <div className="community">

            <Link to="/?page=notice" className="community-back">
                ← 공지사항 목록으로
            </Link>

            <div className="community-board">

                {/* 게시글이 존재하면 상세 내용 출력 */}
                {post ? (
                    <div>

                        {/* 게시글 제목 */}
                        <h1>{post.title}</h1>

                        {/* 게시글 정보 */}
                        <div className="community-info">

                            <span>
                                구분: {post.type === "important"
                                    ? "중요공지"
                                    : "일반 공지"}
                            </span>

                            <span>작성자: {post.writer}</span>
                            <span>작성일: {post.date}</span>

                        </div>

                        {/* 게시글 내용 */}
                        <div className="community-content">
                            {post.content}
                        </div>


                        {/* 댓글 목록 */}
                        <div className="detail-comments">

                            <h3>댓글 ({comments.length})</h3>

                            {/* 댓글이 없을 때 */}
                            {comments.length === 0 && (
                                <p className="detail-comment-empty">
                                    등록된 댓글이 없습니다.
                                </p>
                            )}

                            {/* 댓글을 하나씩 출력 */}
                            {comments.map((comment) => (
                                <div
                                    className="detail-comment-item"
                                    key={comment.id}
                                >
                                    <div className="detail-comment-info">

                                        <strong>{comment.writer}</strong>
                                        <span>{comment.date}</span>

                                        {/* 댓글 삭제 버튼 */}
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
                    </div>
                ) : (
                    // 게시글을 찾지 못했을 때
                    <p>공지사항을 찾을 수 없습니다.</p>
                )}


                {/* 화면 이동 및 삭제 버튼 */}
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

                    {/* 게시글이 있을 때만 삭제 버튼 표시 */}
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
