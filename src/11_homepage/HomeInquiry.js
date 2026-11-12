
import React, { useEffect, useRef, useState } from "react";
import "./HomeInquiry.css";
import useClaimData from "../context/useClaimData";

const emptyForm = {
    companyName: "", customerManager: "", phone: "", email: "", orderNo: "",
    inquiryType: "제품 불량", title: "", content: "", photo: ""
};

function HomeInquiry({ isMaster = false }) {
    const { claim: list, addClaim, updateClaim, deleteClaim, checkOrder, getPhone, getEmail } = useClaimData();
    const [form, setForm] = useState(emptyForm);
    const [page, setPage] = useState("list");
    const [selectedId, setSelectedId] = useState(null);
    const [editing, setEditing] = useState(false);
    const [verified, setVerified] = useState(false);
    const [checkNo, setCheckNo] = useState("");
    const [error, setError] = useState("");
    const [photoLoading, setPhotoLoading] = useState(false);
    const photoReader = useRef(null);
    const [sharedMaster, setSharedMaster] = useState(() => sessionStorage.getItem("homepage_master") === "true");

    const master = isMaster || sharedMaster;
    const selected = list.find(post => post.id === selectedId);
    const canSave = form.customerManager.trim() && (form.phone.trim() || form.email.trim()) &&
        form.orderNo.trim() && form.title.trim() && form.content.trim();

    // 상단바에서 마스터 모드가 바뀌면 반영합니다.
    useEffect(() => {
        function updateMaster() {
            setSharedMaster(sessionStorage.getItem("homepage_master") === "true");
        }
        window.addEventListener("homepage-master-changed", updateMaster);
        return () => window.removeEventListener("homepage-master-changed", updateMaster);
    }, []);

    useEffect(() => {
        if (!master) setVerified(false);
    }, [master]);

    useEffect(() => {
        if (master && editing) {
            setEditing(false);
            setPage("detail");
        }
    }, [master, editing]);

    useEffect(() => {
        if (page === "detail" && selectedId !== null && !selected) {
            setSelectedId(null);
            setVerified(false);
            setPage("list");
        }
    }, [page, selectedId, selected]);

    useEffect(() => {
        return () => { if (photoReader.current) photoReader.current.abort(); };
    }, []);

    function changeField(name, value) {
        setForm(prev => ({ ...prev, [name]: value }));
    }

    function removePhoto() {
        if (photoReader.current) photoReader.current.abort();
        photoReader.current = null;
        setPhotoLoading(false);
        changeField("photo", "");
    }

    function fillForm(post) {
        removePhoto();
        setForm({
            companyName: post.companyName || post.company || "",
            customerManager: post.customerManager || post.manager || "",
            phone: getPhone(post), email: getEmail(post), orderNo: post.orderNo || "",
            inquiryType: post.inquiryType || post.type || "제품 불량",
            title: post.title || "", content: post.content || "", photo: post.photo || ""
        });
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

    // 기존 사진 첨부 제한을 유지합니다.
    function addPhoto(e) {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = "";

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
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
            changeField("photo", reader.result);
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

    // 입력값만 Hook으로 넘기고, 데이터 저장은 Hook에서 처리합니다.
    function save(e) {
        e.preventDefault();
        if (photoLoading) return;
        if (editing && (!selected || master || !verified)) {
            setError("수정 권한을 확인해 주세요.");
            return;
        }

        const result = editing ? updateClaim({ ...form, id: selectedId }) : addClaim(form);
        if (!result.ok) {
            setError(result.message);
            return;
        }
        setError("");
        setEditing(false);
        if (editing) {
            setPage("detail");
        } else {
            setSelectedId(null);
            setVerified(false);
            setPage("list");
        }
    }

    function remove() {
        if (!selected || (!master && !verified)) return;
        if (!window.confirm("이 문의글을 삭제하시겠습니까?")) return;
        const result = deleteClaim(selectedId);
        if (result.ok) back();
        else setError(result.message);
    }

    function changeStatus(e) {
        if (!master || !selected) return;
        const result = updateClaim({ id: selectedId, status: e.target.value });
        setError(result.ok ? "" : result.message);
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
        if (selected && checkOrder(selectedId, checkNo)) {
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
                                    <label>업체명 <input value={form.companyName} onChange={e => changeField("companyName", e.target.value)} placeholder="업체명" /></label>
                                    <label>작성자 * <input value={form.customerManager} onChange={e => changeField("customerManager", e.target.value)} placeholder="문의글 작성자 이름" required /></label>
                                </div>
                                <div className="inq-two">
                                    <label>전화번호 <input type="tel" value={form.phone} onChange={e => changeField("phone", e.target.value)} placeholder="예: 010-1234-5678" /></label>
                                    <label>이메일 <input type="email" value={form.email} onChange={e => changeField("email", e.target.value)} placeholder="예: sample@example.com" /></label>
                                </div>
                                <small>전화번호와 이메일 중 하나 이상 입력해 주세요. 둘 다 입력해도 됩니다.</small>
                                <label>주문번호 * <input value={form.orderNo} onChange={e => changeField("orderNo", e.target.value)} placeholder="예: GO-3001" required /></label>
                                <small>게시글 상세 열람에 사용됩니다.</small>
                            </div>
                            <div className="inq-box">
                                <h2>문의 내용</h2>
                                <label>문의 유형
                                    <select value={form.inquiryType} onChange={e => changeField("inquiryType", e.target.value)}>
                                        <option>제품 불량</option>
                                        <option>수량 부족</option>
                                        <option>배송 문제</option>
                                        <option>기타 문의</option>
                                    </select>
                                </label>
                                <label>제목 * <input value={form.title} onChange={e => changeField("title", e.target.value)} placeholder="게시글 제목" required /></label>
                                <label>내용 * <textarea value={form.content} onChange={e => changeField("content", e.target.value)} placeholder="문제와 요청 사항을 작성해 주세요." required /></label>
                                <label>사진 첨부 (선택, 1MB 이하) <input type="file" accept="image/jpeg,image/png,image/webp" onChange={addPhoto} /></label>
                                {photoLoading && <p className="inq-note">사진을 읽고 있습니다.</p>}
                                {form.photo && (
                                    <div className="inq-photo">
                                        <img src={form.photo} alt="첨부 사진 미리보기" />
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
