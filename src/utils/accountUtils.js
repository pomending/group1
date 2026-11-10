export const ACCOUNT_ROLES = ["EMPLOYEE", "MANAGER", "ADMIN"];
export const ENABLE_STATUS = ["활성", "비활성"];

export const validatePassword = (password) => {
    if (
        typeof password !== "string" ||
        password.length < 8 ||
        !password.trim()
    ) {
        return "비밀번호는 8자 이상이어야 하며 공백만 입력할 수 없습니다.";
    }

    return null;
};