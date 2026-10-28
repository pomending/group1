export const formatQuotationId = (id) => {
    return `QT-${String(id).padStart(3, '0')}`;
};

export const formatProjectId = (id) => {
    return `PRJ-${String(id).padStart(3, '0')}`;
}

export const formatPrice = (price) => {
    return `${price.toLocaleString()}원`;
}