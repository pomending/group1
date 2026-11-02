const LIVE_KEY = "moduProjectsFromOriginal";
const OLD_DASHBOARD_KEY = "moduProjects";
const CHANGE_EVENT = "moduProjectsChanged";
const ORIGINAL_ROUTE_KEY = "moduProjectsOriginalRoute";
const PENDING_DETAIL_KEY = "moduProjectsPendingDetail";

// 기존 키 호환
export const projectKey = OLD_DASHBOARD_KEY;

let observer = null;
let lastInstance = null;
let pendingName = null;
let openingDetail = false;

// 프로젝트 목록 읽기
export function readProjects() {
    try {
        const saved = localStorage.getItem(LIVE_KEY);

        if (saved !== null) {
            const rows = JSON.parse(saved);
            if (Array.isArray(rows)) return rows;
        }

        // 최초 방문 전
        // 기존 데이터 대체
        const previous = localStorage.getItem(OLD_DASHBOARD_KEY);
        const rows = previous ? JSON.parse(previous) : [];

        return Array.isArray(rows) ? rows : [];
    } catch {
        return [];
    }
}

export function loadProjects() {
    return readProjects();
}

// 실제 프로젝트 저장
function saveActualProjects(projects) {
    if (!Array.isArray(projects)) return;

    try {
        const serialized = JSON.stringify(projects);

        if (localStorage.getItem(LIVE_KEY) === serialized) {
            return;
        }

        localStorage.setItem(LIVE_KEY, serialized);
        window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
        // 저장 오류 처리
    }
}

// React Fiber 참조
function getFiber(node) {
    if (!node) return null;

    const key = Object.keys(node).find((name) =>
        name.startsWith("__reactFiber$")
    );

    return key ? node[key] : null;
}

// 프로젝트 컴포넌트 탐색
function getOriginalProjectFiber() {
    const element = document.querySelector(
        ".project-app, .pf-page, .pd-page, .pe-page"
    );

    if (!element) return null;

    let fiber = getFiber(element);

    while (fiber) {
        if (
            typeof fiber.type === "function" &&
            fiber.type.name === "ProjectPage" &&
            Array.isArray(fiber.memoizedState?.memoizedState)
        ) {
            return fiber;
        }

        fiber = fiber.return;
    }

    return null;
}

// 컴포넌트 일치 확인
function sameInstance(a, b) {
    return !!a && !!b && (
        a === b ||
        a.alternate === b ||
        b.alternate === a
    );
}

// 프로젝트 상태 비교
function listScore(list) {
    if (!Array.isArray(list)) return -1;

    let score = 0;

    const displayedCount = document.querySelector(".pm-stat-value");

    if (displayedCount) {
        const expected = Number(displayedCount.textContent.trim());

        if (Number.isFinite(expected)) {
            score += list.length === expected ? 100 : -100;
        }
    }

    const visibleRows = [
        ...document.querySelectorAll(".project-list tbody tr")
    ];

    for (const row of visibleRows) {
        const name = row
            .querySelector(".pm-project-name")
            ?.textContent.trim();

        if (name) {
            score += list.some((p) => p.name === name) ? 4 : -4;
        }
    }

    // 상세 상태 비교
    const detailNumber =
        document.querySelector(".pd-number")?.textContent || "";

    const projectId = Number(
        detailNumber.match(/PRJ-(\d+)/)?.[1]
    );

    if (projectId) {
        const p = list.find(
            (item) => Number(item.id) === projectId
        );

        const shown = document
            .querySelector(".pd-heading .pd-status")
            ?.textContent.trim();

        if (shown) {
            score += p?.status === shown ? 20 : -20;
        }
    }

    return score;
}

// 최신 상태 선택
function getActualState(fiber) {
    const candidates = [fiber, fiber?.alternate]
        .filter(Boolean)
        .map((f) => f.memoizedState)
        .filter((hook) =>
            Array.isArray(hook?.memoizedState)
        );

    candidates.sort(
        (a, b) =>
            listScore(b.memoizedState) -
            listScore(a.memoizedState)
    );

    return candidates[0] || null;
}

