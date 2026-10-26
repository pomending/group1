
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CommunityDetail.css";

function CommunityDetailPage({ posts, setPosts, postId }) {

    const navi = useNavigate();

    // 현재 선택한 게시글 찾기
    const post = posts.find(
        (item) => String(item.id) === String(postId)
    );

    //댓글을 작성할 때 입력하는 값
    const[writer, setWriter] = useState("")
    const[content, setContent] = useState("")

    //게시글에 저장된 댓글 불러오기
    const commentKey = "communityComments_" + postId

    const[comments, setComments] = useState(()=>{
        const saved = localStorage.getItem(commentKey)

        if(!saved){
            return []
        }

        try{
            return JSON.parse(saved)
        }catch{
            return []
        }
    })


    //댓글 등록
    const addComment = (e) => {

        //댓글등록시 새로고침방지
        e.preventDefault()

        //빈칸 확인
        if(!writer.trim() || !content.trim()){
            alert("작성자와 댓글 내용을 입력하세요")
            return
        }

    

    //새로운 댓글
    const newComment = {
        id: Date.now(),
        writer: writer.trim(),
        content: content.trim(),
        date: new Date().toLocaleDateString("ko-KR")
    }

    //기존 댓글에 새 댓글 추가
    const newComments = [...comments, newComment]

    //화면과 브라우저에 저장
    setComments(newComments)
    localStorage.setItem(commentKey, JSON.stringify(newComments))

    //입력창 비우기
    setWriter("")
    setContent("")
    }

    //댓글 삭제
    const delComment = (commentId) => {

        if(!window.confirm("댓글을 삭제하겠습니까?")){
            return
        }

        const newComments = comments.filter(
            (comment) => comment.id !== commentId
        )

        setComments(newComments)
        //삭제상태 저장
        localStorage.setItem("commentKey", JSON.stringify(newComments))
    }

    // 게시글 삭제
    const delePost = () => {

        // 삭제 확인
        if (!window.confirm("게시글을 삭제하시겠습니까?")) {
            return;
        }

        // 선택한 게시글을 제외한 나머지 글
        const newPosts = posts.filter(
            (item) => String(item.id) !== String(postId)
        );

        // 삭제 결과 저장
        setPosts(newPosts);
        localStorage.setItem("communityPosts", JSON.stringify(newPosts));

        //게시글에 달린 댓글도 삭제
        localStorage.removeItem(commentKey)

        //목록으로 이동
        navi("/?page=community");
    };


    return (
        <div className="community">

            <Link to="/?page=community" className="community-back">
                ← 게시글 목록으로
            </Link>

            <div className="community-board">

                {/* 게시글 내용 */}
                {post ? (
                    <div>

                        <h1>{post.title}</h1>

                        <div className="community-info">
                            <span>작성자: {post.writer}</span>
                            <span>작성일: {post.date}</span>
                        </div>

                        <div className="community-content">
                            {post.content}
                        </div>

                    <div className="detail-comments">
                        <h3>댓글 ({comments.length})</h3>
                        {comments.length === 0 && (
                            <p className="detail-comment-empty">
                                등록된 댓글이 없습니다.
                                </p>)}

                    {comments.map((comment)=>(
                        <div className="detail-comment-item"
                            key={comment.id}>
                                <div className="detail-comment-info">

                                    <strong>{comment.writer}</strong>
                                    <span>{comment.date}</span>

                                    {/* 댓글 삭제 버튼 */}
                                    <button type="button"
                                        onClick={()=>delComment(comment.id)}>
                                            삭제
                                        </button>
                                </div>
                                {/* 댓글내용 */}
                                <p>{comment.content}</p>
                            </div> 
                    ))}

                {/* 댓글작성 */}
                    <hr/>
                <form className="detail-comment-write"
                    onSubmit={addComment}>
                    <input type="text" placeholder="작성자이름"
                        value={writer} onChange={(e)=> setWriter(e.target.value)}/>

                    <textarea placeholder="댓글 내용을 입력하세요"
                        value={content} onChange={(e)=>setContent(e.target.value)}/>

                    <button type="submit">
                        댓글 등록
                    </button>
                    
                </form>
                                
                    </div>

                    </div>
                ) : (<p>게시글을 찾을 수 없습니다.</p>)}

                {/* 화면 이동 및 삭제 버튼 */}
                <div className="community-actions">

                    <Link to="/?page=community"
                        className="community-cancel">
                        목록으로
                    </Link>

                    <Link to="/?page=write"
                        className="community-button">
                        글쓰기
                    </Link>

                    {/* 글이 있을 때만 삭제 버튼 표시 */}
                    {post && (
                        <button className="community-cancel"
                            onClick={delePost}> 
                            삭제 
                        </button>
                    )}

                </div>

            </div>
        </div>
    );
}

export default CommunityDetailPage;
