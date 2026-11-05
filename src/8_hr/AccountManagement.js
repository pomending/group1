import { useEffect, useState } from "react";
import { useERP } from "../context/ERPContext";
import { ACCOUNT_ROLES, ENABLE_STATUS } from "../utils/accountUtils";
import "./AccountManagement.css";

function AccountManagement() {
    const { employees, accounts, addAccount, changeAccountRole, setAccountStatus, resetAccountPassword } = useERP();

    const [accountCreateMode, setAccountCreateMode] = useState(false);
    const [search, setSearch] = useState("");
    const [searchStatus, setSearchStatus] = useState("");
    const [searchRole, setSearchRole] = useState("");
    const [selectedRole, setSelectedRole] = useState("EMPLOYEE");
    const [selectedAccountId, setSelectedAccountId] = useState(null);

    const filteredAccounts = accounts.filter(account => {
        const employee = employees.find(e => e.id === account.employeeId);
        const keyword = search.trim().toLowerCase();

        const matchesSearch =
            (employee?.name ?? "").toLowerCase().includes(keyword) ||
            (employee?.email ?? "").toLowerCase().includes(keyword);
        const matchesRole = searchRole === "" || account.role === searchRole;
        const matchesStatus = searchStatus === "" || account.status === searchStatus;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const eligibleEmployees = employees.filter(employee =>
        employee.status === "재직" &&
        !accounts.some(account => account.employeeId === employee.id)
    );

    const [selectedEmployeeId, setSelectedEmployeeId] = useState(eligibleEmployees[0]?.id ?? "");
    const selectedAccount = accounts.find(a => a.id === Number(selectedAccountId));
    const selectedEmployee = employees.find(e => e.id === selectedAccount?.employeeId);
    const [changedRole, setChangedRole] = useState("EMPLOYEE");

    const changedStatus = (account) => {
        if (!account) return null;
        return account.status === "활성" ? "비활성" : "활성";
    };

    // 모달에서 ESC를 누르면 닫고, 모달이 열린 동안 배경 페이지 스크롤을 막는다.
    useEffect(() => {
        if (!accountCreateMode && !selectedAccount) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setAccountCreateMode(false);
                setSelectedAccountId(null);
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleEscape);
        };
    }, [accountCreateMode, selectedAccount]);

    const handleCreateAccount = (e) => {
        e.preventDefault();
        const success = addAccount(selectedEmployeeId, selectedRole);

        if (success) {
            alert("계정이 생성되었습니다.");
            setAccountCreateMode(false);
        } else {
            alert("계정 발급에 실패했습니다.");
        }
    };

    const closeCreate = () => setAccountCreateMode(false);
    const closeManage = () => setSelectedAccountId(null);

    return (
        <div className="am-page">
            <div className="am-shell">
                <header className="am-header">
                    <div>
                        <p className="am-eyebrow">ACCOUNT MANAGEMENT</p>
                        <h1>계정 관리</h1>
                        <p className="am-muted">직원 계정의 발급, 권한 및 사용 상태를 관리합니다.</p>
                    </div>
                    <button
                        type="button"
                        className="am-btn am-btn-primary am-create-trigger"
                        onClick={() => {
                            setSelectedEmployeeId(eligibleEmployees[0]?.id ?? "");
                            setSelectedRole("EMPLOYEE");
                            setAccountCreateMode(!accountCreateMode);
                            setSelectedAccountId(null);
                        }}
                    >
                        <span aria-hidden="true" className="am-plus">+</span> 계정 발급
                    </button>
                </header>

                <section className="am-stats" aria-label="계정 현황">
                    <div className="am-stat-card">
                        <span className="am-stat-label">전체 계정</span>
                        <strong className="am-stat-value">{accounts.length}</strong>
                        <span className="am-stat-hint">등록된 ERP 계정</span>
                    </div>
                    <div className="am-stat-card">
                        <span className="am-stat-label">활성 계정</span>
                        <strong className="am-stat-value">{accounts.filter(a => a.status === "활성").length}</strong>
                        <span className="am-stat-hint">사용 가능한 계정</span>
                    </div>
                    <div className="am-stat-card">
                        <span className="am-stat-label">비활성 계정</span>
                        <strong className="am-stat-value">{accounts.filter(a => a.status === "비활성").length}</strong>
                        <span className="am-stat-hint">사용이 중지된 계정</span>
                    </div>
                </section>

                <section className="am-panel am-list-panel">
                    <div className="am-section-heading">
                        <div>
                            <h2>계정 목록</h2>
                            <p>직원별 권한과 계정 상태를 확인할 수 있습니다.</p>
                        </div>
                        <span className="am-result-count" aria-live="polite">조회 결과 {filteredAccounts.length}건</span>
                    </div>

                    <div className="am-filters">
                        <div className="am-search-wrap">
                            <svg className="am-search-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="7" />
                                <path d="m16 16 4 4" />
                            </svg>
                            <input
                                className="am-control am-search"
                                placeholder="직원명 또는 이메일 검색"
                                aria-label="직원명 또는 이메일 검색"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="am-control am-filter-select"
                            aria-label="권한 필터"
                            value={searchRole}
                            onChange={(e) => setSearchRole(e.target.value)}
                        >
                            <option value="">모든 권한</option>
                            {ACCOUNT_ROLES.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <select
                            className="am-control am-filter-select"
                            aria-label="계정 상태 필터"
                            value={searchStatus}
                            onChange={(e) => setSearchStatus(e.target.value)}
                        >
                            <option value="">모든 상태</option>
                            {ENABLE_STATUS.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    <div className="am-table-scroll">
                        <table className="am-table">
                            <thead>
                                <tr>
                                    <th scope="col">계정 ID</th>
                                    <th scope="col">직원명 / 이메일</th>
                                    <th scope="col">부서</th>
                                    <th scope="col">직급</th>
                                    <th scope="col">권한</th>
                                    <th scope="col">계정 상태</th>
                                    <th scope="col">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAccounts.map(account => {
                                    const employee = employees.find(e => e.id === account.employeeId);
                                    return (
                                        <tr key={account.id}>
                                            <td className="am-id">{account.id}</td>
                                            <td>
                                                <p className="am-employee-name">{employee?.name ?? "알 수 없음"}</p>
                                                <p className="am-employee-email">{employee?.email ?? "알 수 없음"}</p>
                                            </td>
                                            <td>{employee?.department ?? "-"}</td>
                                            <td>{employee?.position ?? "-"}</td>
                                            <td>
                                                <span className={`am-role am-role-${account.role.toLowerCase()}`}>
                                                    {account.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`am-status ${account.status === "활성" ? "am-status-active" : "am-status-inactive"}`}>
                                                    {account.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="am-btn am-btn-manage"
                                                    onClick={() => {
                                                        setSelectedAccountId(account.id);
                                                        setChangedRole(account.role);
                                                        setAccountCreateMode(false);
                                                    }}
                                                >
                                                    관리
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredAccounts.length === 0 && (
                        <p className="am-empty">검색 조건에 맞는 계정이 없습니다.</p>
                    )}
                </section>
            </div>

            {accountCreateMode && (
                <div className="am-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeCreate(); }}>
                    <section
                        className="am-modal am-modal-create"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="am-create-title"
                        aria-describedby="am-create-description"
                    >
                        <div className="am-modal-header">
                            <div>
                                <p className="am-modal-kicker">NEW ACCOUNT</p>
                                <h2 id="am-create-title">새 계정 발급</h2>
                                <p id="am-create-description">계정이 없는 재직 직원에게 계정을 발급합니다.</p>
                            </div>
                            <button type="button" className="am-close" onClick={closeCreate} aria-label="계정 관리 닫기" autoFocus>
                                <svg width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2.5"
                                    strokeLinecap="round">
                                    <path d="M18 6 6 18 M6 6 18 18" />
                                </svg>
                            </button>
                        </div>
                        {eligibleEmployees.length > 0 ? (
                            <form onSubmit={handleCreateAccount}>
                                <div className="am-modal-content">
                                    <div className="am-field">
                                        <label htmlFor="am-employee-select">직원 선택</label>
                                        <select
                                            id="am-employee-select"
                                            className="am-control"
                                            value={selectedEmployeeId}
                                            onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                                        >
                                            {eligibleEmployees.map(employee => (
                                                <option key={employee.id} value={employee.id}>
                                                    {employee.name} / {employee.department} / {employee.position}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <fieldset className="am-fieldset">
                                        <legend>계정 권한</legend>
                                        <div className="am-radio-group">
                                            {ACCOUNT_ROLES.map(role => (
                                                <label className="am-radio-item" key={role}>
                                                    <input
                                                        type="radio"
                                                        name="role"
                                                        value={role}
                                                        checked={selectedRole === role}
                                                        onChange={(e) => setSelectedRole(e.target.value)}
                                                    />
                                                    {role}
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                    <p className="am-form-note">초기 비밀번호가 설정되고, 최초 비밀번호 변경이 필요한 상태로 발급됩니다.</p>
                                </div>
                                <div className="am-modal-footer">
                                    <button type="button" className="am-btn am-btn-secondary" onClick={closeCreate}>취소</button>
                                    <button type="submit" className="am-btn am-btn-primary">계정 발급</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="am-modal-content">
                                    <p className="am-empty">계정을 발급할 수 있는 재직 직원이 없습니다.</p>
                                </div>
                                <div className="am-modal-footer">
                                    <button type="button" className="am-btn am-btn-secondary" onClick={closeCreate}>닫기</button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            )}

            {selectedAccount && (
                <div className="am-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeManage(); }}>
                    <section
                        className="am-modal am-modal-manage"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="am-manage-title"
                        aria-describedby="am-manage-description"
                    >
                        <div className="am-modal-header">
                            <div>
                                <p className="am-modal-kicker">ACCOUNT SETTINGS</p>
                                <h2 id="am-manage-title">{selectedEmployee?.name ?? "알 수 없음"} 계정 관리</h2>
                                <p id="am-manage-description">권한과 계정 사용 상태를 변경합니다.</p>
                            </div>
                            <button type="button" className="am-close" onClick={closeManage} aria-label="계정 관리 닫기" autoFocus>
                                <svg width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2.5"
                                    strokeLinecap="round">
                                    <path d="M18 6 6 18 M6 6 18 18" />
                                </svg>
                            </button>
                        </div>
                        <div className="am-modal-content am-manage-content">
                            <div className="am-account-summary">
                                <div>
                                    <span className="am-summary-label">직원 정보</span>
                                    <strong>{selectedEmployee?.name ?? "알 수 없음"}</strong>
                                    <span className="am-summary-sub">{selectedEmployee?.email ?? "-"}</span>
                                </div>
                                <span className="am-summary-dept">{selectedEmployee?.department ?? "-"} · {selectedEmployee?.position ?? "-"}</span>
                            </div>
                            <div className="am-manage-row">
                                <div className="am-manage-copy">
                                    <h3>계정 권한</h3>
                                    <p>선택한 직원의 계정 권한을 변경합니다.</p>
                                </div>
                                <div className="am-manage-actions">
                                    <select
                                        className="am-control am-role-select"
                                        aria-label="변경할 계정 권한"
                                        value={changedRole}
                                        onChange={(e) => setChangedRole(e.target.value)}
                                    >
                                        {ACCOUNT_ROLES.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="am-btn am-btn-primary"
                                        disabled={changedRole === selectedAccount.role}
                                        onClick={() => {
                                            const success = changeAccountRole(selectedAccount.id, changedRole);
                                            if (success) {
                                                alert("권한이 변경되었습니다.");
                                            } else {
                                                alert("권한을 변경할 수 없습니다.");
                                            }
                                        }}
                                    >
                                        권한 저장
                                    </button>
                                </div>
                            </div>
                            <div className="am-manage-row">
                                <div className="am-manage-copy">
                                    <h3>계정 상태 <span className={selectedAccount.status === "활성" ? "am-text-active" : "am-text-inactive"}>· {selectedAccount.status}</span></h3>
                                    <p>비활성 계정은 로그인할 수 없습니다.</p>
                                </div>
                                <button
                                    type="button"
                                    className={`am-btn ${selectedAccount.status === "활성" ? "am-btn-danger" : "am-btn-secondary"}`}
                                    onClick={() => {
                                        const success = setAccountStatus(selectedAccount.id, changedStatus(selectedAccount));
                                        if (success) {
                                            const msg = selectedAccount.status === "비활성" ? "계정이 활성화 되었습니다" : "계정이 비활성화 되었습니다";
                                            alert(msg);
                                        } else {
                                            alert("상태 변경에 실패했습니다");
                                        }
                                    }}
                                >
                                    계정 {changedStatus(selectedAccount)}화
                                </button>
                            </div>
                            <div className="am-manage-row">
                                <div className="am-manage-copy">
                                    <h3>비밀번호 초기화</h3>
                                    <p>변경 필요 여부: {selectedAccount.mustChangePassword ? "변경 필요" : "변경 완료"}</p>
                                </div>
                                <button
                                    type="button"
                                    className="am-btn am-btn-secondary"
                                    onClick={() => {
                                        const success = resetAccountPassword(selectedAccount.id);
                                        if (success) {
                                            alert("비밀번호가 초기화되었습니다");
                                        } else {
                                            alert("비밀번호 초기화가 실패했습니다");
                                        }
                                    }}
                                >
                                    초기화
                                </button>
                            </div>
                        </div>
                        <div className="am-modal-footer">
                            <button type="button" className="am-btn am-btn-secondary" onClick={closeManage}>닫기</button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

export default AccountManagement;
