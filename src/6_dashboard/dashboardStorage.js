
 // 게시판 기본 데이터의 작성일을 만듭니다.
 function boardDate(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toLocaleDateString("ko-KR");
}

const initialNoticePosts = [
    {
        id: -1001, type: "important", title: "연말 납품 일정 및 제작 변경 요청 안내",
        content: "11월 말부터 12월 초까지 기업 기념품과 행사 굿즈 납품이 집중될 예정입니다.\n생산팀은 인쇄·검수 완료 수량을 출고 전에 물류팀과 공유해 주세요.\n물류팀은 개별 포장 여부와 배송지 정보를 확인한 뒤 출고 준비를 진행해 주시기 바랍니다.\n납기 변경이나 불량 발생 등 일정에 영향을 주는 사항은 영업팀과 경영지원팀에 즉시 알려 주세요.",
        writer: "경영지원팀", authorEmail: "sample-notice@example.invalid", authorEmployeeId: "SAMPLE-NOTICE", date: boardDate(0)
    },
    {
        id: -1002, type: "normal", title: "11월 말 텀블러·에코백 출고 준비 안내",
        content: "11월 말 납품 예정인 텀블러와 에코백 물량의 포장 작업을 준비하고 있습니다.\n텀블러는 개별 포장 상태를, 에코백은 인쇄 위치와 수량을 최종 확인해 주세요.\n출고 전에 확인이 필요한 사항은 물류팀에 전달 부탁드립니다.",
        writer: "물류팀", authorEmail: "sample-notice@example.invalid", authorEmployeeId: "SAMPLE-NOTICE", date: boardDate(1)
    },
    {
        id: -1003, type: "normal", title: "머그컵 선물 상자 포장 및 검수 일정",
        content: "행사용 세라믹 머그컵의 인쇄 상태와 선물 상자 포장을 순차적으로 확인할 예정입니다.\n검수 중 깨짐이나 인쇄 불량이 발견되면 별도로 분류하고 수량을 알려 주세요.\n포장 완료 물량은 물류팀과 인계 일정을 조율하겠습니다.",
        writer: "생산팀", authorEmail: "sample-notice@example.invalid", authorEmployeeId: "SAMPLE-NOTICE", date: boardDate(2)
    },
    {
        id: -1004, type: "normal", title: "아크릴 키링 제작 시안 확인 요청",
        content: "아크릴 키링 주문 건의 인쇄 위치와 도안 크기를 최종 확인하고 있습니다.\n고객사에서 전달한 수정 요청이 있다면 제작 착수 전에 영업팀으로 공유해 주세요.\n시안 확정 후에는 생산 일정에 맞춰 진행하겠습니다.",
        writer: "영업팀", authorEmail: "sample-notice@example.invalid", authorEmployeeId: "SAMPLE-NOTICE", date: boardDate(3)
    },
    {
        id: -1005, type: "normal", title: "단체 티셔츠 사이즈별 수량 취합 안내",
        content: "단체 티셔츠 제작 문의가 있는 거래처를 대상으로 사이즈별 주문 수량을 확인하고 있습니다.\nS부터 2XL까지 사이즈별 수량과 인쇄 색상 요청을 함께 취합해 주세요.\n누락된 수량이 있으면 생산 일정 확정 전에 영업팀에 알려 주시기 바랍니다.",
        writer: "영업팀", authorEmail: "sample-notice@example.invalid", authorEmployeeId: "SAMPLE-NOTICE", date: boardDate(4)
    },
    {
        id: -1006, type: "normal", title: "12월 납품용 포장 자재 수량 확인",
        content: "12월 납품을 앞두고 선물 상자, 완충재, 택배 박스 재고를 확인하려고 합니다.\n생산팀은 품목별 예상 포장 수량을 물류팀에 전달해 주세요.\n부족한 규격이 확인되면 추가 자재 입고 일정을 조율하겠습니다.",
        writer: "물류팀", authorEmail: "sample-notice@example.invalid", authorEmployeeId: "SAMPLE-NOTICE", date: boardDate(5)
    },
    {
        id: -1007, type: "normal", title: "생산·물류 부서 주간 협의 안내",
        content: "이번 주 제작 진행 상황과 출고 예정 물량을 함께 확인하는 부서 협의를 진행할 예정입니다.\n생산팀은 검수 대기 품목을, 물류팀은 출고 준비가 필요한 품목을 정리해 주세요.\n납기 변경 가능성이 있는 주문도 함께 공유 부탁드립니다.",
        writer: "경영지원팀", authorEmail: "sample-notice@example.invalid", authorEmployeeId: "SAMPLE-NOTICE", date: boardDate(6)
    }
];

