import React from "react";
import { useNavigate } from "react-router-dom";

function NoticeDetailPage({posts, setPosts, postId}){

    const navi = useNavigate()

    const post = posts.find(
        (item) => String(item.id) === String(postId)
    )

    

    return(
        <div></div>
    )
}

export default NoticeDetailPage