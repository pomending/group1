// ============================================================
// 공통 ERP 더미 데이터
// ============================================================

// [상품 관리]
// products.id                    : 상품 고유 ID
// products.productPrice          : 상품 기본 판매 단가
// products.productStatus         : "판매 중" / "판매중지"

// [고객 관리]
// customers.id                   : 고객 고유 ID
// customers.employeeId           -> initialEmployees.id (영업팀)

// [상담 관리]
// consultations.id               : 상담 고유 ID
// consultations.customerId       -> customers.id (null 허용, 고객 미등록 가능)
// consultations.employeeId       -> initialEmployees.id (영업팀, null 허용)
// consultations.inquiryChannel   : 상담 접수 경로
// consultations.status           : "문의 접수" / "처리 중" / "견적 요청" / "문의 종료"
// 상담은 고객 등록 여부와 관계없이 생성할 수 있습니다.
// 고객 미등록 또는 담당 직원 미배정 상태에서는 해당 ID를 null로 저장합니다.

// [견적 관리]
// quotations.customerId          -> customers.id
// quotations.productId           -> products.id
// quotations.employeeId          -> initialEmployees.id (영업팀)
// quotations.quantity            : 상품 주문 수량
// quotations.unitPrice           : 실제 적용 단가 (상품 기본 단가와 별도)
// quotations.deliveryDate        : 고객 납품 예정일
// quotations.status              : "승인 대기" / "승인 완료" / "반려"
// 견적 하나에는 상품 한 종류만 포함합니다.
// 견적 총액은 quantity * unitPrice로 계산합니다.

// [상담 및 견적 연계]
// 상담과 견적은 각각 별도의 데이터로 관리합니다.
// 상담에서 고객 등록 및 연결 시 consultations.customerId를 사용합니다.
// 견적은 quotations.customerId를 통해 고객 데이터를 참조합니다.
// 현재 quotations에는 consultationId가 없어 개별 상담과 견적의 직접 참조 관계는 없습니다.
// 동일 고객의 상담과 견적은 customerId로 연관 조회할 수 있지만,
// 특정 상담에서 생성된 견적인지 1:1로 식별할 수는 없습니다.

// [프로젝트 관리]
// initialProjects.quotationId    -> quotations.id (승인 완료 견적)
// initialProjects.customerId     -> customers.id
// initialProjects.managerId      -> initialEmployees.id (경영지원팀)
// initialProjects.dueDate        : 견적의 deliveryDate를 초기값으로 사용
// initialProjects.status         : "대기" / "진행 중" / "완료" / "지연"

// [세부 작업 관리]
// tasks.projectId                -> initialProjects.id
// tasks.employeeId               -> initialEmployees.id (생산팀 / 물류팀)
// tasks.taskStatus               : "제작 관리" / "검수 관리" / "포장 관리" / "배송 관리"
// tasks.taskDeadline             : 세부 작업별 마감 예정일
// tasks.progress                 : "대기중" / "작업중" / "완료"

// [직원 관리]
// initialEmployees.id            : 직원 고유 ID
// initialEmployees.department    : "인사팀" / "영업팀" / "경영지원팀" / "물류팀" / "생산팀"
// initialEmployees.status        : "재직" / "휴직" / "퇴사"

// [데이터 참조 및 관리 규칙]
// 1. 모든 데이터는 id를 고유 식별자로 사용합니다.
// 2. 다른 데이터와 연결할 때는 해당 데이터의 ID를 참조합니다.
// 3. 상담은 고객 등록 전에도 생성할 수 있으며 customerId는 null을 허용합니다.
// 4. 상담 담당 직원이 배정되지 않은 경우 employeeId는 null을 허용합니다.
// 5. 상담과 견적은 별도 데이터이며 현재 직접적인 상담 ID 참조는 없습니다.
// 6. 프로젝트는 승인 완료 견적을 기준으로 생성합니다.
// 7. 하나의 견적은 최대 하나의 프로젝트에 연결할 수 있습니다.
// 8. 프로젝트 생성 시 견적의 deliveryDate를 dueDate에 저장합니다.
// 9. 프로젝트별 동일한 taskStatus의 세부 작업은 중복 등록하지 않습니다.
// 10. 작업 담당 부서: 제작·검수·포장 = 생산팀, 배송 = 물류팀
// 11. 다른 데이터에서 참조 중인 항목의 삭제 제한은 ERPContext에서 관리합니다.
//     (모듈별 통합 CRUD 규칙은 단계적으로 적용 예정)

// [참고]
// 계정 초기 데이터는 mockAccounts.js의 initialAccounts에서 관리합니다.
// 계정의 employeeId는 initialEmployees.id를 참조합니다.
// 직원 정보와 로그인 계정 정보는 별도로 관리합니다.

