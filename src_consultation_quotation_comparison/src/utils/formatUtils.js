export const formatQuotationId = (id) => {
    return `QT-${String(id).padStart(3, '0')}`;
};

export const formatProjectId = (id) => {
    return `PRJ-${String(id).padStart(3, '0')}`;
}

export const formatPrice = (price) => {
    return `${price.toLocaleString()}원`;
}

export function formatEmployeeId(id) {
    return `EMP-${String(id).padStart(3, "0")}`;
}

//거래처 id로 거래처명 찾기
export const formatCustomerName = (customers, customerId) => {
    return customers.find(customer => customer.id === Number(customerId))?.companyName || "";
}

//상품 id로 상품명 찾기
export const formatProductName = (products, productId) => {
    return products.find(product => product.id === Number(productId))?.productName || "";
}