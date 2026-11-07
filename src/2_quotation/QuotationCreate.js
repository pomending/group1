import React, { useState } from "react";
import "./QuotationCreate.css"
import { useLocation, useNavigate } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import { formatQuotationId, formatEmployeeId } from "../utils/formatUtils";

function QuotationCreate({ quotations, setQuotations }) {

    const navi = useNavigate();
    const location = useLocation();

    const [createAt, setCreateAt] = useState("");
    /* 원본 비교 · 고객 ID를 상태에 저장하던 방식
    const { customers, products, employees } = useERP();

    const [customerId, setCustomerId] = useState("")
    */
    const { consultations, customers, products, employees } = useERP();

    const [consultationId, setConsultationId] = useState("")
    const [productId, setProductId] = useState("")
    const [employeeId, setEmployeeId] = useState("")

    const [productSearch, setProductSearch] = useState("")
    const [showProductList, setShowProductList] = useState(false)

    //내부 담당자 담을 변수
    const [employeeSearch, setEmployeeSearch] = useState("")
    const [showEmployeeList, setShowEmployeeList] = useState(false)

    //내부 담당자 검색 필터링
    const filteredEmployees = employees.filter((employee) =>
        employee.status === "재직" && employee.name.includes(employeeSearch))

    /* 원본 비교 · 고객 목록에서 회사명을 검색하던 코드
    //거래처 전체 정보 저장하는 변수
    const [selectedCustomer, setSelectedCustomer] = useState(null)

    //거래처 담을 변수
    const [customerSearch, setCustomerSearch] = useState("")
    const [showCustomerList, setShowCustomerList] = useState(false)

    //거래처 검색 결과 필터링
    const filteredCustomers = customers.filter((customer) =>
        customer.companyName.includes(customerSearch)
    )
    */
    const quotationRequests = consultations.filter(consultation =>
        consultation.status === "견적 요청" &&
        customers.some(customer => customer.id === consultation.customerId)
    );

    //판매중인 상품 검색
    const filteredProducts = products.filter((product) =>
        product.productStatus === "판매 중" &&
        product.productName.includes(productSearch)
    )

    //단가 상태값
    const [unitPrice, setUnitPrice] = useState("")

    //수량 상태값
    const [quantity, setQuantity] = useState("")

    //상품 총 금액 계산
    const totalPrice = Number(quantity) * Number(unitPrice)

    //부가세 및 최종 견적 금액
    const vat = totalPrice * 0.1;
    const finalPrice = totalPrice + vat;

    //거래조건 상태값
    const [validUntil, setValidUntil] = useState("")
    const [deliveryDate, setDeliveryDate] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("")
    const [memo, setMemo] = useState("")

    /* 원본 비교 · 수정 견적을 찾아오는 기존 코드의 위치와 형태
    //어디서 들어온건지 확인하는 코드
    const fromDetail = location.state?.fromDetail;


    const editId = location.state?.editId
    const editQuotation = quotations.find(
        q => q.id === Number(editId)
    )
    */
    const fromDetail = location.state?.fromDetail;
    const editId = location.state?.editId;
    const editQuotation = quotations.find(q => q.id === Number(editId));
    const existingCustomer = customers.find(c => c.id === editQuotation?.customerId);
    const selectedConsultation = quotationRequests.find(
        consultation => consultation.id === Number(consultationId)
    );
    const selectedCustomer = consultationId === "existing"
        ? existingCustomer
        : customers.find(customer => customer.id === selectedConsultation?.customerId);

    //다음 견적 ID 생성
    const nextId = Math.max(
        0,
        ...quotations.map((q) => q.id)
    ) + 1;

    //견적서 임시저장
    const handleTempSave = () => {
        saveQuotation("임시 저장");
    };

    //견적서 저장
    const handleSave = () => {
        saveQuotation("승인 대기");
    };

    //공통 저장 함수
    const saveQuotation = (status) => {

        /* 원본 비교 · 선택한 고객 ID로 검사하던 코드
        if (status === "승인 대기") {
            if (!customerId || !productId || !employeeId) {
                alert("거래처, 상품, 내부 담당자를 선택해주세요")
                return;
            }

            if (!quantity || !unitPrice || !createAt) {
                alert("작성일, 수량, 단가를 입력해주세요")
                return;
            }
        }
        */
        if (consultationId && !selectedCustomer) {
            alert("선택한 거래처를 확인할 수 없습니다. 견적 요청 상담을 다시 선택해주세요.");
            return;
        }

        if (status === "승인 대기") {
            if (!selectedCustomer || !productId || !employeeId) {
                alert("거래처, 상품, 내부 담당자를 선택해주세요.")
                return;
            }

            if (!quantity || !unitPrice || !createAt) {
                alert("작성일, 수량, 단가를 입력해주세요")
                return;
            }
        }
        const newQuotation = {
            id: editQuotation ? editQuotation.id : nextId,
            /* 원본 비교 · 고객 ID를 직접 저장하던 코드
            customerId: customerId ? Number(customerId) : null,
            */
            customerId: selectedCustomer ? Number(selectedCustomer.id) : null,
            productId: productId ? Number(productId) : null,
            employeeId: employeeId ? Number(employeeId) : null,
            quantity: quantity === "" ? 0 : Number(quantity),
            unitPrice: quantity === "" ? 0 : Number(unitPrice),
            createdAt: createAt,
            validUntil,
            deliveryDate,
            paymentMethod,
            memo,
            status
        }

        if (editQuotation) {
            //기존 견적서 수정
            setQuotations(
                quotations.map(q =>
                    q.id === editQuotation.id ? newQuotation : q
                )
            )
        } else {
            //신규 견적서 등록
            setQuotations([...quotations, newQuotation])
        }
        if (editQuotation) {
            navi(`/quotation/detail/${editQuotation.id}`)
        } else {
            navi("/quotation")
        }
    }

    /* 원본 비교 · 수정 화면에서 거래처 정보를 별도 상태로 불러오던 코드
    React.useEffect(() => {
        if (!editQuotation) return;

        setCustomerId(editQuotation.customerId || "");
        setProductId(editQuotation.productId || "");
        setEmployeeId(editQuotation.employeeId || "");

        //거래처 정보를 찾아서 화면에 다시 연결하는 과정
        setCustomerId(editQuotation.customerId || "");

        const customer = customers.find(
            c => c.id === editQuotation.customerId
        );

        setSelectedCustomer(customer || null);
        setCustomerSearch(customer?.companyName || "");

        setEmployeeSearch(
            employees.find(e => e.id === editQuotation.employeeId)?.name || ""
        )

        setProductSearch(
            products.find(p => p.id === editQuotation.productId)?.productName || ""
        )


        setQuantity(editQuotation.quantity || "");
        setUnitPrice(editQuotation.unitPrice || "");

        setCreateAt(editQuotation.createdAt || "");
        setValidUntil(editQuotation.validUntil || "");
        setDeliveryDate(editQuotation.deliveryDate || "");

        setPaymentMethod(editQuotation.paymentMethod || "");
        setMemo(editQuotation.memo || "");
    }, [editQuotation]);
    */
    React.useEffect(() => {
        setConsultationId(existingCustomer ? "existing" : "");
        if (!editQuotation) return;

        setProductId(editQuotation.productId || "");
        setEmployeeId(editQuotation.employeeId || "");

        setEmployeeSearch(
            employees.find(e => e.id === editQuotation.employeeId)?.name || ""
        )

        setProductSearch(
            products.find(p => p.id === editQuotation.productId)?.productName || ""
        )


        setQuantity(editQuotation.quantity || "");
        setUnitPrice(editQuotation.unitPrice || "");

        setCreateAt(editQuotation.createdAt || "");
        setValidUntil(editQuotation.validUntil || "");
        setDeliveryDate(editQuotation.deliveryDate || "");

        setPaymentMethod(editQuotation.paymentMethod || "");
        setMemo(editQuotation.memo || "");
    }, [editQuotation, existingCustomer]);

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
                                value={formatQuotationId(editQuotation ? editQuotation.id : nextId)}
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
                                onBlur={() => setShowEmployeeList(false)}
                            />
                            {showEmployeeList && (
                                <div className="employee-list">
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map((employee) => (
                                            <div
                                                key={employee.id}
                                                className="employee-item"
                                                onMouseDown={(e) => e.preventDefault()}
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
                            {/* 원본 비교 · 거래처명 검색과 검색 결과 목록
                            <label>거래처명</label>
                            <input
                                type="text"
                                placeholder="거래처명을 검색하세요."
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value)
                                    setCustomerId("")
                                    setSelectedCustomer(null)
                                    setShowCustomerList(true)
                                }}
                                onFocus={() => setShowCustomerList(true)}
                                onBlur={() => setShowCustomerList(false)}
                            />

                            {showCustomerList && (
                                <div className="customer-list">
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.map((customer) => (
                                            <div
                                                key={customer.id}
                                                className="customer-item"
                                                onMouseDown={(e) => e.preventDefault()}
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
                            */}
                            <label htmlFor="quotation-consultation">견적 요청 상담</label>
                            <select
                                id="quotation-consultation"
                                value={consultationId}
                                onChange={(e) => setConsultationId(e.target.value)}
                            >
                                <option value="">
                                    {quotationRequests.length > 0
                                        ? "견적 요청 상담을 선택하세요."
                                        : "선택 가능한 견적 요청 상담이 없습니다."}
                                </option>
                                {existingCustomer && (
                                    <option value="existing">
                                        {existingCustomer.companyName} (기존 거래처)
                                    </option>
                                )}
                                {quotationRequests.map(consultation => (
                                    <option key={consultation.id} value={consultation.id}>
                                        {consultation.companyName} (상담 #{consultation.id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>담당자</label>
                            <input
                                type="text"
                                placeholder="담당자를 입력하세요."
                                value={selectedCustomer?.customerManager || ""}
                                readOnly
                            />
                        </div>

                        <div className="form-group">
                            <label>연락처</label>
                            <input
                                type="text"
                                placeholder="연락처를 입력하세요."
                                value={selectedCustomer?.phone || ""}
                                readOnly
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
                                placeholder="상품명을 입력하세요."
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value)
                                    setProductId("")
                                    setUnitPrice("")
                                    setQuantity("")
                                    setShowProductList(true)
                                }}
                                onFocus={() => setShowProductList(true)}
                                onBlur={() => setShowProductList(false)}
                            />
                            {showProductList && (
                                <div className="product-list">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                className="product-item"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    setProductId(product.id);
                                                    setProductSearch(product.productName);
                                                    setShowProductList(false);
                                                    setUnitPrice(product.productPrice)
                                                }}
                                            >
                                                <strong>{product.productName}</strong>

                                                <div>
                                                    <span>{product.productPrice.toLocaleString()}원</span>
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
                            <label>수량</label>
                            <input
                                type="number"
                                placeholder="수량을 입력하세요."
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>단가 (원)</label>
                            <input
                                type="number"
                                placeholder="단가를 입력하세요."
                                value={unitPrice}
                                onChange={(e) => setUnitPrice(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <p>상품 총 금액 (원)</p>
                            <input
                                type="number"
                                placeholder="자동 계산"
                                value={totalPrice}
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
                            <strong>{totalPrice.toLocaleString()}원</strong>
                        </div>

                        <div className="amount-item">
                            <span>부가세 (10%)</span>
                            <strong>{vat.toLocaleString()}원</strong>
                        </div>

                        <div className="amount-item total-amount">
                            <span>최종 견적 금액</span>
                            <strong>{finalPrice.toLocaleString()}원</strong>
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
                            {/* 유효기간이 지나면 원자재 가격이나 제작비 변동 등을 이유로 견적을 다시 산정 가능 */}
                            <label>견적 유효 기간</label>
                            <input
                                type="date"
                                placeholder="예: 발행일로부터 30일"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)} />
                        </div>

                        <div className="form-group">
                            {/* 거래처가 주문한 상품을 언제까지 전달할 예정인지 */}
                            <label>납품 예정일</label>
                            <input type="date"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>결제 방법</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}>
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
                                placeholder="특이사항을 입력하세요."
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)} />
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
                {!fromDetail && (
                    <button
                        className="temp-save-btn"
                        onClick={handleTempSave}>
                        임시저장
                    </button>
                )}
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