export const products = [
    {
        id: 1,
        productName: "스테인리스 텀블러",
        productPrice: 8000,
        productStatus: "판매 중",
        productCreatedAt: "2026-09-01",
        productUpdatedAt: "",
        productImageUrl: "01-stainless-tumbler.jpg"
    },
    {
        id: 2,
        productName: "캔버스 에코백",
        productPrice: 5000,
        productStatus: "판매 중",
        productCreatedAt: "2026-09-02",
        productUpdatedAt: "",
        productImageUrl: "02-canvas-ecobag.jpg"
    },
    {
        id: 3,
        productName: "세라믹 머그컵",
        productPrice: 6000,
        productStatus: "판매 중",
        productCreatedAt: "2026-09-03",
        productUpdatedAt: "",
        productImageUrl: "03-ceramic-mug.jpg"
    },
    {
        id: 4,
        productName: "아크릴 키링",
        productPrice: 2500,
        productStatus: "판매 중",
        productCreatedAt: "2026-09-04",
        productUpdatedAt: "",
        productImageUrl: "04-acrylic-keyring.jpg"
    },
    {
        id: 5,
        productName: "단체 티셔츠",
        productPrice: 12000,
        productStatus: "판매 중",
        productCreatedAt: "2026-09-05",
        productUpdatedAt: "",
        productImageUrl: "05-group-tshirt.jpg"
    },
    {
        id: 6,
        productName: "로고 볼펜",
        productPrice: 1300,
        productStatus: "판매 중",
        productCreatedAt: "2026-09-06",
        productUpdatedAt: "",
        productImageUrl: "06-logo-pen.jpg"
    },
    {
        id: 7,
        productName: "패브릭 파우치",
        productPrice: 7000,
        productStatus: "판매 중",
        productCreatedAt: "2026-09-07",
        productUpdatedAt: "",
        productImageUrl: "07-fabric-pouch.jpg"
    },
    {
        id: 8,
        productName: "금속 배지",
        productPrice: 3500,
        productStatus: "판매 중",
        productCreatedAt: "2026-09-08",
        productUpdatedAt: "",
        productImageUrl: "08-metal-badge.jpg"
    },
    {
        id: 9,
        productName: "홍보용 노트",
        productPrice: 4500,
        productStatus: "판매 중",
        productCreatedAt: "2026-09-09",
        productUpdatedAt: "",
        productImageUrl: "09-promotional-notebook.jpg"
    },
    {
        id: 10,
        productName: "로고 스티커",
        productPrice: 900,
        productStatus: "판매중지",
        productCreatedAt: "2026-09-10",
        productUpdatedAt: "2026-10-29",
        productImageUrl: "10-logo-sticker.jpg"
    }
];

export const quotations = [
    {
        id: 1,
        customerId: 1,
        productId: 1,
        employeeId: 2,
        quantity: 300,
        unitPrice: 8000,
        createdAt: "2026-10-15",
        validUntil: "2026-11-15",
        deliveryDate: "2026-11-25",
        paymentMethod: "계좌이체",
        memo: "개별 포장 요청",
        status: "승인 완료"
    },
    {
        id: 2,
        customerId: 2,
        productId: 2,
        employeeId: 4,
        quantity: 500,
        unitPrice: 5000,
        createdAt: "2026-10-20",
        validUntil: "2026-11-20",
        deliveryDate: "2026-11-30",
        paymentMethod: "계좌이체",
        memo: "학교 로고 인쇄 요청",
        status: "승인 완료"
    },
    {
        id: 3,
        customerId: 3,
        productId: 3,
        employeeId: 11,
        quantity: 400,
        unitPrice: 6000,
        createdAt: "2026-10-22",
        validUntil: "2026-11-22",
        deliveryDate: "2026-12-02",
        paymentMethod: "카드결제",
        memo: "머그컵 제작 요청",
        status: "승인 완료"
    },
    {
        id: 4,
        customerId: 1,
        productId: 4,
        employeeId: 2,
        quantity: 1000,
        unitPrice: 2500,
        createdAt: "2026-10-27",
        validUntil: "2026-11-27",
        deliveryDate: "2026-12-10",
        paymentMethod: "계좌이체",
        memo: "시제품 확인 후 제작 예정",
        status: "승인 대기"
    },
    {
        id: 5,
        customerId: 4,
        productId: 1,
        employeeId: 4,
        quantity: 100,
        unitPrice: 8500,
        createdAt: "2026-10-29",
        validUntil: "2026-11-29",
        deliveryDate: "2026-12-05",
        paymentMethod: "계좌이체",
        memo: "견적 조건 협의 실패",
        status: "반려"
    },
    {
        id: 6,
        customerId: 4,
        productId: 4,
        employeeId: 11,
        quantity: 800,
        unitPrice: 2300,
        createdAt: "2026-10-30",
        validUntil: "2026-11-30",
        deliveryDate: "2026-12-10",
        paymentMethod: "계좌이체",
        memo: "대량 주문 할인 적용",
        status: "승인 완료"
    },
    {
        id: 7,
        customerId: 3,
        productId: 2,
        employeeId: 2,
        quantity: 200,
        unitPrice: 5000,
        createdAt: "2026-11-01",
        validUntil: "2026-12-01",
        deliveryDate: "2026-12-08",
        paymentMethod: "카드결제",
        memo: "친환경 에코백 추가 주문",
        status: "승인 완료"
    },
    {
        id: 8,
        customerId: 5,
        productId: 6,
        employeeId: 4,
        quantity: 1000,
        unitPrice: 1200,
        createdAt: "2026-11-02",
        validUntil: "2026-12-02",
        deliveryDate: "2026-12-15",
        paymentMethod: "계좌이체",
        memo: "교육용 볼펜 대량 제작 문의",
        status: "승인 대기"
    },
    {
        id: 9,
        customerId: 7,
        productId: 5,
        employeeId: 11,
        quantity: 800,
        unitPrice: 11500,
        createdAt: "2026-11-03",
        validUntil: "2026-12-03",
        deliveryDate: "2026-12-18",
        paymentMethod: "계좌이체",
        memo: "행사 단체 티셔츠 제작 문의",
        status: "승인 대기"
    },
    {
        id: 10,
        customerId: 8,
        productId: 7,
        employeeId: 2,
        quantity: 300,
        unitPrice: 6800,
        createdAt: "2026-11-01",
        validUntil: "2026-12-01",
        deliveryDate: "2026-12-12",
        paymentMethod: "카드결제",
        memo: "재활용 소재 파우치 주문",
        status: "승인 완료"
    }
];