const initialCommunityPosts = [
    {
        id: -1011, title: "텀블러 로고 인쇄 샘플 보신 분 계신가요?",
        content: "이번에 나온 텀블러 샘플은 로고 색상이 생각보다 조금 진해 보이더라고요.\n조명 때문인지 실제 인쇄색이 달라진 건지 확인해 보신 분 계실까요?\n오후에 한 번 더 비교해 보려고 합니다.",
        writer: "오세훈", authorEmail: "sample-community@example.invalid", authorEmployeeId: "SAMPLE-COMMUNITY", date: boardDate(1)
    },
    {
        id: -1012, title: "에코백 손잡이 길이 샘플 의견 부탁드려요",
        content: "에코백 새 샘플을 보니 어깨에 멨을 때 길이가 조금 애매한 것 같아요.\n직접 들어 보신 분들은 사용감이 어땠나요?\n의견 모아서 다음 샘플 확인 때 전달하려고 합니다.",
        writer: "이지현", authorEmail: "sample-community@example.invalid", authorEmployeeId: "SAMPLE-COMMUNITY", date: boardDate(2)
    },
    {
        id: -1013, title: "머그컵 포장용 완충재 여유분 있을까요?",
        content: "선물 상자에 들어갈 머그컵을 포장하다 보니 완충재가 예상보다 많이 필요하네요.\n창고에 같은 규격으로 남아 있는 물량이 있는지 아시는 분 계시면 알려 주세요.\n확인되면 오후 포장 작업에 맞춰 가져가겠습니다.",
        writer: "한서연", authorEmail: "sample-community@example.invalid", authorEmployeeId: "SAMPLE-COMMUNITY", date: boardDate(3)
    },
    {
        id: -1014, title: "단체 티셔츠 실측 사이즈가 조금 다르네요",
        content: "샘플 티셔츠를 확인했는데 같은 표기 사이즈라도 색상별로 실측이 조금 다른 것 같습니다.\n혹시 다른 샘플도 확인해 보셨나요?\n주문 수량 확정 전에 한 번 더 비교하면 좋을 것 같아요.",
        writer: "이승우", authorEmail: "sample-community@example.invalid", authorEmployeeId: "SAMPLE-COMMUNITY", date: boardDate(4)
    },
    {
        id: -1015, title: "아크릴 키링 보호 필름은 언제 떼는 게 좋을까요?",
        content: "키링 샘플 검수할 때 보호 필름을 떼고 표면을 확인하는 편이 나을까요?\n배송 중 긁힘이 걱정돼서 포장 직전까지 붙여 두는 게 좋을지도 고민입니다.\n전에 비슷한 제품 출고해 보신 분들 의견 부탁드려요.",
        writer: "강지우", authorEmail: "sample-community@example.invalid", authorEmployeeId: "SAMPLE-COMMUNITY", date: boardDate(5)
    },
    {
        id: -1016, title: "오늘 점심 같이 드실 분 있나요?",
        content: "오늘 점심에 근처에서 따뜻한 국물 먹으려고 하는데 같이 가실 분 계신가요?\n딱히 메뉴는 정하지 않았어요. 괜찮은 곳 있으면 추천도 부탁드립니다!",
        writer: "김나연", authorEmail: "sample-community@example.invalid", authorEmployeeId: "SAMPLE-COMMUNITY", date: boardDate(6)
    }
];

// 저장된 글이 있으면 그대로 사용하고, 없을 때만 기본 데이터를 저장합니다.
export function loadDashboardPosts(key) {
    const initial = key === "noticePosts" ? initialNoticePosts : initialCommunityPosts;
    try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
            const saved = JSON.parse(raw);
            return Array.isArray(saved) ? saved : initial;
        }
        const posts = initial.map(post => ({ ...post }));
        localStorage.setItem(key, JSON.stringify(posts));
        return posts;
    } catch {
        return initial.map(post => ({ ...post }));
    }
}

export function resetDashboardData() {
    // 다른 ERP 초기화처럼 기본 게시글 목록을 localStorage에 다시 저장합니다.
    localStorage.setItem("noticePosts", JSON.stringify(initialNoticePosts));
    localStorage.setItem("communityPosts", JSON.stringify(initialCommunityPosts));

    // 이전 버전에서만 사용하던 생성 완료 기록을 삭제합니다.
    ["communityPosts_dashboardExamplesAdded", "noticePosts_dashboardExamplesAdded",
        "noticePosts_importantExampleFixed"].forEach(key => localStorage.removeItem(key));

    // ID에 따라 달라지는 저장 키
    const prefixes = [
        "communityComments_",
        "noticeComments_",
        "erpProfilePhoto_",
        "erp_notifications_",
        "erp_notification_assignments_",
        "erpMyPageInfo_"
    ];

    Object.keys(localStorage).forEach(key => {
        if (prefixes.some(prefix => key.startsWith(prefix))) {
            localStorage.removeItem(key);
        }
    });
}
