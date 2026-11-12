import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import "./Topbar.css";

const CHANGE_EVENT = "erpNotificationsChanged";
const notificationKey = id => `erp_notifications_${id}`;
const dismissedKey = id => `erp_notifications_dismissed_${id}`;

// 저장된 알림을 읽습니다. 데이터가 잘못되어도 화면은 계속 보여 줍니다.
function readList(key) {
    try {
        const list = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

// 예전 배정 알림에는 번호 뒤에 생성 시간이 붙어 있었습니다.
function sameKey(key) {
    const text = String(key || "");
    if (text.startsWith("project-assigned:") || text.startsWith("task-assigned:")) {
        return text.split(":").slice(0, 2).join(":");
    }
    return text;
}

export function getNotifications(employeeId) {
    return employeeId == null ? [] : readList(notificationKey(employeeId))
        .filter(item => item && typeof item === "object");
}

// 알림을 확인하면 목록에서 없애고, 같은 알림이 다시 뜨지 않게 기록합니다.
function dismissNotifications(employeeId, shouldRemove) {
    if (employeeId == null) return;
    try {
        const list = getNotifications(employeeId);
        const removed = list.filter(shouldRemove);
        if (!removed.length) return;

        const dismissed = readList(dismissedKey(employeeId));
        const keys = [...dismissed.map(sameKey), ...removed.map(item => sameKey(item.key))];
        localStorage.setItem(dismissedKey(employeeId), JSON.stringify([...new Set(keys)]));
        localStorage.setItem(notificationKey(employeeId), JSON.stringify(list.filter(item => !shouldRemove(item))));
        window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
        // 브라우저 저장소를 사용할 수 없는 경우에는 변경하지 않습니다.
    }
}

// 공지사항과 커뮤니티의 댓글에서도 사용하므로 함수 이름을 유지합니다.
export function addNotification(employeeId, info) {
    if (employeeId == null || !info?.key) return false;
    try {
        const key = sameKey(info.key);
        const list = getNotifications(employeeId);
        const used = [...list.map(item => sameKey(item.key)), ...readList(dismissedKey(employeeId)).map(sameKey)];
        if (used.includes(key)) return false;

        const notice = { ...info, key, id: key, read: false, date: new Date().toISOString() };
        localStorage.setItem(notificationKey(employeeId), JSON.stringify([notice, ...list].slice(0, 100)));
        window.dispatchEvent(new Event(CHANGE_EVENT));
        return true;
    } catch {
        return false;
    }
}

// 이전 게시글의 작성자 직원 번호는 이메일을 이용해 찾습니다.
export function getNotificationAuthorId(item, employees) {
    if (item?.authorEmployeeId != null) return item.authorEmployeeId;
    const email = String(item?.authorEmail || "").trim().toLowerCase();
    return employees?.find(person => String(person.email || "").trim().toLowerCase() === email)?.id ?? null;
}

function daysUntil(dateText) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateText || ""));
    if (!match) return null;
    const [year, month, day] = match.slice(1).map(Number);
    const due = new Date(Date.UTC(year, month - 1, day));
    if (due.getUTCFullYear() !== year || due.getUTCMonth() !== month - 1 || due.getUTCDate() !== day) return null;
    const now = new Date();
    return Math.round((due.getTime() - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}

// 지금 열어 둔 게시글이나 관리 화면의 알림만 지웁니다.
function isViewed(item, location) {
    const [path, query = ""] = String(item.link || "").split("?");
    if (location.pathname.startsWith("/projects")) return path === "/projects";
    if (location.pathname.startsWith("/tasks")) return path === "/tasks";
    if (location.pathname !== "/" || path !== "/") return false;
    const current = new URLSearchParams(location.search);
    const target = new URLSearchParams(query);
    return ["detail", "notice-detail"].includes(current.get("page")) &&
        current.get("page") === target.get("page") && current.get("id") === target.get("id");
}

const menus = {
    "/": "대시보드", "/crm": "고객 관리", "/consultation": "상담 관리",
    "/quotation": "견적 관리", "/product": "상품 관리", "/projects": "프로젝트 관리",
    "/tasks": "세부 작업 관리", "/schedule": "일정 관리", "/hr": "인적 자원 관리"
};
const subpages = {
    community: "사내 커뮤니티", write: "사내 커뮤니티", detail: "사내 커뮤니티",
    notice: "공지사항", "notice-write": "공지사항", "notice-detail": "공지사항",
    mypage: "마이페이지"
};

function Topbar({ isCollapsed, setIsCollapsed }) {
    const location = useLocation();
    const { currentUser, currentEmployee, projects = [], tasks = [] } = useERP();
    const employeeId = currentUser?.employeeId;
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [photo, setPhoto] = useState("");
    const [name, setName] = useState("");
    const [today, setToday] = useState(() => new Date().toDateString());
    const panelRef = useRef(null);

    // 알림 저장소나 프로필 사진이 변경되면 새로 읽습니다.
    useEffect(() => {
        const refresh = () => {
            dismissNotifications(employeeId, item => item.read);
            setNotifications(getNotifications(employeeId));
            try {
                const info = JSON.parse(localStorage.getItem(`erpMyPageInfo_${String(currentEmployee?.email || "").toLowerCase()}`) || "null");
                setName(info?.name || currentEmployee?.name || "사용자");
                setPhoto(employeeId == null ? "" : localStorage.getItem(`erpProfilePhoto_${employeeId}`) || "");
            } catch {
                setName(currentEmployee?.name || "사용자");
                setPhoto("");
            }
        };
        refresh();
        setIsOpen(false);
        window.addEventListener(CHANGE_EVENT, refresh);
        window.addEventListener("erpProfilePhotoChanged", refresh);
        window.addEventListener("storage", refresh);
        return () => {
            window.removeEventListener(CHANGE_EVENT, refresh);
            window.removeEventListener("erpProfilePhotoChanged", refresh);
            window.removeEventListener("storage", refresh);
        };
    }, [employeeId, currentEmployee?.email, currentEmployee?.name]);

    // 해당 화면을 직접 방문해도 관련 알림이 사라집니다.
    useEffect(() => {
        dismissNotifications(employeeId, item => isViewed(item, location));
    }, [employeeId, location, notifications]);

    // 날짜가 바뀌면 마감 알림을 다시 계산합니다.
    useEffect(() => {
        const timer = setInterval(() => setToday(new Date().toDateString()), 60000);
        return () => clearInterval(timer);
    }, []);

    // 처음 로그인할 때의 배정은 알리지 않고, 이후 새로 배정된 항목만 알립니다.
    useEffect(() => {
        if (employeeId == null) return;
        const myProjects = projects.filter(
            project => Number(project.managerId) === Number(employeeId)
        );

        const myTasks = tasks.filter(
            task => Number(task.employeeId) === Number(employeeId)
        );
        const key = `erp_notification_assignments_${employeeId}`;
        const current = {
            projects: myProjects.map(item => String(item.id)),
            tasks: myTasks.map(item => String(item.id))
        };
        try {
            const saved = localStorage.getItem(key);
            const old = saved ? JSON.parse(saved) : null;
            if (Array.isArray(old?.projects) && Array.isArray(old?.tasks)) {
                myProjects.filter(item => !old.projects.includes(String(item.id)) &&
                    item.status !== "완료" && !item.completedDate).forEach(item => {
                        addNotification(employeeId, {
                            key: `project-assigned:${item.id}`, title: "프로젝트 배정",
                            message: `'${item.name}' 프로젝트 담당자로 지정되었습니다.`, link: "/projects"
                        });
                    });
                myTasks
                    .filter(item =>
                        !old.tasks.includes(String(item.id)) &&
                        item.progress !== "완료"
                    )
                    .forEach(item => {
                        addNotification(employeeId, {
                            key: `task-assigned:${item.id}`,
                            title: "업무 배정",
                            message: `'${item.taskType}' 업무 담당자로 지정되었습니다.`,
                            link: "/tasks"
                        });
                    });
            }
            localStorage.setItem(key, JSON.stringify(current));
        } catch {
            // 알림 저장 오류는 프로젝트 데이터에 영향을 주지 않습니다.
        }

        // 담당 프로젝트 또는 담당 업무가 속한 프로젝트만 D-3부터 알립니다.
        const related = new Set([...myProjects.map(item => String(item.id)),
        ...myTasks.map(item => String(item.projectId))]);
        projects.filter(item => related.has(String(item.id)) && item.status !== "완료" &&
            !item.completedDate).forEach(item => {
                const days = daysUntil(item.dueDate);
                if (days == null || days < 0 || days > 3) return;
                addNotification(employeeId, {
                    key: `project-deadline:${item.id}:${item.dueDate}`, title: "마감 임박",
                    message: `'${item.name}' 프로젝트 ${days === 0 ? "오늘 마감" : `D-${days}`}`,
                    link: "/projects"
                });
            });
    }, [employeeId, projects, tasks, today]);

    useEffect(() => {
        if (!isOpen) return;
        const close = event => {
            if (event.key === "Escape" || (event.type === "mousedown" && !panelRef.current?.contains(event.target))) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", close);
        document.addEventListener("keydown", close);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("keydown", close);
        };
    }, [isOpen]);

    const page = new URLSearchParams(location.search).get("page");
    const path = Object.keys(menus).find(menu => menu === "/"
        ? location.pathname === "/"
        : location.pathname === menu || location.pathname.startsWith(menu + "/"));
    const pageName = location.pathname === "/" && subpages[page]
        ? subpages[page] : menus[path] || "페이지를 찾을 수 없음";
    const isHome = location.pathname === "/" && !page;

    return (
        <header className="erp-topbar">
            <div className="erp-topbar-left">
                <button
                    type="button"
                    className="erp-topbar-toggle"
                    onClick={() => setIsCollapsed(value => !value)}
                    aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}>
                    {isCollapsed ? "→" : "☰"}
                </button>
                <div className="erp-topbar-page">
                    <div className="erp-topbar-breadcrumb">
                        <Link to="/">홈</Link>
                        {!isHome && <><span>/</span><span>{pageName}</span></>}
                    </div>
                    <div className="erp-topbar-title">{pageName}</div>
                </div>
            </div>

            {/* 확인한 알림은 목록에서 삭제합니다. */}
            <div className="erp-topbar-notification" ref={panelRef}>
                <button
                    type="button"
                    className="erp-notification-button"
                    aria-label={`알림 ${notifications.length}개`}
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen(value => !value)}>
                    🔔
                    {notifications.length > 0 && (
                        <span className="erp-notification-count">
                            {notifications.length > 99 ? "99+" : notifications.length}
                        </span>
                    )}
                </button>
                {isOpen && (
                    <div className="erp-notification-panel">
                        <div className="erp-notification-header">
                            <strong>알림</strong>
                            <button
                                type="button"
                                disabled={notifications.length === 0}
                                onClick={() => dismissNotifications(employeeId, () => true)}
                            >모두 지우기</button>
                        </div>
                        <div className="erp-notification-list">
                            {notifications.length === 0 ? (
                                <p className="erp-notification-empty">알림이 없습니다.</p>
                            ) : notifications.map(item => (
                                <Link
                                    key={item.id || item.key}
                                    to={item.link || "/"}
                                    className="erp-notification-item unread"
                                    onClick={() => {
                                        dismissNotifications(employeeId, other => sameKey(other.key) === sameKey(item.key));
                                        setIsOpen(false);
                                    }}>
                                    <strong>{item.title}</strong>
                                    <span>{item.message}</span>
                                    <small>{new Date(item.date).toLocaleString("ko-KR")}</small>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Link to="/?page=mypage" className="erp-topbar-user" title="마이페이지로 이동" aria-label="마이페이지로 이동">
                <div className="erp-topbar-user-info">
                    <strong>{name}님</strong>
                    <span>내 정보 보기</span>
                </div>
                <div className="erp-topbar-avatar" aria-hidden="true">
                    {photo ? <img src={photo} alt="" /> : "👤"}
                </div>
            </Link>
        </header>
    );
}

export default Topbar;