// 상담 샘플 20건. 고객과 연결된 상담의 customerId는 customers.id를 참조합니다.
export const consultations = [
    {
        id: 1,
        customerId: null,
        companyName: "삼성전자",
        inquiryChannel: "이메일",
        customerManager: "김민수",
        phone: "010-1234-5678",
        email: "minsu@example.com",
        employeeId: null,
        status: "문의 접수",
        memo: "텀블러 500개 제작 문의"
    },
    {
        id: 2,
        customerId: null,
        companyName: "한국대학교",
        inquiryChannel: "전화",
        customerManager: "박지현",
        phone: "010-2345-6789",
        email: "jihyun@example.com",
        employeeId: 4,
        status: "처리 중",
        memo: "학교 축제 기념 티셔츠 제작"
    },
    {
        id: 3,
        customerId: 3,
        companyName: "그린컴퍼니",
        inquiryChannel: "이메일",
        customerManager: "정우성",
        phone: "010-3456-7890",
        email: "woosung@example.com",
        employeeId: 11,
        status: "견적 요청",
        memo: "친환경 에코백 300개 제작 상담"
    },
    {
        id: 4,
        customerId: 4,
        companyName: "미래테크",
        inquiryChannel: "방문",
        customerManager: "이서연",
        phone: "010-4567-8901",
        email: "seoyeon@example.com",
        employeeId: 4,
        status: "문의 종료",
        memo: "신입사원 웰컴키트 200세트"
    },
    {
        id: 5,
        customerId: null,
        companyName: "한빛교육",
        inquiryChannel: "전화",
        customerManager: "최현우",
        phone: "010-5678-9012",
        email: "hyunwoo@example.com",
        employeeId: null,
        status: "문의 접수",
        memo: "교육용 볼펜 1000개 제작"
    },
    {
        id: 6,
        customerId: null,
        companyName: "블루디자인",
        inquiryChannel: "이메일",
        customerManager: "한지민",
        phone: "010-6789-0123",
        email: "jimin@example.com",
        employeeId: 19,
        status: "처리 중",
        memo: "브랜드 로고 머그컵 제작"
    },
    {
        id: 7,
        customerId: 7,
        companyName: "대한스포츠",
        inquiryChannel: "전화",
        customerManager: "강태훈",
        phone: "010-7890-1234",
        email: "taehoon@example.com",
        employeeId: 11,
        status: "견적 요청",
        memo: "마라톤 기념 티셔츠 800벌"
    },
    {
        id: 8,
        customerId: 8,
        companyName: "에코라이프",
        inquiryChannel: "방문",
        customerManager: "윤하늘",
        phone: "010-8901-2345",
        email: "haneul@example.com",
        employeeId: 4,
        status: "문의 종료",
        memo: "재활용 소재 파우치 제작"
    },
    {
        id: 9,
        customerId: null,
        companyName: "서울문화재단",
        inquiryChannel: "이메일",
        customerManager: "오세진",
        phone: "010-9012-3456",
        email: "sejin@example.com",
        employeeId: null,
        status: "문의 접수",
        memo: "문화행사 기념 배지 500개"
    },
    {
        id: 10,
        customerId: null,
        companyName: "스타트업허브",
        inquiryChannel: "전화",
        customerManager: "송지아",
        phone: "010-1122-3344",
        email: "jia@example.com",
        employeeId: 19,
        status: "처리 중",
        memo: "기업 홍보용 노트 300권"
    },
    {
        id: 11,
        customerId: 11,
        companyName: "드림푸드",
        inquiryChannel: "방문",
        customerManager: "임재혁",
        phone: "010-2233-4455",
        email: "jaehyuk@example.com",
        employeeId: 4,
        status: "견적 요청",
        memo: "매장 직원용 앞치마 제작"
    },
    {
        id: 12,
        customerId: 12,
        companyName: "아트스튜디오",
        inquiryChannel: "이메일",
        customerManager: "배수빈",
        phone: "010-3344-5566",
        email: "subin@example.com",
        employeeId: 2,
        status: "문의 종료",
        memo: "전시회 기념 엽서 2000장"
    },
    {
        id: 13,
        customerId: null,
        companyName: "스마트솔루션",
        inquiryChannel: "전화",
        customerManager: "조민석",
        phone: "010-4455-6677",
        email: "minseok@example.com",
        employeeId: null,
        status: "문의 접수",
        memo: "회사 로고 USB 300개 제작"
    },
    {
        id: 14,
        customerId: null,
        companyName: "희망복지센터",
        inquiryChannel: "이메일",
        customerManager: "신유진",
        phone: "010-5566-7788",
        email: "yujin@example.com",
        employeeId: 4,
        status: "처리 중",
        memo: "봉사활동 조끼 150벌"
    },
    {
        id: 15,
        customerId: 15,
        companyName: "코리아이벤트",
        inquiryChannel: "방문",
        customerManager: "장도현",
        phone: "010-6677-8899",
        email: "dohyun@example.com",
        employeeId: 20,
        status: "견적 요청",
        memo: "행사 기념 손목밴드 제작"
    },
    {
        id: 16,
        customerId: 16,
        companyName: "네오미디어",
        inquiryChannel: "전화",
        customerManager: "문채원",
        phone: "010-7788-9900",
        email: "chaewon@example.com",
        employeeId: 2,
        status: "문의 종료",
        memo: "유튜브 채널 홍보 스티커"
    },
    {
        id: 17,
        customerId: null,
        companyName: "한강대학교",
        inquiryChannel: "이메일",
        customerManager: "백승우",
        phone: "010-8899-0011",
        email: "seungwoo@example.com",
        employeeId: null,
        status: "문의 접수",
        memo: "졸업 기념 후드티 400벌"
    },
    {
        id: 18,
        customerId: null,
        companyName: "오렌지마케팅",
        inquiryChannel: "방문",
        customerManager: "류다은",
        phone: "010-9900-1122",
        email: "daeun@example.com",
        employeeId: 11,
        status: "처리 중",
        memo: "광고 캠페인용 에코백 제작"
    },
    {
        id: 19,
        customerId: 19,
        companyName: "베스트물류",
        inquiryChannel: "전화",
        customerManager: "홍준서",
        phone: "010-1212-3434",
        email: "junseo@example.com",
        employeeId: 19,
        status: "견적 요청",
        memo: "직원 단체복 250벌 제작"
    },
    {
        id: 20,
        customerId: 20,
        companyName: "라온엔터테인먼트",
        inquiryChannel: "이메일",
        customerManager: "고은별",
        phone: "010-2323-4545",
        email: "eunbyeol@example.com",
        employeeId: 4,
        status: "문의 종료",
        memo: "팬미팅 굿즈 키링 1000개"
    }
];

