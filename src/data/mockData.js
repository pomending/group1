// 프로젝트 관리에서 임시로 사용하는 공통 더미 데이터입니다.
// 나중에 팀원들의 데이터 구조가 정해지면 Context에서 관리하도록 옮길 수 있습니다.

export const quotations = [
        {
            id: 1,
            customerId: 1,
            status: "승인",
            items: [
                {
                    productId: 1,
                    productName: "스테인리스 텀블러",
                    quantity: 300,
                    unitPrice: 8000
                }
            ]
        },
        {
            id: 2,
            customerId: 2,
            status: "승인",
            items: [
                {
                    productId: 2,
                    productName: "캔버스 에코백",
                    quantity: 500,
                    unitPrice: 5000
                }
            ]
        },
        {
            id: 3,
            customerId: 3,
            status: "승인",
            items: [
                {
                    productId: 3,
                    productName: "세라믹 머그컵",
                    quantity: 400,
                    unitPrice: 6000
                },
                {
                    productId: 2,
                    productName: "캔버스 에코백",
                    quantity: 200,
                    unitPrice: 5000
                }
            ]
        },
        {
            id: 4,
            customerId: 1,
            status: "승인 대기",
            items: [
                {
                    productId: 4,
                    productName: "아크릴 키링",
                    quantity: 1000,
                    unitPrice: 2500
                }
            ]
        },
        {
            id: 5,
            customerId: 4,
            status: "거절",
            items: [
                {
                    productId: 1,
                    productName: "스테인리스 텀블러",
                    quantity: 100,
                    unitPrice: 8500
                }
            ]
        },
        {
            id: 6,
            customerId: 4,
            status: "승인",
            items: [
                {
                    productId: 4,
                    productName: "아크릴 키링",
                    quantity: 800,
                    unitPrice: 2300
                }
            ]
        }
    ];

// 고객/직원 이름을 보여주기 위한 임시 데이터입니다.
// CRM 및 직원 데이터 구조가 확정되면 공통 데이터로 교체하세요.
export const customers = [
    {
        id: 1,
        companyName: "삼성전자",
        businessNumber: "123-45-67890",
        customerManager: "김민수",
        employeeName: "이준호",
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
        employeeName: "최유진",
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
        employeeName: "김도윤",
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
        employeeName: "이준호",
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
        employeeName: "최유진",
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
        employeeName: "김도윤",
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
        employeeName: "이준호",
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
        employeeName: "최유진",
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
        employeeName: "김도윤",
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
        employeeName: "이준호",
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
        employeeName: "최유진",
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
        employeeName: "김도윤",
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
        employeeName: "이준호",
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
        employeeName: "최유진",
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
        employeeName: "김도윤",
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
        employeeName: "이준호",
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
        employeeName: "최유진",
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
        employeeName: "김도윤",
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
        employeeName: "이준호",
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
        employeeName: "최유진",
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
        employeeName: "김도윤",
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
        employeeName: "이준호",
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
        employeeName: "최유진",
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
        employeeName: "김도윤",
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
        employeeName: "이준호",
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
employeeName: "이준혁",
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
employeeName: "최민수",
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
employeeName: "김지훈",
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
employeeName: "박지은",
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
employeeName: "이준혁",
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
employeeName: "최민수",
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
employeeName: "김지훈",
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
employeeName: "박지은",
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
employeeName: "이준혁",
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
employeeName: "최민수",
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
employeeName: "김지훈",
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
employeeName: "박지은",
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
employeeName: "이준혁",
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
employeeName: "최민수",
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
employeeName: "김지훈",
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
employeeName: "박지은",
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
employeeName: "이준혁",
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
employeeName: "최민수",
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
employeeName: "김지훈",
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
employeeName: "박지은",
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
employeeName: "이준혁",
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
employeeName: "최민수",
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
employeeName: "김지훈",
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
employeeName: "박지은",
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
employeeName: "이준혁",
phone: "010-2000-0050",
email: "contact50@example.com",
address: "경기도 남양주시 다산중앙로 150",
createdAt: "2026-09-28",
memo: "연말 굿즈 제작 상담"
}

];


export const employees = [
    { id: 1, name: "김민수" },
    { id: 2, name: "이지현" },
    { id: 3, name: "박준호" }
];

export const initialProjects = [
    {
        id: 1,
        name: "삼성전자 텀블러 제작",
        quotationId: 1,
        customerId: 1,
        managerId: 1,
        startDate: "2026-10-21",
        dueDate: "2026-11-20",
        completedDate: null,
        status: "진행 중",
        description: "창립기념 텀블러 300개 제작"
    },
    {
        id: 2,
        name: "한국대학교 에코백 제작",
        quotationId: 2,
        customerId: 2,
        managerId: 2,
        startDate: "2026-10-25",
        dueDate: "2026-11-15",
        completedDate: null,
        status: "대기",
        description: "홍보용 에코백 500개 제작"
    }
]