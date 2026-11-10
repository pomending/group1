
import React, { useState } from "react";
import "./HomeInquiry.css";

// 브라우저에 저장된 문의를 불러옵니다.
function loadInquiries() {
    try {
        const saved = localStorage.getItem("home_inquiries");
        if (!saved) return [];

        const data = JSON.parse(saved);
        if (Array.isArray(data)) return data;
    } catch (error) {
        return [];
    }
    return [];
}

function HomeInquiry({ isMaster = false }) {
    const [list, setList] = useState(loadInquiries);
    const [page, setPage] = useState("list");
    const [title, setTitle] = useState("");
    const [orderNo, setOrderNo] = useState("");
    const [content, setContent] = useState("");
    const [selected, setSelected] = useState(null);
    const [checkNo, setCheckNo] = useState("");
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState("");

    // 문의 작성 화면으로 이동합니다.
    function write() {
        setTitle("");
        setOrderNo("");
        setContent("");
        setError("");
        setPage("write");
    }

    // 작성한 문의를 저장합니다.
    function save(event) {
        event.preventDefault();
        if (!title.trim() || !orderNo.trim() || !content.trim()) {
            setError("모든 항목을 입력해 주세요.");
            return;
        }

        const item = {
            id: Date.now(),
            title: title.trim(),
            orderNo: orderNo.trim(),
            content: content.trim(),
            status: "접수",
            date: new Date().toLocaleDateString("ko-KR")
        };
        const updated = [item, ...list];

        try {
            localStorage.setItem("home_inquiries", JSON.stringify(updated));
        } catch (error) {
            setError("문의를 저장하지 못했습니다.");
            return;
        }

        setList(updated);
        setError("");
        setPage("list");
    }

    // 문의를 선택하면 주문번호 확인을 준비합니다.
    function open(item) {
        setSelected(item);
        setCheckNo("");
        setVerified(false);
        setError("");
        setPage("detail");
    }

    // 입력한 주문번호와 저장된 번호를 비교합니다.
    function check(event) {
        event.preventDefault();
        if (checkNo.trim() === selected.orderNo) {
            setVerified(true);
            setError("");
        } else {
            setError("주문번호가 일치하지 않습니다.");
        }
    }

    // 문의 목록으로 돌아갑니다.
    function back() {
        setSelected(null);
        setCheckNo("");
        setVerified(false);
        setError("");
        setPage("list");
    }

    return (
        <main className="inq">
            <div className="inq-inner">
                <header className="inq-head">
                    <p>GOODS / CLAIM</p>
                    <h1>클레임 문의</h1>
                    <span>등록된 문의를 확인하고 새로운 문의를 작성할 수 있습니다.</span>
                </header>

                {/* 문의 목록 */}
                {page === "list" && (
                    <section>
                        <div className="inq-bar">
                            <h2>문의 목록</h2>
                            <button type="button" onClick={write}>문의 작성 +</button>
                        </div>
                        <table className="inq-table">
                            <thead>
                                <tr><th>제목</th><th>처리 상태</th><th>등록일</th></tr>
                            </thead>
                            <tbody>
                                {list.length === 0 && (
                                    <tr><td className="inq-empty" colSpan={3}>등록된 문의가 없습니다.</td></tr>
                                )}
                                {list.map(item => (
                                    <tr key={item.id}>
                                        <td><button type="button" onClick={() => open(item)}>{item.title}</button></td>
                                        <td><span className="inq-status">{item.status}</span></td>
                                        <td>{item.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* 문의 작성 */}
                {page === "write" && (
                    <section className="inq-box">
                        <h2>문의 작성</h2>
                        <form onSubmit={save}>
                            <label>제목
                                <input value={title} onChange={e => setTitle(e.target.value)} />
                            </label>
                            <label>주문번호
                                <input value={orderNo} onChange={e => setOrderNo(e.target.value)} />
                            </label>
                            <label>문의 내용
                                <textarea value={content} onChange={e => setContent(e.target.value)} />
                            </label>
                            {error && <p className="inq-error">{error}</p>}
                            <div className="inq-actions">
                                <button type="button" onClick={back}>취소</button>
                                <button type="submit">등록</button>
                            </div>
                        </form>
                    </section>
                )}

                {/* 주문번호 확인 후 문의 내용 표시 */}
                {page === "detail" && selected && (
                    <section className="inq-box">
                        <h2>{selected.title}</h2>
                        {isMaster || verified ? (
                            <div className="inq-detail">
                                <p>주문번호: {selected.orderNo}</p>
                                <p>처리 상태: {selected.status}</p>
                                <p>등록일: {selected.date}</p>
                                <p className="inq-content">{selected.content}</p>
                            </div>
                        ) : (
                            <form onSubmit={check}>
                                <p>문의 내용을 확인하려면 주문번호를 입력하세요.</p>
                                <label>주문번호
                                    <input value={checkNo} onChange={e => setCheckNo(e.target.value)} />
                                </label>
                                {error && <p className="inq-error">{error}</p>}
                                <div className="inq-actions">
                                    <button type="submit">확인</button>
                                </div>
                            </form>
                        )}
                        <div className="inq-actions">
                            <button type="button" onClick={back}>목록으로</button>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}

export default HomeInquiry;