// 고객의 담당 직원은 employeeId로 연결합니다 (initialEmployees의 영업팀 직원 참조).
export const customers = [
    {
        id: 1,
        companyName: "삼성전자",
        businessNumber: "123-45-67890",
        customerManager: "김민수",
        employeeId: 2,
        phone: "010-1234-5678",
        email: "minsu@example.com",
        address: "경기도 수원시 영통구",
        createdAt: "2026-10-21",
        memo: "텀블러 500개 제작 문의"
    },
    {
        id: 2,
        companyName: "한국대학교",
        businessNumber: "234-56-78901",
        customerManager: "박지현",
        employeeId: 4,
        phone: "010-2345-6789",
        email: "jihyun@example.com",
        address: "서울특별시 강남구",
        createdAt: "2026-10-20",
        memo: "학교 축제 기념 티셔츠 제작"
    },
    {
        id: 3,
        companyName: "그린컴퍼니",
        businessNumber: "345-67-89012",
        customerManager: "정우성",
        employeeId: 11,
        phone: "010-3456-7890",
        email: "woosung@example.com",
        address: "서울특별시 마포구",
        createdAt: "2026-10-19",
        memo: "친환경 에코백 300개 제작 상담"
    },
    {
        id: 4,
        companyName: "미래테크",
        businessNumber: "456-78-90123",
        customerManager: "이서연",
        employeeId: 4,
        phone: "010-4567-8901",
        email: "seoyeon@example.com",
        address: "경기도 성남시 분당구",
        createdAt: "2026-10-18",
        memo: "신입사원 웰컴키트 200세트"
    },
    {
        id: 5,
        companyName: "한빛교육",
        businessNumber: "567-89-01234",
        customerManager: "최현우",
        employeeId: 4,
        phone: "010-5678-9012",
        email: "hyunwoo@example.com",
        address: "서울특별시 서초구",
        createdAt: "2026-10-17",
        memo: "교육용 볼펜 1000개 제작"
    },
    {
        id: 6,
        companyName: "블루디자인",
        businessNumber: "678-90-12345",
        customerManager: "한지민",
        employeeId: 19,
        phone: "010-6789-0123",
        email: "jimin@example.com",
        address: "서울특별시 성동구",
        createdAt: "2026-10-16",
        memo: "브랜드 로고 머그컵 제작"
    },
    {
        id: 7,
        companyName: "대한스포츠",
        businessNumber: "789-01-23456",
        customerManager: "강태훈",
        employeeId: 11,
        phone: "010-7890-1234",
        email: "taehoon@example.com",
        address: "경기도 고양시 일산동구",
        createdAt: "2026-10-15",
        memo: "마라톤 기념 티셔츠 800벌"
    },
    {
        id: 8,
        companyName: "에코라이프",
        businessNumber: "890-12-34567",
        customerManager: "윤하늘",
        employeeId: 2,
        phone: "010-8901-2345",
        email: "haneul@example.com",
        address: "인천광역시 연수구",
        createdAt: "2026-10-14",
        memo: "재활용 소재 파우치 제작"
    },
    {
        id: 9,
        companyName: "서울문화재단",
        businessNumber: "901-23-45678",
        customerManager: "오세진",
        employeeId: 20,
        phone: "010-9012-3456",
        email: "sejin@example.com",
        address: "서울특별시 종로구",
        createdAt: "2026-10-13",
        memo: "문화행사 기념 배지 500개"
    },
    {
        id: 10,
        companyName: "스타트업허브",
        businessNumber: "112-34-56789",
        customerManager: "송지아",
        employeeId: 19,
        phone: "010-1122-3344",
        email: "jia@example.com",
        address: "서울특별시 강남구",
        createdAt: "2026-10-12",
        memo: "기업 홍보용 노트 300권"
    },
    {
        id: 11,
        companyName: "드림푸드",
        businessNumber: "223-45-67890",
        customerManager: "임재혁",
        employeeId: 20,
        phone: "010-2233-4455",
        email: "jaehyuk@example.com",
        address: "경기도 안양시 동안구",
        createdAt: "2026-10-11",
        memo: "매장 직원용 앞치마 제작"
    },
    {
        id: 12,
        companyName: "아트스튜디오",
        businessNumber: "334-56-78901",
        customerManager: "배수빈",
        employeeId: 2,
        phone: "010-3344-5566",
        email: "subin@example.com",
        address: "서울특별시 용산구",
        createdAt: "2026-10-10",
        memo: "전시회 기념 엽서 2000장"
    },
    {
        id: 13,
        companyName: "스마트솔루션",
        businessNumber: "445-67-89012",
        customerManager: "조민석",
        employeeId: 11,
        phone: "010-4455-6677",
        email: "minseok@example.com",
        address: "경기도 성남시 수정구",
        createdAt: "2026-10-09",
        memo: "회사 로고 USB 300개 제작"
    },
    {
        id: 14,
        companyName: "희망복지센터",
        businessNumber: "556-78-90123",
        customerManager: "신유진",
        employeeId: 19,
        phone: "010-5566-7788",
        email: "yujin@example.com",
        address: "서울특별시 노원구",
        createdAt: "2026-10-08",
        memo: "봉사활동 조끼 150벌"
    },
    {
        id: 15,
        companyName: "코리아이벤트",
        businessNumber: "667-89-01234",
        customerManager: "장도현",
        employeeId: 20,
        phone: "010-6677-8899",
        email: "dohyun@example.com",
        address: "서울특별시 송파구",
        createdAt: "2026-10-07",
        memo: "행사 기념 손목밴드 제작"
    },
    {
        id: 16,
        companyName: "네오미디어",
        businessNumber: "778-90-12345",
        customerManager: "문채원",
        employeeId: 2,
        phone: "010-7788-9900",
        email: "chaewon@example.com",
        address: "서울특별시 마포구",
        createdAt: "2026-10-06",
        memo: "유튜브 채널 홍보 스티커"
    },
    {
        id: 17,
        companyName: "한강대학교",
        businessNumber: "889-01-23456",
        customerManager: "백승우",
        employeeId: 4,
        phone: "010-8899-0011",
        email: "seungwoo@example.com",
        address: "서울특별시 광진구",
        createdAt: "2026-10-05",
        memo: "졸업 기념 후드티 400벌"
    },
    {
        id: 18,
        companyName: "오렌지마케팅",
        businessNumber: "990-12-34567",
        customerManager: "류다은",
        employeeId: 11,
        phone: "010-9900-1122",
        email: "daeun@example.com",
        address: "서울특별시 영등포구",
        createdAt: "2026-10-04",
        memo: "광고 캠페인용 에코백 제작"
    },
    {
        id: 19,
        companyName: "베스트물류",
        businessNumber: "121-34-56789",
        customerManager: "홍준서",
        employeeId: 19,
        phone: "010-1212-3434",
        email: "junseo@example.com",
        address: "인천광역시 서구",
        createdAt: "2026-10-03",
        memo: "직원 단체복 250벌 제작"
    },
    {
        id: 20,
        companyName: "라온엔터테인먼트",
        businessNumber: "232-45-67890",
        customerManager: "고은별",
        employeeId: 20,
        phone: "010-2323-4545",
        email: "eunbyeol@example.com",
        address: "서울특별시 강남구",
        createdAt: "2026-10-02",
        memo: "팬미팅 굿즈 키링 1000개"
    },
    {
        id: 21,
        companyName: "유니온건설",
        businessNumber: "343-56-78901",
        customerManager: "서동욱",
        employeeId: 2,
        phone: "010-3434-5656",
        email: "dongwook@example.com",
        address: "경기도 수원시 팔달구",
        createdAt: "2026-10-01",
        memo: "현장 안전모 로고 인쇄"
    },
    {
        id: 22,
        companyName: "플러스헬스",
        businessNumber: "454-67-89012",
        customerManager: "정소희",
        employeeId: 4,
        phone: "010-4545-6767",
        email: "sohee@example.com",
        address: "서울특별시 강동구",
        createdAt: "2026-09-30",
        memo: "헬스장 회원용 스포츠타월"
    },
    {
        id: 23,
        companyName: "에이스모빌리티",
        businessNumber: "565-78-90123",
        customerManager: "차현석",
        employeeId: 11,
        phone: "010-5656-7878",
        email: "hyunseok@example.com",
        address: "경기도 화성시",
        createdAt: "2026-09-29",
        memo: "자동차 전시회 홍보 굿즈"
    },
    {
        id: 24,
        companyName: "봄날출판사",
        businessNumber: "676-89-01234",
        customerManager: "전하린",
        employeeId: 19,
        phone: "010-6767-8989",
        email: "harin@example.com",
        address: "경기도 파주시",
        createdAt: "2026-09-28",
        memo: "독서 행사 책갈피 1500개"
    },
    {
        id: 25,
        companyName: "봄날트래블",
        businessNumber: "787-90-12345",
        customerManager: "남지훈",
        employeeId: 20,
        phone: "010-7878-9090",
        email: "jihoon@example.com",
        address: "서울특별시 중구",
        createdAt: "2026-09-27",
        memo: "여행사 홍보용 여권 케이스"
    },

    {
        id: 26,
        companyName: "한빛테크",
        businessNumber: "123-45-67826",
        customerManager: "김도윤",
        employeeId: 2,
        phone: "010-2000-0026",
        email: "contact26@example.com",
        address: "서울특별시 강남구 테헤란로 126",
        createdAt: "2026-08-01",
        memo: "기업 굿즈 제작 문의"
    },
    {
        id: 27,
        companyName: "미래솔루션",
        businessNumber: "123-45-67827",
        customerManager: "박서연",
        employeeId: 4,
        phone: "010-2000-0027",
        email: "contact27@example.com",
        address: "서울특별시 송파구 올림픽로 227",
        createdAt: "2026-08-03",
        memo: "홍보용 텀블러 견적 요청"
    },
    {
        id: 28,
        companyName: "그린웨이브",
        businessNumber: "123-45-67828",
        customerManager: "이하준",
        employeeId: 11,
        phone: "010-2000-0028",
        email: "contact28@example.com",
        address: "경기도 성남시 분당구 판교로 128",
        createdAt: "2026-08-05",
        memo: "친환경 굿즈 관심"
    },
    {
        id: 29,
        companyName: "블루핀미디어",
        businessNumber: "123-45-67829",
        customerManager: "최유진",
        employeeId: 19,
        phone: "010-2000-0029",
        email: "contact29@example.com",
        address: "서울특별시 마포구 월드컵북로 29",
        createdAt: "2026-08-07",
        memo: "행사용 기념품 제작"
    },
    {
        id: 30,
        companyName: "에이원디자인",
        businessNumber: "123-45-67830",
        customerManager: "정민재",
        employeeId: 20,
        phone: "010-2000-0030",
        email: "contact30@example.com",
        address: "서울특별시 서초구 서초대로 130",
        createdAt: "2026-08-10",
        memo: "로고 인쇄 상담"
    },
    {
        id: 31,
        companyName: "다온컴퍼니",
        businessNumber: "123-45-67831",
        customerManager: "강수빈",
        employeeId: 2,
        phone: "010-2000-0031",
        email: "contact31@example.com",
        address: "경기도 하남시 미사강변대로 31",
        createdAt: "2026-08-12",
        memo: "신규 거래처"
    },
    {
        id: 32,
        companyName: "넥스트랩",
        businessNumber: "123-45-67832",
        customerManager: "윤지호",
        employeeId: 4,
        phone: "010-2000-0032",
        email: "contact32@example.com",
        address: "서울특별시 강동구 천호대로 132",
        createdAt: "2026-08-14",
        memo: "직원 웰컴키트 문의"
    },
    {
        id: 33,
        companyName: "오렌지팩토리",
        businessNumber: "123-45-67833",
        customerManager: "한예린",
        employeeId: 11,
        phone: "010-2000-0033",
        email: "contact33@example.com",
        address: "인천광역시 연수구 센트럴로 33",
        createdAt: "2026-08-17",
        memo: "판촉물 대량 제작 문의"
    },
    {
        id: 34,
        companyName: "스마트링크",
        businessNumber: "123-45-67834",
        customerManager: "서준영",
        employeeId: 19,
        phone: "010-2000-0034",
        email: "contact34@example.com",
        address: "서울특별시 구로구 디지털로 134",
        createdAt: "2026-08-19",
        memo: "IT 행사 굿즈 제작"
    },
    {
        id: 35,
        companyName: "모먼트스튜디오",
        businessNumber: "123-45-67835",
        customerManager: "배하은",
        employeeId: 20,
        phone: "010-2000-0035",
        email: "contact35@example.com",
        address: "서울특별시 성동구 성수이로 35",
        createdAt: "2026-08-21",
        memo: "브랜드 패키지 제작"
    },
    {
        id: 36,
        companyName: "에코플러스",
        businessNumber: "123-45-67836",
        customerManager: "임도현",
        employeeId: 2,
        phone: "010-2000-0036",
        email: "contact36@example.com",
        address: "경기도 수원시 영통구 광교로 136",
        createdAt: "2026-08-24",
        memo: "재활용 소재 굿즈 문의"
    },
    {
        id: 37,
        companyName: "비전파트너스",
        businessNumber: "123-45-67837",
        customerManager: "신가은",
        employeeId: 4,
        phone: "010-2000-0037",
        email: "contact37@example.com",
        address: "서울특별시 영등포구 국제금융로 37",
        createdAt: "2026-08-26",
        memo: "기업 선물세트 견적"
    },
    {
        id: 38,
        companyName: "라온마케팅",
        businessNumber: "123-45-67838",
        customerManager: "오태민",
        employeeId: 11,
        phone: "010-2000-0038",
        email: "contact38@example.com",
        address: "서울특별시 종로구 종로 138",
        createdAt: "2026-08-28",
        memo: "캠페인 홍보물 제작"
    },
    {
        id: 39,
        companyName: "코어시스템즈",
        businessNumber: "123-45-67839",
        customerManager: "유나경",
        employeeId: 19,
        phone: "010-2000-0039",
        email: "contact39@example.com",
        address: "경기도 안양시 동안구 시민대로 139",
        createdAt: "2026-09-01",
        memo: "사내 행사 기념품 문의"
    },
    {
        id: 40,
        companyName: "프라임유통",
        businessNumber: "123-45-67840",
        customerManager: "조현우",
        employeeId: 20,
        phone: "010-2000-0040",
        email: "contact40@example.com",
        address: "경기도 광명시 일직로 40",
        createdAt: "2026-09-03",
        memo: "정기 발주 상담"
    },
    {
        id: 41,
        companyName: "베스트크리에이티브",
        businessNumber: "123-45-67841",
        customerManager: "문서아",
        employeeId: 2,
        phone: "010-2000-0041",
        email: "contact41@example.com",
        address: "서울특별시 용산구 한강대로 141",
        createdAt: "2026-09-07",
        memo: "신제품 론칭 굿즈"
    },
    {
        id: 42,
        companyName: "플러스네트워크",
        businessNumber: "123-45-67842",
        customerManager: "백지훈",
        employeeId: 4,
        phone: "010-2000-0042",
        email: "contact42@example.com",
        address: "서울특별시 금천구 가산디지털로 142",
        createdAt: "2026-09-09",
        memo: "사원증 케이스 제작 문의"
    },
    {
        id: 43,
        companyName: "더나은교육",
        businessNumber: "123-45-67843",
        customerManager: "노예지",
        employeeId: 11,
        phone: "010-2000-0043",
        email: "contact43@example.com",
        address: "서울특별시 동작구 상도로 43",
        createdAt: "2026-09-11",
        memo: "교육생 수료 기념품"
    },
    {
        id: 44,
        companyName: "아이디어웍스",
        businessNumber: "123-45-67844",
        customerManager: "남승현",
        employeeId: 19,
        phone: "010-2000-0044",
        email: "contact44@example.com",
        address: "경기도 고양시 일산동구 중앙로 144",
        createdAt: "2026-09-14",
        memo: "맞춤형 문구류 제작"
    },
    {
        id: 45,
        companyName: "퍼스트이벤트",
        businessNumber: "123-45-67845",
        customerManager: "홍채원",
        employeeId: 20,
        phone: "010-2000-0045",
        email: "contact45@example.com",
        address: "서울특별시 중구 세종대로 45",
        createdAt: "2026-09-16",
        memo: "박람회 기념품 대량 문의"
    },
    {
        id: 46,
        companyName: "세움테크놀로지",
        businessNumber: "123-45-67846",
        customerManager: "고민준",
        employeeId: 2,
        phone: "010-2000-0046",
        email: "contact46@example.com",
        address: "경기도 용인시 기흥구 동백중앙로 146",
        createdAt: "2026-09-18",
        memo: "기술 세미나 굿즈"
    },
    {
        id: 47,
        companyName: "리버스컴퍼니",
        businessNumber: "123-45-67847",
        customerManager: "차서윤",
        employeeId: 4,
        phone: "010-2000-0047",
        email: "contact47@example.com",
        address: "서울특별시 광진구 아차산로 47",
        createdAt: "2026-09-21",
        memo: "브랜드 리뉴얼 기념품"
    },
    {
        id: 48,
        companyName: "온누리서비스",
        businessNumber: "123-45-67848",
        customerManager: "주하람",
        employeeId: 11,
        phone: "010-2000-0048",
        email: "contact48@example.com",
        address: "경기도 부천시 원미구 길주로 148",
        createdAt: "2026-09-23",
        memo: "고객 감사 선물 제작"
    },
    {
        id: 49,
        companyName: "디지털브릿지",
        businessNumber: "123-45-67849",
        customerManager: "송다인",
        employeeId: 19,
        phone: "010-2000-0049",
        email: "contact49@example.com",
        address: "서울특별시 강서구 마곡중앙로 49",
        createdAt: "2026-09-25",
        memo: "콘퍼런스 웰컴키트"
    },
    {
        id: 50,
        companyName: "유니온브랜드",
        businessNumber: "123-45-67850",
        customerManager: "장시우",
        employeeId: 20,
        phone: "010-2000-0050",
        email: "contact50@example.com",
        address: "경기도 남양주시 다산중앙로 150",
        createdAt: "2026-09-28",
        memo: "연말 굿즈 제작 상담"
    }

];

