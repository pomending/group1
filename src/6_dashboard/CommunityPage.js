import React, { useState } from "react";


function CommunityPage(){

    //게시글 목록
    const [posts, setPost] = useState( () => {
        const savedPosts = localStorage.getItem("commuityPosts");
        return savedPosts ? JSON.parse(savedPosts) : [];
    })

    //글쓰기 입력값
    const [title, setTitle] = useState("")
    const [writer, setWriter] = useState("")
    const [content, setContent] = useState("")

    // 선택한 게시글
    const [selectedPost, setSelectedPost] = useState(null)

    //게시글 등록
    const addPost = () => {
        if(!title.trim() || !writer.trim() || !content.trim()){
            alert("제목, 작성자, 내용을 모두 입력해")
            return;
        }

        const newPost = {
            id: Date.now(),
            title: title,
            writer: writer,
            content: content,
            date: new Date().toLocaleDateString("ko-KR")
        }

        const newPosts = [...posts, newPost]

        setPost(newPosts)

        //작성한 글 저장
        localStorage.setItem("communityPosts", JSON.stringify(newPosts))

        //입력창 비우기
        setTitle("")
        setWriter("")
        setContent("")
    }


    return(
        <div className="community">

            <h1>사내 커뮤니티</h1>
            <p>직원들과 자유롭게 소통하는 공간</p>

            <div className="community-board">
                <h3>게시글 목록</h3>

                <table>
                    <thead>
                        <tr>
                            <th>번호</th>
                            <th>제목</th>
                            <th>작성자</th>
                            <th>작성일</th>
                        </tr>
                    </thead>

                    <tbody>
                        {posts.map( (post, index) => (
                            <tr key={post.id}>
                                <td>{index + 1}</td>
                                <td>
                                    <button className="post-title"
                                    onClick={()=> setSelectedPost(post)}>
                                    {post.title}
                                    </button>
                                </td>
                                <td>{post.writer}</td>
                                <td>{post.date}</td>
                            </tr>
                         ))}
                    </tbody>
                </table>

                {/* 게시글이 없을 때 */}
                {posts.length === 0 && (
                    <p className="community-empty">
                        등록된 게시글이 없습니다
                    </p>
                )}

                {/* 게시글 내용 보기 */}
                {selectedPost && (
                    <div className="community-detail">
                        <h3>{selectedPost.title}</h3>
                        <p>작성자: {selectedPost.writer}</p>
                        <p>작성일: {selectedPost.date}</p>
                        <hr/>
                        <p>{selectedPost.content}</p>

                        <button onClick={() => setSelectedPost(null)}>
                            닫기
                        </button>
                    </div>
                )}
            </div>

        </div>

    )

}


export default CommunityPage