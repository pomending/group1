
const LIVE_KEY = "moduProjectsFromOriginal";
const OLD_DASHBOARD_KEY = "moduProjects";
const CHANGE_EVENT = "moduProjectsChanged";
const ORIGINAL_ROUTE_KEY = "moduProjectsOriginalRoute";
const PENDING_DETAIL_KEY = "moduProjectsPendingDetail";

// 기존에 사용하던 이름도 유지
export const projectKey = OLD_DASHBOARD_KEY;

let observer = null;
let lastInstance = null;
let pendingName = null;
let openingDetail = false;

// 프로젝트 관리에서 확인한 실제 목록을 가져옴
export function readProjects() {
    try {
        const saved = localStorage.getItem(LIVE_KEY);

        if (saved !== null) {
            const rows = JSON.parse(saved);
            if (Array.isArray(rows)) return rows;
        }

        // 처음 원본 프로젝트 관리에 방문하기 전에는
        // 이전 대시보드의 저장 목록을 임시로 표시
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

// 원본에서 확인한 프로젝트를 저장
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
        // 저장이 불가능한 환경에서는 다른 기능을 유지
    }
}

// React가 화면 요소에 연결한 내부 상태 참조
function getFiber(node) {
    if (!node) return null;

    const key = Object.keys(node).find((name) =>
        name.startsWith("__reactFiber$")
    );

    return key ? node[key] : null;
}

// 실제 프로젝트 관리 화면의 ProjectPage 상태 찾기
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

// 같은 프로젝트 관리 컴포넌트인지 확인
function sameInstance(a, b) {
    return !!a && !!b && (
        a === b ||
        a.alternate === b ||
        b.alternate === a
    );
}

// 화면에 보이는 개수 및 이름과 비교하여 최신 상태 선택
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

    // 상세 화면에서 변경한 상태도 확인
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

// React의 이전 상태와 최신 상태 중 현재 화면에 맞는 값 선택
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

// 대시보드에서 선택한 프로젝트의 기존 상세 버튼 실행
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

        // 원본 프로젝트 관리에 있는 보기 버튼 사용
        viewButton.click();

        openingDetail = false;
        return;
    }
}

// 프로젝트 관리에서 변경된 목록을 감지
function scanOriginalProjectPage() {
    const fiber = getOriginalProjectFiber();

    if (!fiber) return;

    // 실제 프로젝트 관리 주소 기억
    try {
        const route =
            window.location.pathname +
            window.location.search;

        localStorage.setItem(ORIGINAL_ROUTE_KEY, route);
    } catch {
        // 주소 확인에 실패해도 프로젝트 목록은 계속 읽음
    }

    const state = getActualState(fiber);

    if (!state) return;

    const projects = state.memoizedState;
    const isNewMount = !sameInstance(fiber, lastInstance);

    lastInstance = fiber;

    if (isNewMount) {
        // 원본 화면을 나갔다 다시 들어왔을 때
        // 기존 useState가 초기값으로 돌아가지 않게 복원
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
            // 이전 저장 데이터가 없으면 원본 사용
        }
    }

    // 새 프로젝트 등록, 수정, 삭제 내용 반영
    saveActualProjects(projects);

    // 대시보드에서 선택한 상세 화면 열기
    tryOpenRequestedDetail();
}

// 원본 프로젝트 관리의 변경 내용을 계속 관찰
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

// 사이드바의 실제 프로젝트 관리 메뉴로 이동
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

    // 메뉴를 찾지 못하면 이전에 확인한 실제 주소 사용
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
        // 사용할 주소가 없다면 이동하지 않음
    }

    return false;
}