export const tasks = [
    {
        id: 1,
        projectId: 1,
        taskStatus: "제작 관리",
        employeeId: 1,
        taskDeadline: "2026-11-03",
        progress: "완료"
    },
    {
        id: 2,
        projectId: 1,
        taskStatus: "검수 관리",
        employeeId: 7,
        taskDeadline: "2026-11-09",
        progress: "작업중"
    },
    {
        id: 3,
        projectId: 1,
        taskStatus: "포장 관리",
        employeeId: 14,
        taskDeadline: "2026-11-13",
        progress: "대기중"
    },
    {
        id: 4,
        projectId: 2,
        taskStatus: "제작 관리",
        employeeId: 13,
        taskDeadline: "2026-11-10",
        progress: "대기중"
    },
    {
        id: 5,
        projectId: 2,
        taskStatus: "검수 관리",
        employeeId: 6,
        taskDeadline: "2026-11-13",
        progress: "대기중"
    },
    {
        id: 6,
        projectId: 3,
        taskStatus: "제작 관리",
        employeeId: 1,
        taskDeadline: "2026-10-26",
        progress: "완료"
    },
    {
        id: 7,
        projectId: 3,
        taskStatus: "검수 관리",
        employeeId: 14,
        taskDeadline: "2026-10-28",
        progress: "완료"
    },
    {
        id: 8,
        projectId: 3,
        taskStatus: "포장 관리",
        employeeId: 13,
        taskDeadline: "2026-10-30",
        progress: "완료"
    },
    {
        id: 9,
        projectId: 4,
        taskStatus: "제작 관리",
        employeeId: 6,
        taskDeadline: "2026-11-14",
        progress: "대기중"
    },
    {
        id: 10,
        projectId: 4,
        taskStatus: "검수 관리",
        employeeId: 7,
        taskDeadline: "2026-11-18",
        progress: "대기중"
    },
    {
        id: 11,
        projectId: 5,
        taskStatus: "제작 관리",
        employeeId: 13,
        taskDeadline: "2026-11-10",
        progress: "작업중"
    },
    {
        id: 12,
        projectId: 5,
        taskStatus: "포장 관리",
        employeeId: 14,
        taskDeadline: "2026-11-14",
        progress: "대기중"
    }
];

