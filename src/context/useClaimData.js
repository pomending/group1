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
    const [claim, setClaim] = useState(() => loadPosts() || [])

    useEffect(() => {
        const reload = () => {
            const posts = loadPosts()
            if (posts === null) setClaim([])
            else setClaim(posts)
        }
        const onStorage = (event) => {
            if (event.key === STORAGE_KEY) reload()
        }
        reload()
        window.addEventListener("storage", onStorage)
        window.addEventListener(CHANGE_EVENT, reload)
        return () => {
            window.removeEventListener("storage", onStorage)
            window.removeEventListener(CHANGE_EVENT, reload)
        }
    }, [])

    const savePosts = (posts) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
            setClaim(posts)
            window.dispatchEvent(new Event(CHANGE_EVENT))
            return { ok: true }
        } catch (error) {
            console.error("문의글 저장 실패", error)
            return { ok: false, message: "문의글을 저장하지 못했습니다." }
        }
    }

    const addClaim = (newClaim) => {
        const posts = loadPosts()
        if (posts === null) return { ok: false, message: "저장된 글을 읽지 못했습니다." }
        if (!checkInput(newClaim)) return { ok: false, message: "필수 항목과 연락처를 입력해 주세요." }
        const item = trimPost(newClaim)
        const num = getNum(item.orderNo)
        if (num === null) return { ok: false, message: "올바른 주문번호를 입력해 주세요." }

        let id = 1
        for (let i = 0; i < posts.length; i++) {
            if (Number(posts[i].id) >= id) id = Number(posts[i].id) + 1
        }
        const post = {
            ...item, id: id, consultationId: num,
            status: "접수", createdAt: new Date().toLocaleDateString("sv-SE")
        }
        const result = savePosts([post, ...posts])
        if (result.ok) return { ok: true, id: id }
        return result
    }

    const updateClaim = (updatedClaim) => {
        if (!updatedClaim || updatedClaim.id === undefined) {
            return { ok: false, message: "수정할 글이 없습니다." }
        }
        const posts = loadPosts()
        if (posts === null) return { ok: false, message: "저장된 글을 읽지 못했습니다." }

        let index = -1
        for (let i = 0; i < posts.length; i++) {
            if (Number(posts[i].id) === Number(updatedClaim.id)) index = i
        }
        if (index === -1) return { ok: false, message: "수정할 글이 없습니다." }

        const post = { ...posts[index] }
        for (const key in updatedClaim) {
            if (key !== "id" && key !== "consultationId" && updatedClaim[key] !== undefined) {
                post[key] = updatedClaim[key]
            }
        }
        const item = trimPost(post)
        const changedInfo = updatedClaim.customerManager !== undefined || updatedClaim.phone !== undefined ||
            updatedClaim.email !== undefined || updatedClaim.title !== undefined || updatedClaim.content !== undefined
        if (changedInfo && !checkInput(item)) {
            return { ok: false, message: "필수 항목과 연락처를 입력해 주세요." }
        }
        if (updatedClaim.orderNo !== undefined) {
            const num = getNum(item.orderNo)
            if (num === null) return { ok: false, message: "올바른 주문번호를 입력해 주세요." }
            item.consultationId = num
        }
        posts[index] = item
        return savePosts(posts)
    }

    const deleteClaim = (id) => {
        const posts = loadPosts()
        if (posts === null) return { ok: false, message: "저장된 글을 읽지 못했습니다." }
        const updated = posts.filter(post => Number(post.id) !== Number(id))
        if (updated.length === posts.length) return { ok: false, message: "삭제할 글이 없습니다." }
        return savePosts(updated)
    }

    const checkOrder = (id, orderNo) => {
        const posts = loadPosts()
        if (posts === null) return false
        for (let i = 0; i < posts.length; i++) {
            if (Number(posts[i].id) === Number(id)) {
                return String(orderNo).trim() !== "" && String(orderNo).trim() === posts[i].orderNo
            }
        }
        return false
    }

    return { claim, addClaim, updateClaim, deleteClaim, checkOrder, getPhone, getEmail }
}

export default useClaimData