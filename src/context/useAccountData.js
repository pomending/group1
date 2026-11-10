import { useEffect, useState } from "react";
import { initialAccounts } from "../data/mockAccounts";
import { ACCOUNT_ROLES, ENABLE_STATUS, validatePassword } from "../utils/accountUtils";

function useAccountData(employees) {

    const STORAGE_KEY = 'erp_accounts'
    const NEXT_ID_KEY = 'erp_account_next_id'

    const [accounts, setAccounts] = useState(() => {

        try {

            const savedAccounts = localStorage.getItem(STORAGE_KEY)

            if (savedAccounts !== null) {

                const parsedAccounts = JSON.parse(savedAccounts)

                if (Array.isArray(parsedAccounts)) {
                    return parsedAccounts
                }

            }

        } catch (error) {
            console.error('ERP 계정 불러오기 실패', error)
        }

        return initialAccounts

    })

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
    }, [accounts])

    const addAccount = (employeeId, role) => {

        if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
            return false;
        }

        if (!ACCOUNT_ROLES.includes(role)) {
            return false;
        }

        const employee = employees.find(
            e => e.id === employeeId
        );

        if (!employee || employee.status !== "재직") {
            return false;
        }

        const alreadyExists = accounts.some(
            a => a.employeeId === employeeId
        );

        if (alreadyExists) {
            return false;
        }

        const savedNextId = Number(localStorage.getItem(NEXT_ID_KEY))

        const maxId = Math.max(
            0, ...accounts.map(a => a.id || 0)
        )

        const newId = Math.max(
            maxId + 1,
            Number.isSafeInteger(savedNextId) && savedNextId > 0 ?
                savedNextId : 1
        )

        const newAccount = {
            id: newId,
            employeeId: employee.id,
            password: "asdf1234",
            role,
            status: "활성",
            mustChangePassword: true,
            createdAt: new Date().toISOString()
        }

        localStorage.setItem(NEXT_ID_KEY, String(newId + 1))

        setAccounts(prev => [
            ...prev, newAccount
        ])

        return true;

    }

    const updateAccount = (accountId, changes) => {

        if (!Number.isSafeInteger(accountId) || accountId <= 0) {
            return false;
        }

        const account = accounts.find(
            a => a.id === accountId
        );

        if (!account) {
            return false;
        }

        setAccounts(prev =>
            prev.map(a =>
                a.id === accountId
                    ? { ...a, ...changes }
                    : a
            )
        );

        return true;

    };

    const isLastActiveAdmin = (accountId) => {

        const activeAdmins = accounts.filter(a =>
            a.role === "ADMIN" &&
            a.status === "활성"
        );

        return (
            activeAdmins.length === 1 &&
            activeAdmins[0].id === accountId
        );

    };

    const changeAccountRole = (accountId, role) => {

        if (!ACCOUNT_ROLES.includes(role)) {
            return false;
        }

        if (role !== "ADMIN" && isLastActiveAdmin(accountId)) {
            return false;
        }

        return updateAccount(accountId, { role });

    };

    const setAccountStatus = (accountId, status) => {

        if (!ENABLE_STATUS.includes(status)) {
            return false;
        }

        if (status === "비활성" && isLastActiveAdmin(accountId)) {
            return false;
        }

        if (status === "활성") {
            const account = accounts.find(a => a.id === accountId);
            const employee = employees.find(
                e => e.id === account?.employeeId
            );

            if (!employee || employee.status === "퇴사") {
                return false;
            }
        }

        return updateAccount(accountId, { status });

    };

    const resetAccountPassword = (accountId) => {

        return updateAccount(accountId, {
            password: "asdf1234",
            mustChangePassword: true
        });

    };

    const changePassword = (id, prevPwd, nextPwd1, nextPwd2) => {

        const account = accounts.find(a => a.id === id);
    
        if (!account) {
            return { ok: false, message: "계정을 찾을 수 없습니다." };
        }
    
        if (account.password !== prevPwd) {
            return { ok: false, message: "기존 비밀번호가 올바르지 않습니다." };
        }
    
        const error = validatePassword(nextPwd1);
    
        if (error) {
            return { ok: false, message: error };
        }
    
        if (nextPwd1 !== nextPwd2) {
            return { ok: false, message: "새 비밀번호가 일치하지 않습니다." };
        }
    
        if (nextPwd1 === prevPwd) {
            return { ok: false, message: "기존 비밀번호와 다른 비밀번호를 입력하세요." };
        }
    
        const success = updateAccount(id, {
            password: nextPwd1,
            mustChangePassword: false
        });
    
        return success
            ? { ok: true }
            : { ok: false, message: "비밀번호 변경에 실패했습니다." };
    };
    const resetAccounts = () => {

        const nextId = Math.max(
            0,
            ...initialAccounts.map(a => a.id || 0)
        ) + 1

        localStorage.setItem(NEXT_ID_KEY, String(nextId))

        setAccounts(initialAccounts)

    }

    return ({
        accounts,
        addAccount,
        changeAccountRole,
        setAccountStatus,
        resetAccountPassword,
        resetAccounts,
        changePassword
    })

}

export default useAccountData