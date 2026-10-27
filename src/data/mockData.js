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
    { id: 1, name: "ABC대학교" },
    { id: 2, name: "미래전자" },
    { id: 3, name: "그린카페" },
    { id: 4, name: "한빛물산" }
];

export const employees = [
    { id: 1, name: "김민수" },
    { id: 2, name: "이지현" },
    { id: 3, name: "박준호" }
];