export const initialProjects = [
    {
        id: 1,
        name: "삼성전자 텀블러 제작",
        quotationId: 1,
        customerId: 1,
        managerId: 22,
        startDate: "2026-10-21",
        dueDate: "2026-11-25",
        completedDate: null,
        status: "진행 중",
        description: "창립기념 텀블러 300개 제작"
    },
    {
        id: 2,
        name: "한국대학교 에코백 제작",
        quotationId: 2,
        customerId: 2,
        managerId: 5,
        startDate: "2026-10-25",
        dueDate: "2026-11-30",
        completedDate: null,
        status: "대기",
        description: "홍보용 에코백 500개 제작"
    },
    {
        id: 3,
        name: "그린컴퍼니 머그컵 제작",
        quotationId: 3,
        customerId: 3,
        managerId: 17,
        startDate: "2026-10-23",
        dueDate: "2026-12-02",
        completedDate: null,
        status: "진행 중",
        description: "행사용 세라믹 머그컵 400개 제작 및 출고 작업"
    },
    {
        id: 4,
        name: "미래테크 아크릴 키링 제작",
        quotationId: 6,
        customerId: 4,
        managerId: 3,
        startDate: "2026-11-02",
        dueDate: "2026-12-10",
        completedDate: null,
        status: "대기",
        description: "홍보용 아크릴 키링 800개 제작"
    },
    {
        id: 5,
        name: "그린컴퍼니 에코백 추가 제작",
        quotationId: 7,
        customerId: 3,
        managerId: 12,
        startDate: "2026-11-03",
        dueDate: "2026-12-08",
        completedDate: null,
        status: "진행 중",
        description: "친환경 에코백 200개 추가 제작"
    }
];


