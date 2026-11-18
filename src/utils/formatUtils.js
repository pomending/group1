export const formatQuotationId = (id) => {
    return `QT-${String(id).padStart(3, '0')}`;
};

export const formatProjectId = (id) => {
    return `PRJ-${String(id).padStart(3, '0')}`;
}

export const formatPrice = (price) => {
    return `${Number(price || 0).toLocaleString()}원`;
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

export const formatOrderNo = (id) => {
    return `ERP-${String(id).padStart(4, "0")}`;
};

//전화번호 입력중 형식변환(-표시)
export function formatPhone(phone) {

    const numbers = (phone || "").replace(/[^0-9]/g, "").slice(0, 11);
    //02로 시작되는 번호
    if (numbers.startsWith("02")) {
        if (numbers.length === 10) {
            return numbers.slice(0, 2) + "-" + numbers.slice(2, 6) + "-" + numbers.slice(6, 10);
        }
        if (numbers.length === 9) {
            return numbers.slice(0, 2) + "-" + numbers.slice(2, 5) + "-" + numbers.slice(5, 9);
        }
        if (numbers.length > 2) {
            return numbers.slice(0, 2) + "-" + numbers.slice(2)
        } else {
            return numbers;
        }
        //010으로 시작되는 번호
    }
    if (numbers.length === 11) {
        return numbers.slice(0, 3) + "-" + numbers.slice(3, 7) + "-" + numbers.slice(7, 11)
    }
    if (numbers.length === 10) {
        return numbers.slice(0, 3) + "-" + numbers.slice(3, 6) + "-" + numbers.slice(6, 10);
    }
    if (numbers.length > 3) {
        return numbers.slice(0, 3) + "-" + numbers.slice(3);
    } else {
        return numbers;
    }

}