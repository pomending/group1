
import React, { useEffect, useRef, useState } from "react";
import "./HomeInquiry.css";

// 게시글 번호가 겹치지 않도록 다음 번호를 찾습니다.
function nextId(posts) {
    let id = 1;
    for (let i = 0; i < posts.length; i++) {
        if (Number(posts[i].id) >= id) id = Number(posts[i].id) + 1;
    }
    return id;
}

// 저장된 글을 불러오고, 예시 글은 처음 한 번만 추가합니다.
function loadPosts() {
    let posts = [];
    try {
        const saved = localStorage.getItem("home_inquiries");
        if (saved) {
            const data = JSON.parse(saved);
            if (!Array.isArray(data)) return [];
            posts = data.filter(post => post && typeof post === "object" && !Array.isArray(post));
        }

        if (localStorage.getItem("home_inquiries_samples_added") === "true") return posts;

        const samples = [
            {
                id: 1, companyName: "한빛굿즈", customerManager: "김민수",
                phone: "010-0000-0001", email: "", orderNo: "GO-3001",
                inquiryType: "제품 불량", title: "스테인리스 텀블러 뚜껑 불량 문의",
                content: "납품받은 텀블러 중 일부 제품의 뚜껑이 제대로 닫히지 않습니다.\n불량 제품의 교환 가능 여부를 확인 부탁드립니다.",
                photo: "", status: "접수", createdAt: "2026-11-10"
            },
            {
                id: 2, companyName: "새봄기획", customerManager: "이서연",
                phone: "", email: "sample@example.com", orderNo: "GO-3002",
                inquiryType: "배송 문제", title: "주문한 상품 일부가 도착하지 않았습니다",
                content: "주문한 굿즈 중 일부 수량이 누락되어 배송됐습니다.\n남은 상품의 배송 일정을 알려주세요.",
                photo: "", status: "처리 중", createdAt: "2026-11-11"
            }
        ];

        let id = nextId(posts);
        for (let i = 0; i < samples.length; i++) {
            let exists = false;
            for (let j = 0; j < posts.length; j++) {
                if (posts[j].orderNo === samples[i].orderNo && posts[j].title === samples[i].title) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                samples[i].id = id;
                id++;
                posts.unshift(samples[i]);
            }
        }

        localStorage.setItem("home_inquiries", JSON.stringify(posts));
        localStorage.setItem("home_inquiries_samples_added", "true");
    } catch (error) {
        // 불러오기에 실패해도 기존에 읽은 목록은 유지합니다.
    }
    return posts;
}

// 이전 버전에서 연락처 한 칸으로 저장된 글도 읽습니다.
function getPhone(post) {
    if (typeof post.phone === "string") return post.phone;
    if (typeof post.contact === "string" && !post.contact.includes("@")) return post.contact;
    return "";
}

function getEmail(post) {
    if (typeof post.email === "string") return post.email;
    if (typeof post.contact === "string" && post.contact.includes("@")) return post.contact;
    return "";
}

