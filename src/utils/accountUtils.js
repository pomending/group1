export const ACCOUNT_ROLES = ["EMPLOYEE", "MANAGER", "ADMIN"];
export const ENABLE_STATUS = ["활성", "비활성"];

export const validatePassword = (password) => {
    if (typeof password !== "string" || password.length < 8) {
        return "비밀번호는 8자 이상이어야 합니다.";
    }

    return null;
};