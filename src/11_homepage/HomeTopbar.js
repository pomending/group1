
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./HomeTopbar.css";

function HomeTopbar({ onPageChange, onMasterChange }) {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const page = params.get("page") || "home";
    const [clicks, setClicks] = useState(0);
    const [showInput, setShowInput] = useState(false);
    const [number, setNumber] = useState("");
    const [error, setError] = useState("");
    const [master, setMaster] = useState(false);

    const menus = [
        { name: "홈", page: "home" },
        { name: "제작 상품", page: "products" },
        { name: "클레임 문의", page: "claim" }
    ];

    // 상단 메뉴로 페이지를 이동합니다.
    function movePage(next) {
        if (next === "home") setParams({});
        else setParams({ page: next });
        window.scrollTo(0, 0);
        if (onPageChange) onPageChange(next);
    }

    // 상자 버튼을 다섯 번 누르면 마스터 번호 입력창을 엽니다.
    function clickLogo() {
        if (master) return;
        if (clicks === 4) {
            setShowInput(true);
            setClicks(0);
            setNumber("");
            setError("");
        } else {
            setClicks(clicks + 1);
        }
    }

    // 시연용 마스터 번호를 확인합니다.
    function checkMaster(e) {
        e.preventDefault();
        if (number !== "2468") {
            setError("마스터 번호가 일치하지 않습니다.");
            return;
        }
        setMaster(true);
        setShowInput(false);
        setNumber("");
        setError("");
        if (onMasterChange) onMasterChange(true);
    }

    // 마스터 모드를 종료합니다.
    function exitMaster() {
        setMaster(false);
        setShowInput(false);
        setClicks(0);
        setNumber("");
        setError("");
        if (onMasterChange) onMasterChange(false);
    }

    return (
        <div>
            <header className="home-topbar">
                <div className="home-topbar-inner">
                    {/* 로고 */}
                    <div className="home-topbar-brand">
                        <button type="button" className="home-topbar-logo" onClick={clickLogo} aria-label="GOODS 로고">📦</button>
                        <div className="home-topbar-name">
                            <strong>GOODS</strong>
                            <span>CUSTOM GOODS STUDIO</span>
                        </div>
                    </div>

                    {/* 마스터 모드에서만 대시보드와 종료 버튼이 표시됩니다. */}
                    <div className="home-topbar-right">
                        {master && <button type="button" className="home-master-dashboard" onClick={() => navigate("/")}>대시보드</button>}
                        {master && <button type="button" className="home-master-exit" onClick={exitMaster}>마스터 종료</button>}
                        {!master && <span className="home-customer-label">기업 고객 전용</span>}
                    </div>
                </div>

                {/* 홈 / 제작 상품 / 클레임 문의 */}
                <nav className="home-topbar-nav" aria-label="홈페이지 메뉴">
                    <div className="home-topbar-menu">
                        {menus.map(item => (
                            <button type="button" key={item.page} onClick={() => movePage(item.page)}
                                className={page === item.page ? "home-menu-button active" : "home-menu-button"}>
                                {item.name}
                            </button>
                        ))}
                    </div>
                </nav>
            </header>

            {/* 마스터 번호 입력창 */}
            {showInput && (
                <div className="home-master-overlay">
                    <form className="home-master-dialog" onSubmit={checkMaster}>
                        <h2>마스터 번호 입력</h2>
                        <p>마스터 번호를 입력하면 관리 기능을 사용할 수 있습니다.</p>
                        <input type="password" value={number} placeholder="마스터 번호" autoFocus
                            onChange={e => { setNumber(e.target.value); setError(""); }} />
                        {error && <p className="home-master-error">{error}</p>}
                        <div className="home-master-actions">
                            <button type="button" onClick={() => setShowInput(false)}>취소</button>
                            <button type="submit" disabled={!number.trim()}>확인</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default HomeTopbar;
