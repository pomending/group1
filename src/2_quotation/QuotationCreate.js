import React, { useState } from "react";
import "./QuotationCreate.css"
import { useNavigate } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import { formatQuotationId, formatEmployeeId } from "../utils/formatUtils";

function QuotationCreate({ quotations, setQuotations }) {

    const navi = useNavigate();
    const [createAt, setCreateAt] = useState();
    const { customers, products, employees } = useERP();

    const [customerId, setCustomerId] = useState("")
    const [productId, setProductId] = useState("")
    const [employeeId, setEmployeeId] = useState("")

    //거래처 전체 정보 저장하는 변수
    const [selectedCustomer, setSelectedCustomer] = useState(null)

    //내부 담당자 담을 변수
    const [employeeSearch, setEmployeeSearch] = useState("")
    const [showEmployeeList, setShowEmployeeList] = useState(false)

    //내부 담당자 검색 필터링
    const filteredEmployees = employees.filter((employee) =>
        employee.status === "재직" && employee.name.includes(employeeSearch))

    //거래처 담을 변수
    const [customerSearch, setCustomerSearch] = useState("")
    const [showCustomerList, setShowCustomerList] = useState(false)

    //거래처 검색 결과 필터링
    const filteredCustomers = customers.filter((customer) =>
        customer.companyName.includes(customerSearch)
    )


    //다음 견적 ID 생성
    const nextId = Math.max(
        0,
        ...quotations.map((q) => q.id)
    ) + 1;


    //임시저장한 견적을 수정할 때 사용할 ID
    const [editinId, setEditinId] = useState(null);

    //견적서 임시저장
    const handleTempSave = () => {
        saveQuotation("임시저장");
    };

    //견적서 저장
    const handleSave = () => {
        saveQuotation("승인 대기");
    };

    //공통 저장 함수
    const saveQuotation = (status) => {
        const newQuotation = {
            id: nextId,
            customerId: Number(customerId),
            productId: Number(productId),
            employeeId: Number(employeeId),
            quantity: 0,
            unitPrice: 0,
            createdAt: createAt,
            validUntil: "",
            paymentMethod: "",
            memo: "",
            status: status
        }

        setQuotations([...quotations, newQuotation])

        navi("/quotation")
    }

    return (
        <div className="quotation-create">
            <header className="create-header">

                <h1>새 견적서 작성</h1>
                <p>거래처에 전달할 견적 정보를 입력합니다.</p>

            </header>

            <main className="create-content">

                <section>
                    <div className="section-header">
                        <span className="section-number">01</span>
                        <h2>견적 기본 정보</h2>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            {/* 견적 번호는 중복되지 않게 자동생성되게 만들기 */}
                            <label>견적 번호</label>
                            <input
                                type="text"
                                value={formatQuotationId(nextId)}
                                readOnly
                                className="readonly-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>작성일</label>
                            <input
                                type="date"
                                value={createAt}
                                onChange={(e) => setCreateAt(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>내부 담당자</label>
                            <input
                                type="text"
                                placeholder="담당자 이름을 검색하세요."
                                value={employeeSearch}
                                onChange={(e) => {
                                    setEmployeeSearch(e.target.value);
                                    setEmployeeId("");
                                    setShowEmployeeList(true);
                                }}
                                onFocus={() => setShowEmployeeList(true)}
                            />
                            {showEmployeeList && employeeSearch && (
                                <div className="employee-list">
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map((employee) => (
                                            <div
                                                key={employee.id}
                                                className="employee-item"
                                                onClick={() => {
                                                    setEmployeeId(employee.id)
                                                    setEmployeeSearch(employee.name)
                                                    setShowEmployeeList(false)
                                                }}>

                                                <strong>{employee.name}</strong>

                                                <div className="employee-info">
                                                    <span>
                                                        {formatEmployeeId(employee.id)}
                                                    </span>
                                                    <span>{employee.department}</span>
                                                </div>

                                            </div>
                                        ))
                                    ) : (
                                        <p>검색 결과가 없습니다.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="create-card">
                    <div className="section-header">
                        <span className="section-number">02</span>
                        <h2>거래처 정보</h2>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>거래처명</label>
                            <input
                                type="text"
                                placeholder="거래처명을 검색하세요."
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value)
                                    setCustomerId("")
                                    setShowCustomerList(true)
                                }}
                                onFocus={() => setShowCustomerList(true)}
                            />

                            {showCustomerList && customerSearch && (
                                <div className="customer-list">
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.map((customer) => (
                                            <div
                                                key={customer.id}
                                                className="customer-item"
                                                onClick={() => {
                                                    setCustomerId(customer.id)
                                                    setCustomerSearch(customer.companyName)
                                                    setSelectedCustomer(customer)
                                                    setShowCustomerList(false)
                                                }}>
                                                <strong>{customer.companyName}</strong>

                                                <div className="customer-info">
                                                    <span>{customer.businessNumber}</span>
                                                </div>

                                            </div>
                                        ))
                                    ) : (
                                        <p>검색 결과가 없습니다.</p>
                                    )}
                                </div>
                            )}

                        </div>

                        <div className="form-group">
                            <label>담당자</label>
                            <input
                                type="text"
                                placeholder="담당자를 입력하세요."
                                value={selectedCustomer?.customerManager || ""}
                            />
                        </div>

                        <div className="form-group">
                            <label>연락처</label>
                            <input
                                type="text"
                                placeholder="연락처를 입력하세요."
                                value={selectedCustomer?.phone || ""}
                            />
                        </div>
                    </div>
                </section>


                <section className="create-card">
                    <div className="section-header">
                        <span className="section-number">03</span>
                        <h2>상품 정보</h2>
                    </div>

                    <div className="product-form">
                        <div className="form-group product-name">
                            <label>상품명</label>
                            <input
                                type="text"
                                placeholder="상품명을 입력하세요." />
                        </div>

                        <div className="form-group">
                            <label>수량</label>
                            <input
                                type="number"
                                placeholder="수량을 입력하세요." />
                        </div>

                        <div className="form-group">
                            <label>단가 (원)</label>
                            <input
                                type="number"
                                placeholder="단가를 입력하세요." />
                        </div>

                        <div className="form-group">
                            <p>상품 총 금액 (원)</p>
                            <input
                                type="number"
                                placeholder="자동 계산"
                                readOnly
                                className="readonly-input"
                            />
                        </div>
                    </div>
                </section>

                <section className="create-card">
                    <div className="section-header">
                        <span className="section-number">04</span>
                        <h2>견적 금액</h2>
                    </div>

                    <div className="amount-grid">
                        <div className="amount-item">
                            <span>공급가액</span>
                            <strong>0원</strong>
                        </div>

                        <div className="amount-item">
                            <span>부가세 (10%)</span>
                            <strong>0원</strong>
                        </div>

                        <div className="amount-item total-amount">
                            <span>최종 견적 금액</span>
                            <strong>0원</strong>
                        </div>
                    </div>
                </section>

                <section className="create-card">
                    <div className="section-header">
                        <span className="section-number">05</span>
                        <h2>거래 조건</h2>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>견적 유효 기간</label>
                            <input
                                type="text"
                                placeholder="예: 발행일로부터 30일" />
                        </div>

                        <div className="form-group">
                            <label>납품 예정일</label>
                            <input type="date" />
                        </div>

                        <div className="form-group">
                            <label>결제 방법</label>
                            <select defaultValue="">
                                <option value="" disabled>결제방법을 선택하세요.</option>
                                <option value="계좌이체">계좌이체</option>
                                <option value="카드결제">카드결제</option>
                                <option value="현금결제">현금결제</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>특이사항</label>
                            <input
                                type="text"
                                placeholder="특이사항을 입력하세요." />
                        </div>
                    </div>
                </section>
            </main>

            <div className="create-footer">
                <button
                    className="cancel-btn"
                    onClick={() => navi("/quotation")}>
                    취소
                </button>

                <button
                    className="temp-save-btn"
                    onClick={handleTempSave}>
                    임시저장
                </button>

                <button
                    className="save-btn"
                    onClick={handleSave}>
                    견적서 저장
                </button>
            </div>

        </div>
    )
}

export default QuotationCreate