function HomeInquiry({ isMaster = false }) {
    const [list, setList] = useState(loadPosts);
    const [page, setPage] = useState("list");
    const [selectedId, setSelectedId] = useState(null);
    const [editing, setEditing] = useState(false);
    const [verified, setVerified] = useState(false);
    const [checkNo, setCheckNo] = useState("");
    const [error, setError] = useState("");

    const [companyName, setCompanyName] = useState("");
    const [customerManager, setCustomerManager] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [orderNo, setOrderNo] = useState("");
    const [inquiryType, setInquiryType] = useState("제품 불량");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [photo, setPhoto] = useState("");
    const [photoLoading, setPhotoLoading] = useState(false);
    const photoReader = useRef(null);

    const [sharedMaster, setSharedMaster] = useState(() => sessionStorage.getItem("homepage_master") === "true");
    const master = isMaster || sharedMaster;
    const selected = list.find(post => post.id === selectedId);
    const hasContact = phone.trim() !== "" || email.trim() !== "";
    const canSave = customerManager.trim() !== "" && hasContact &&
        orderNo.trim() !== "" && title.trim() !== "" && content.trim() !== "";

    // 상단바의 마스터 모드 변경을 반영합니다.
    useEffect(() => {
        function updateMaster() {
            setSharedMaster(sessionStorage.getItem("homepage_master") === "true");
        }
        window.addEventListener("homepage-master-changed", updateMaster);
        return () => window.removeEventListener("homepage-master-changed", updateMaster);
    }, []);

    // 다른 탭에서 게시글을 바꿨다면 다시 불러옵니다.
    useEffect(() => {
        function onStorage(e) {
            if (e.key === "home_inquiries") setList(loadPosts());
        }
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    useEffect(() => {
        if (!master) setVerified(false);
    }, [master]);

    // 마스터로 전환하면 기존 글 수정 화면을 닫습니다.
    useEffect(() => {
        if (master && editing) {
            setEditing(false);
            setPage("detail");
        }
    }, [master, editing]);

    // 다른 탭에서 삭제된 게시글을 열고 있으면 목록으로 돌아갑니다.
    useEffect(() => {
        if (page === "detail" && selectedId !== null && !selected) {
            setSelectedId(null);
            setVerified(false);
            setPage("list");
        }
    }, [page, selectedId, selected]);

    useEffect(() => {
        return () => {
            if (photoReader.current) photoReader.current.abort();
        };
    }, []);

    function removePhoto() {
        if (photoReader.current) photoReader.current.abort();
        photoReader.current = null;
        setPhoto("");
        setPhotoLoading(false);
    }

    // 글을 새로 쓰면 빈 칸으로, 수정하면 기존 내용으로 채웁니다.
    function fillForm(post) {
        setCompanyName(post.companyName || post.company || "");
        setCustomerManager(post.customerManager || post.manager || "");
        setPhone(getPhone(post));
        setEmail(getEmail(post));
        setOrderNo(post.orderNo || "");
        setInquiryType(post.inquiryType || post.type || "제품 불량");
        setTitle(post.title || "");
        setContent(post.content || "");
        removePhoto();
        setPhoto(post.photo || "");
        setError("");
        setPage("write");
    }

    function write() {
        setEditing(false);
        setSelectedId(null);
        setVerified(false);
        fillForm({});
    }

    function edit() {
        if (!selected || master || !verified) return;
        setEditing(true);
        fillForm(selected);
    }

    // 사진은 JPG, PNG, WEBP 한 장만 첨부합니다. (1MB 이하)
    function addPhoto(e) {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = "";

        if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/webp") {
            setError("JPG, PNG, WEBP 사진만 첨부할 수 있습니다.");
            return;
        }
        if (file.size > 1024 * 1024) {
            setError("사진은 1MB 이하만 첨부할 수 있습니다.");
            return;
        }

        removePhoto();
        setError("");
        setPhotoLoading(true);
        const reader = new FileReader();
        photoReader.current = reader;

        reader.onload = function () {
            if (photoReader.current !== reader) return;
            setPhoto(reader.result);
            setPhotoLoading(false);
            photoReader.current = null;
        };

        reader.onerror = function () {
            if (photoReader.current !== reader) return;
            setError("사진을 읽지 못했습니다.");
            setPhotoLoading(false);
            photoReader.current = null;
        };

        reader.readAsDataURL(file);
    }

    // 저장에 성공해야만 화면의 목록을 바꿉니다.
    function saveList(posts, message) {
        try {
            localStorage.setItem("home_inquiries", JSON.stringify(posts));
            setList(posts);
            setError("");
            return true;
        } catch (error) {
            setError(message);
            return false;
        }
    }

    // 등록과 수정은 같은 객체 형식으로 저장합니다.
    function save(e) {
        e.preventDefault();

        if (!canSave) {
            setError("전화번호나 이메일 중 하나와 필수 항목을 입력해 주세요.");
            return;
        }
        if (photoLoading) return;
        if (editing && (!selected || master || !verified)) {
            setError("수정 권한을 확인해 주세요.");
            return;
        }

        const posts = loadPosts();
        let item = null;

        if (editing) {
            // 기존 글을 찾아 나머지 속성은 그대로 유지합니다.
            for (let i = 0; i < posts.length; i++) {
                if (posts[i].id === selectedId) {
                    item = posts[i];
                    break;
                }
            }
            if (!item) {
                setError("수정할 문의글이 없습니다.");
                return;
            }
            if (!item.status) item.status = "접수";
            if (!item.createdAt) item.createdAt = item.date || new Date().toLocaleDateString("sv-SE");
        } else {
            item = {
                id: nextId(posts),
                status: "접수",
                createdAt: new Date().toLocaleDateString("sv-SE")
            };
            posts.unshift(item);
        }

        // 새 글과 수정 글에 입력된 내용을 넣습니다.
        item.companyName = companyName.trim();
        item.customerManager = customerManager.trim();
        item.phone = phone.trim();
        item.email = email.trim();
        item.orderNo = orderNo.trim();
        item.inquiryType = inquiryType;
        item.title = title.trim();
        item.content = content.trim();
        item.photo = photo;

        if (!saveList(posts, "문의글을 저장하지 못했습니다.")) return;

        setEditing(false);
        if (editing) {
            setPage("detail");
        } else {
            setSelectedId(null);
            setVerified(false);
            setPage("list");
        }
    }

    // 고객은 주문번호를 확인한 뒤, 마스터는 바로 삭제할 수 있습니다.
    function remove() {
        if (!selected || (!master && !verified)) return;
        if (!window.confirm("이 문의글을 삭제하시겠습니까?")) return;

        const posts = loadPosts();
        const updated = posts.filter(post => post.id !== selectedId);

        if (updated.length === posts.length) {
            setError("삭제할 문의글이 없습니다.");
            return;
        }
        if (saveList(updated, "문의글을 삭제하지 못했습니다.")) back();
    }

    // 마스터만 처리 상태를 변경합니다.
    function changeStatus(e) {
        if (!master || !selected) return;

        const posts = loadPosts();
        let found = false;

        for (let i = 0; i < posts.length; i++) {
            if (posts[i].id === selectedId) {
                posts[i].status = e.target.value;
                found = true;
                break;
            }
        }
        if (!found) {
            setError("문의글을 찾을 수 없습니다.");
            return;
        }
        saveList(posts, "처리 상태를 저장하지 못했습니다.");
    }

    function open(item) {
        setSelectedId(item.id);
        setVerified(false);
        setCheckNo("");
        setError("");
        setPage("detail");
    }

    function check(e) {
        e.preventDefault();
        if (selected && checkNo.trim() && checkNo.trim() === selected.orderNo) {
            setVerified(true);
            setError("");
        } else {
            setError("주문번호가 일치하지 않습니다.");
        }
    }

    function back() {
        removePhoto();
        setError("");
        if (editing && selected) {
            setEditing(false);
            setPage("detail");
        } else {
            setSelectedId(null);
            setVerified(false);
            setCheckNo("");
            setPage("list");
        }
    }

    return (
        <main className="inq">
            <div className="inq-inner">
                {/* 문의 목록 */}
                {page === "list" && (
                    <section>
                        <header className="inq-head">
                            <p>GOODS / CLAIM</p>
                            <h1>클레임 문의</h1>
                            <span>등록된 문의를 확인하거나 새로운 문의를 작성할 수 있습니다.</span>
                        </header>
                        <div className="inq-bar">
                            <h2>문의 목록</h2>
                            <button type="button" onClick={write}>문의 작성 +</button>
                        </div>
                        <table className="inq-table">
                            <thead><tr><th>제목</th><th>처리 상태</th><th>등록일</th></tr></thead>
                            <tbody>
                                {list.length === 0 && <tr><td className="inq-empty" colSpan={3}>등록된 문의가 없습니다.</td></tr>}
                                {list.map(item => (
                                    <tr className="inq-row" key={item.id} role="button" tabIndex={0} onClick={() => open(item)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                open(item);
                                            }
                                        }}>
                                        <td>{item.title}</td>
                                        <td><span className="inq-status">{item.status || "접수"}</span></td>
                                        <td>{item.createdAt || item.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* 글쓰기 및 수정 */}
                {page === "write" && (
                    <section>
                        <header className="inq-write-head">
                            <div>
                                <h1>{editing ? "클레임 수정" : "클레임 글쓰기"}</h1>
                                <p>제작 및 납품 관련 문의 내용을 작성합니다.</p>
                            </div>
                            <button type="button" onClick={back}>취소</button>
                        </header>
                        <form onSubmit={save}>
                            <div className="inq-box">
                                <h2>업체 및 주문 정보</h2>
                                <div className="inq-two">
                                    <label>업체명 <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="업체명" /></label>
                                    <label>작성자 * <input value={customerManager} onChange={e => setCustomerManager(e.target.value)} placeholder="문의글 작성자 이름" required /></label>
                                </div>
                                <div className="inq-two">
                                    <label>전화번호 <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="예: 010-1234-5678" /></label>
                                    <label>이메일 <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="예: sample@example.com" /></label>
                                </div>
                                <small>전화번호와 이메일 중 하나 이상 입력해 주세요. 둘 다 입력해도 됩니다.</small>
                                <label>주문번호 * <input value={orderNo} onChange={e => setOrderNo(e.target.value)} placeholder="예: GO-3001" required /></label>
                                <small>게시글 상세 열람에 사용됩니다.</small>
                            </div>
                            <div className="inq-box">
                                <h2>문의 내용</h2>
                                <label>문의 유형
                                    <select value={inquiryType} onChange={e => setInquiryType(e.target.value)}>
                                        <option>제품 불량</option>
                                        <option>수량 부족</option>
                                        <option>배송 문제</option>
                                        <option>기타 문의</option>
                                    </select>
                                </label>
                                <label>제목 * <input value={title} onChange={e => setTitle(e.target.value)} placeholder="게시글 제목" required /></label>
                                <label>내용 * <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="문제와 요청 사항을 작성해 주세요." required /></label>
                                <label>사진 첨부 (선택, 1MB 이하) <input type="file" accept="image/jpeg,image/png,image/webp" onChange={addPhoto} /></label>
                                {photoLoading && <p className="inq-note">사진을 읽고 있습니다.</p>}
                                {photo && (
                                    <div className="inq-photo">
                                        <img src={photo} alt="첨부 사진 미리보기" />
                                        <button type="button" onClick={removePhoto}>사진 제거</button>
                                    </div>
                                )}
                            </div>
                            {error && <p className="inq-error" role="alert">{error}</p>}
                            <div className="inq-actions">
                                <button type="button" onClick={back}>취소</button>
                                <button type="submit" disabled={photoLoading || !canSave}>{editing ? "수정 완료" : "게시글 등록"}</button>
                            </div>
                        </form>
                    </section>
                )}

                {/* 상세 보기 */}
                {page === "detail" && selected && (
                    <section>
                        <header className="inq-head">
                            <p>GOODS / CLAIM</p>
                            <h1>{selected.title}</h1>
                        </header>
                        {(master || verified) && (
                            <div className="inq-box inq-detail">
                                <div className="inq-detail-top">
                                    <h2>문의 상세</h2>
                                    <span className="inq-status">
                                        {master ? (
                                            <select value={selected.status || "접수"} onChange={changeStatus}
                                                style={{ width: "auto", margin: 0, padding: 0, border: "none", background: "transparent", color: "inherit", font: "inherit", cursor: "pointer" }}>
                                                <option>접수</option>
                                                <option>처리 중</option>
                                                <option>처리 완료</option>
                                            </select>
                                        ) : selected.status || "접수"}
                                    </span>
                                </div>
                                <div className="inq-detail-info">
                                    <div><span>업체명</span><strong>{selected.companyName || selected.company || "-"}</strong></div>
                                    <div><span>작성자</span><strong>{selected.customerManager || selected.manager || "-"}</strong></div>
                                    <div><span>전화번호</span><strong>{getPhone(selected) || "-"}</strong></div>
                                    <div><span>이메일</span><strong>{getEmail(selected) || "-"}</strong></div>
                                    <div><span>주문번호</span><strong>{selected.orderNo}</strong></div>
                                    <div><span>문의 유형</span><strong>{selected.inquiryType || selected.type || "기타 문의"}</strong></div>
                                </div>
                                <div className="inq-detail-body">
                                    <h3>문의 내용</h3>
                                    <p>{selected.content}</p>
                                </div>
                                {selected.photo && (
                                    <div className="inq-detail-images">
                                        <h3>첨부 사진</h3>
                                        <img className="inq-detail-photo" src={selected.photo} alt="문의 첨부 사진" />
                                    </div>
                                )}
                            </div>
                        )}
                        {!master && !verified && (
                            <form className="inq-box" onSubmit={check}>
                                <h2>주문번호 확인</h2>
                                <p>문의 내용을 확인하려면 주문번호를 입력하세요.</p>
                                <label>주문번호 <input value={checkNo} onChange={e => setCheckNo(e.target.value)} placeholder="주문번호" required /></label>
                                {error && <p className="inq-error" role="alert">{error}</p>}
                                <div className="inq-actions"><button type="submit">확인</button></div>
                            </form>
                        )}
                        {error && (master || verified) && <p className="inq-error" role="alert">{error}</p>}
                        <div className="inq-actions">
                            <button type="button" onClick={back}>목록으로</button>
                            {(master || verified) && (
                                <div className="inq-detail-buttons">
                                    {!master && verified && <button type="button" onClick={edit}>수정</button>}
                                    <button type="button" className="inq-delete" onClick={remove}>삭제</button>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}

export default HomeInquiry;
