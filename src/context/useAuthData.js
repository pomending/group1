import { useState } from "react";

function useAuthData(accounts, employees) {

    const AUTH_KEY = "erp_current_user_id"

    const [currentUserId, setCurrentUserId] = useState(() => {

        const savedId = sessionStorage.getItem(AUTH_KEY);
    
        if (savedId === null) { return null; }
    
        const id = Number(savedId);
    
        return Number.isSafeInteger(id) && id > 0 ? id : null;

    });

    const login = (email, pwd) => {

        const user = employees.find( e => e.email?.toLowerCase() === email.trim().toLowerCase() )

        if( !user ){
            return false;
        }

        const account = accounts.find( a => a.employeeId === user.id )

        if( !account ){
            return false;
        }

        if( account.password !== pwd ){
            return false;
        }

        if (
            !["재직", "휴직"].includes(user.status) ||
            account.status !== "활성"
        ) {
            return false;
        }

        setCurrentUserId(account.id);
        sessionStorage.setItem(AUTH_KEY, String(account.id));

        return true;

    }

    const logout = () => {

        setCurrentUserId(null)
        sessionStorage.removeItem(AUTH_KEY);

    }

    const currentUser = accounts.find(
        a => a.id === currentUserId
    ) ?? null;
    
    const currentEmployee = employees.find(
        e => e.id === currentUser?.employeeId
    ) ?? null;

    return {
        currentUserId,
        login,
        logout,
        currentUser,
        currentEmployee
    };
}

export default useAuthData;