// 프로젝트 상세 열기
function tryOpenRequestedDetail() {
    const requested =
        pendingName ||
        sessionStorage.getItem(PENDING_DETAIL_KEY);

    if (!requested || openingDetail) return;

    const rows = document.querySelectorAll(
        ".project-list tbody tr"
    );

    for (const row of rows) {
        const rowName = row
            .querySelector(".pm-project-name")
            ?.textContent.trim();

        if (rowName !== requested) continue;

        const viewButton = row.querySelector(".pm-view-btn");

        if (!viewButton) return;

        pendingName = null;
        sessionStorage.removeItem(PENDING_DETAIL_KEY);

        openingDetail = true;

        // 기존 상세 버튼
        viewButton.click();

        openingDetail = false;
        return;
    }
}

// 프로젝트 변경 감지
function scanOriginalProjectPage() {
    const fiber = getOriginalProjectFiber();

    if (!fiber) return;

    // 프로젝트 경로 저장
    try {
        const route =
            window.location.pathname +
            window.location.search;

        localStorage.setItem(ORIGINAL_ROUTE_KEY, route);
    } catch {
        // 경로 저장 오류
    }

    const state = getActualState(fiber);

    if (!state) return;

    const projects = state.memoizedState;
    const isNewMount = !sameInstance(fiber, lastInstance);

    lastInstance = fiber;

    if (isNewMount) {
        // 컴포넌트 재진입
        // 프로젝트 상태 복원
        try {
            const saved = localStorage.getItem(LIVE_KEY);

            if (saved !== null) {
                const stored = JSON.parse(saved);

                if (
                    Array.isArray(stored) &&
                    JSON.stringify(stored) !==
                    JSON.stringify(projects) &&
                    typeof state.queue?.dispatch === "function"
                ) {
                    state.queue.dispatch(stored);
                    return;
                }
            }
        } catch {
            // 저장 데이터 예외
        }
    }

    // 프로젝트 상태 반영
    saveActualProjects(projects);

    // 요청 상세 열기
    tryOpenRequestedDetail();
}

// 프로젝트 관찰자
export function installProjectObserver() {
    if (
        typeof window === "undefined" ||
        typeof document === "undefined" ||
        observer
    ) {
        return;
    }

    const activate = () => {
        if (observer || !document.body) return;

        window.__moduProjectBridgeObserver?.disconnect();

        observer = new MutationObserver(
            scanOriginalProjectPage
        );

        window.__moduProjectBridgeObserver = observer;

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        scanOriginalProjectPage();
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            activate,
            { once: true }
        );
    } else {
        activate();
    }
}

// 프로젝트 메뉴 이동
export function openRealProjectPage(project) {
    pendingName = project ? String(project.name) : null;

    if (pendingName) {
        sessionStorage.setItem(
            PENDING_DETAIL_KEY,
            pendingName
        );
    } else {
        sessionStorage.removeItem(PENDING_DETAIL_KEY);
    }

    const candidates = document.querySelectorAll(
        "aside a, aside button, nav a, nav button, " +
        ".sidebar a, .sidebar button, a[href], button"
    );

    for (const el of candidates) {
        if (el.closest(".dashboard")) continue;

        const title = el.textContent
            ?.replace(/\s+/g, " ")
            .trim() || "";

        if (
            title !== "프로젝트 관리" &&
            !title.endsWith(" 프로젝트 관리")
        ) {
            continue;
        }

        el.click();
        return true;
    }

    // 저장 경로 대체
    try {
        const route = localStorage.getItem(ORIGINAL_ROUTE_KEY);

        if (
            route &&
            route !== (
                window.location.pathname +
                window.location.search
            )
        ) {
            window.location.assign(route);
            return true;
        }
    } catch {
        // 경로 없음
    }

    return false;
}
