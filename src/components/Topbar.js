import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Topbar.css";

function Topbar({ isCollapsed, setIsCollapsed }) {

    const location = useLocation();

    const menus = [
        { path: "/", name: "대시보드" },
        { path: "/crm", name: "고객 관리" },
        { path: "/quotation", name: "견적 및 상품 관리" },
        { path: "/product", name: "상품 관리" },
        { path: "/projects", name: "프로젝트 관리" },
        { path: "/tasks", name: "세부 작업 관리" },
        { path: "/schedule", name: "일정 관리" }
    ];

    const currentMenu = menus.find(menu => {
        if (menu.path === "/") {
            return location.pathname === "/";
        }

        return location.pathname === menu.path ||
            location.pathname.startsWith(menu.path + "/");
    });

    const pageName = currentMenu
        ? currentMenu.name
        : "페이지를 찾을 수 없음";

    return (
        <header className="erp-topbar">

            <div className="erp-topbar-left">

                <button
                    type="button"
                    className="erp-topbar-toggle"
                    onClick={() => setIsCollapsed(prev => !prev)}
                    aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
                >
                    {isCollapsed ? "→" : "☰"}
                </button>

                <div className="erp-topbar-page">
                    <div className="erp-topbar-breadcrumb">
                        <Link to="/">홈</Link>

                        {location.pathname !== "/" && (
                            <>
                                <span>/</span>
                                <span>{pageName}</span>
                            </>
                        )}
                    </div>

                    <div className="erp-topbar-title">
                        {pageName}
                    </div>
                </div>

            </div>

            <div className="erp-topbar-user">
                <div className="erp-topbar-user-info">
                    <strong>GOODS ERP</strong>
                    <span>Team Project</span>
                </div>
                <div className="erp-topbar-avatar">T</div>
            </div>

        </header>
    );
}

export default Topbar;