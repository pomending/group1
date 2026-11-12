import react, { useEffect, useState } from "react"

const STORAGE_KEY = "home_inquiries"
const CHANGE_EVENT = "home-inquiries-changed"

const getNum = (orderNo) => {
    const text = String(orderNo || "").trim()
    const parts = text.split("-")
    let digits = ""

    if (parts.length === 1) {
        digits = parts[0]
    } else if (parts.length === 2) {
        if (!/^[A-Za-z]+$/.test(parts[0])) return null
        digits = parts[1]
    } else {
        return null
    }

    if (!/^[0-9]+$/.test(digits)) return null
    const num = Number(digits)
    if (!Number.isSafeInteger(num) || num < 1) return null
    return num
}


const loadPosts = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === null) return []
        const posts = JSON.parse(saved)
        if (!Array.isArray(posts)) return null

        for (let i = 0; i < posts.length; i++) {
            const post = posts[i]
            if (!post || typeof post !== "object" || Array.isArray(post)) return null
            const num = getNum(post.orderNo)
            if (num !== null) post.consultationId = num
        }
        return posts
    } catch (error) {
        console.error("문의글 불러오기 실패", error)
        return null
    }
}

const trimPost = (input) => {
    const post = { ...input }
    const keys = ["companyName", "customerManager", "phone", "email", "orderNo", "title", "content"]
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (typeof post[key] === "string") post[key] = post[key].trim()
    }
    return post
}

const checkInput = (post) => {
    if (!post) return false
    if (!String(post.customerManager || "").trim()) return false
    if (!String(post.phone || "").trim() && !String(post.email || "").trim()) return false
    if (!String(post.title || "").trim()) return false
    if (!String(post.content || "").trim()) return false
    return true
}

const getPhone = (post) => {
    if (typeof post.phone === "string") return post.phone
    if (typeof post.contact === "string" && !post.contact.includes("@")) return post.contact
    return ""
}

const getEmail = (post) => {
    if (typeof post.email === "string") return post.email
    if (typeof post.contact === "string" && post.contact.includes("@")) return post.contact
    return ""
}

function useClaimData() {
    const [claim, setClaim] = useState([])

    useEffect(() => {

    }, [])

    const savePosts = (posts) => {

    }

    const addClaim = (newClaim) => {
        setClaim([...claim, {}])
    }

    const updateClaim = (updatedClaim) => {

    }

    const deleteClaim = (id) => {

    }

    const checkOrder = (id, orderNo) => {

    }

    return {
        claim,
        addClaim,
        updateClaim,
        deleteClaim,
        checkOrder,
        getPhone,
        getEmail
    }
}

export default useClaimData