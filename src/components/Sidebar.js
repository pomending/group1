import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();

    const menus = [
        { name: "대시보드", path: "/", icon: "▦" },
        { name: "고객 관리", path: "/crm", icon: "♙" },
        { name: "견적 및 상품 관리", path: "/quotation", icon: "▤" },
        { name: "프로젝트 관리", path: "/projects", icon: "▣" },
        { name: "세부 작업 관리", path: "/tasks", icon: "☑" },
        { name: "일정 관리", path: "/schedule", icon: "▦" }
    ];

    return (
        <aside className="erp-sidebar">
            <div className="erp-sidebar-brand">
                <div className="erp-brand-logo">G</div>
                <div>
                    <strong>GOODS ERP</strong>
                    <span>Management System</span>
                </div>
            </div>

            <div className="erp-sidebar-section">
                MAIN MENU
            </div>

            <nav className="erp-sidebar-nav">
                {menus.map(menu => {
                    const isRelatedProduct =
                        menu.path === "/quotation" &&
                        location.pathname.startsWith("/product");

                    return (
                        <NavLink
                            key={menu.path}
                            to={menu.path}
                            end={menu.path === "/"}
                            className={({ isActive }) =>
                                "erp-sidebar-link" +
                                (isActive || isRelatedProduct ? " active" : "")
                            }
                        >
                            <span className="erp-sidebar-icon">
                                {menu.icon}
                            </span>
                            <span>{menu.name}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="erp-sidebar-footer">
                TEAM ERP PROJECT
            </div>
        </aside>
    );
}

export default Sidebar;