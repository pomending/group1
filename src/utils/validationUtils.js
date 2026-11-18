const PHONE_PREFIXES = [
    "011", "016", "017", "018", "019",
    "031", "032", "033", "041", "042", "043", "044",
    "051", "052", "053", "054", "055",
    "061", "062", "063", "064"
];

export const isValidPhone = (value) => {

    const raw = String(value ?? "").trim();

    if (
        !/^(?:\d+|\d{2,3}-\d{3,4}-\d{4})$/.test(raw)
    ) {
        return false;
    }

    const phone = raw.replace(/-/g, "");

    return (
        (phone.startsWith("02") && [9, 10].includes(phone.length)) ||
        (phone.startsWith("010") && phone.length === 11) ||
        (
            PHONE_PREFIXES.some(prefix => phone.startsWith(prefix)) &&
            [10, 11].includes(phone.length)
        )
    );
};

export const isValidDate = (value) => {

    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
};

export const isValidEmail = (value) => {
    const email = String(value ?? "").trim();

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};