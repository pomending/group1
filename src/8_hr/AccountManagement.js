import { useERP } from "../context/ERPContext";

function AccountManagement() {

    const { employees, accounts } = useERP()

    return (
        <div>
            <p>계정 관리 화면</p>
            <div>
                {accounts.map(account => {
                    const employee = employees.find(
                        e => e.id === account.employeeId
                    );

                    return (
                        <div key={account.id}>
                            <p>계정 ID: {account.id}</p>
                            <p>직원명: {employee?.name ?? "알 수 없음"}</p>
                            <p>부서: {employee?.department ?? "-"}</p>
                            <p>직급: {employee?.position ?? "-"}</p>
                            <p>권한: {account.role}</p>
                            <p>계정 상태: {account.status}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    )

}

export default AccountManagement