export const initialEmployees = [
    {
        id: 1,
        name: "김민수",
        department: "생산팀",
        position: "과장",
        status: "재직",
        email: "minsu@example.com",
        phone: "010-0000-0001",
        hireDate: "2022-03-15"
    },
    {
        id: 2,
        name: "이지현",
        department: "영업팀",
        position: "대리",
        status: "재직",
        email: "jihyun@example.com",
        phone: "010-0000-0002",
        hireDate: "2023-05-10"
    },
    {
        id: 3,
        name: "박준호",
        department: "경영지원팀",
        position: "사원",
        status: "재직",
        email: "junho@example.com",
        phone: "010-0000-0003",
        hireDate: "2025-01-06"
    },
    {
        id: 4,
        name: "최유진",
        department: "영업팀",
        position: "과장",
        status: "재직",
        email: "yujin@example.com",
        phone: "010-0000-0004",
        hireDate: "2021-08-23"
    },
    {
        id: 5,
        name: "정하늘",
        department: "경영지원팀",
        position: "대리",
        status: "재직",
        email: "haneul@example.com",
        phone: "010-0000-0005",
        hireDate: "2023-11-13"
    },
    {
        id: 6,
        name: "오세훈",
        department: "생산팀",
        position: "사원",
        status: "재직",
        email: "sehun@example.com",
        phone: "010-0000-0006",
        hireDate: "2025-04-01"
    },
    {
        id: 7,
        name: "한서연",
        department: "생산팀",
        position: "대리",
        status: "재직",
        email: "seoyeon@example.com",
        phone: "010-0000-0007",
        hireDate: "2023-02-20"
    },
    {
        id: 8,
        name: "윤태호",
        department: "경영지원팀",
        position: "사원",
        status: "휴직",
        email: "taeho@example.com",
        phone: "010-0000-0008",
        hireDate: "2024-07-08"
    },
    {
        id: 9,
        name: "강지우",
        department: "물류팀",
        position: "사원",
        status: "재직",
        email: "jiwoo@example.com",
        phone: "010-0000-0009",
        hireDate: "2024-09-02"
    },
    {
        id: 10,
        name: "배현우",
        department: "인사팀",
        position: "과장",
        status: "재직",
        email: "hyunwoo@example.com",
        phone: "010-0000-0010",
        hireDate: "2020-06-15"
    },
    {
        id: 11,
        name: "서도윤",
        department: "영업팀",
        position: "사원",
        status: "재직",
        email: "doyun@example.com",
        phone: "010-0000-0011",
        hireDate: "2025-06-09"
    },
    {
        id: 12,
        name: "김나연",
        department: "경영지원팀",
        position: "사원",
        status: "재직",
        email: "nayeon@example.com",
        phone: "010-0000-0012",
        hireDate: "2026-02-02"
    },
    {
        id: 13,
        name: "이승우",
        department: "생산팀",
        position: "대리",
        status: "재직",
        email: "seungwoo@example.com",
        phone: "010-0000-0013",
        hireDate: "2023-09-18"
    },
    {
        id: 14,
        name: "조수빈",
        department: "생산팀",
        position: "과장",
        status: "재직",
        email: "subin@example.com",
        phone: "010-0000-0014",
        hireDate: "2021-04-12"
    },
    {
        id: 15,
        name: "임재혁",
        department: "물류팀",
        position: "대리",
        status: "재직",
        email: "jaehyuk@example.com",
        phone: "010-0000-0015",
        hireDate: "2022-10-17"
    },
    {
        id: 16,
        name: "신예린",
        department: "물류팀",
        position: "사원",
        status: "재직",
        email: "yerin@example.com",
        phone: "010-0000-0016",
        hireDate: "2025-08-04"
    },
    {
        id: 17,
        name: "문지훈",
        department: "경영지원팀",
        position: "대리",
        status: "재직",
        email: "jihoon@example.com",
        phone: "010-0000-0017",
        hireDate: "2023-01-09"
    },
    {
        id: 18,
        name: "백소희",
        department: "인사팀",
        position: "사원",
        status: "재직",
        email: "sohee@example.com",
        phone: "010-0000-0018",
        hireDate: "2026-03-02"
    },
    {
        id: 19,
        name: "권서현",
        department: "영업팀",
        position: "대리",
        status: "재직",
        email: "seohyun@example.com",
        phone: "010-0000-0019",
        hireDate: "2022-11-07"
    },
    {
        id: 20,
        name: "정민준",
        department: "영업팀",
        position: "사원",
        status: "재직",
        email: "minjun@example.com",
        phone: "010-0000-0020",
        hireDate: "2024-04-15"
    },
    {
        id: 21,
        name: "장예진",
        department: "인사팀",
        position: "대리",
        status: "재직",
        email: "yejin@example.com",
        phone: "010-0000-0021",
        hireDate: "2022-05-16"
    },
    {
        id: 22,
        name: "홍성민",
        department: "경영지원팀",
        position: "과장",
        status: "재직",
        email: "seongmin@example.com",
        phone: "010-0000-0022",
        hireDate: "2020-02-10"
    },
    {
        id: 23,
        name: "유다은",
        department: "경영지원팀",
        position: "사원",
        status: "재직",
        email: "daeun@example.com",
        phone: "010-0000-0023",
        hireDate: "2026-09-01"
    }
];
