import React, { useState } from "react";
import "./QuotationCreate.css"
import { useLocation, useNavigate } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import { formatQuotationId, formatEmployeeId } from "../utils/formatUtils";

function QuotationCreate() {

    const navi = useNavigate();
    const location = useLocation();

    const [createdAt, setCreatedAt] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() +1).padStart(2,"0");
        const day = String(today.getDate()).padStart(2,"0");

        return `${year}-${month}-${day}`;
    });

    const {
        consultations,
        customers,
        products,
        employees,
        quotations,
        addQuotation,
        updateQuotation,
        getNextQuotationId
    } = useERP();

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
    const nextId = getNextQuotationId();

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

        const newQuotation = {
            ...(editQuotation ? {id: editQuotation.id} : {}),
            customerId: selectedCustomer ? Number(selectedCustomer.id) : null,
            productId: productId ? Number(productId) : null,
            employeeId: employeeId ? Number(employeeId) : null,
            quantity: quantity === "" ? 0 : Number(quantity),
            unitPrice: unitPrice === "" ? 0 : Number(unitPrice),
            createdAt: createdAt,
            validUntil,
            deliveryDate,
            paymentMethod,
            memo,
            status
        }

        let result;

        if (editQuotation) {
            //기존 견적서 수정
            result = updateQuotation(newQuotation)
        } else {
            //신규 견적서 등록
           result = addQuotation(newQuotation)
        }

        if(!result.ok){
            alert(result.message)
            return;
        }

        if (editQuotation) {
            navi(`/quotation/detail/${editQuotation.id}`)
        } else {
            navi("/quotation")
        }
    }

    
    React.useEffect(() => {
        
        if (!editQuotation) return;

        setConsultationId(
            editQuotation.customerId ? "existing" : ""
        )

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

        setCreatedAt(editQuotation.createdAt || "");
        setValidUntil(editQuotation.validUntil || "");
        setDeliveryDate(editQuotation.deliveryDate || "");

        setPaymentMethod(editQuotation.paymentMethod || "");
        setMemo(editQuotation.memo || "");
    }, [editQuotation]);

    return (
        <div className="quotation-create">
            <header className="create-header">

                <h1>{editQuotation ? "견적서 수정" : "새 견적서 작성"}</h1>
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
                                value={createdAt}
                                onChange={(e) => setCreatedAt(e.target.value)}
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
                                className="quantity-input"
                                min={1}
                                placeholder="수량을 입력하세요."
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>단가 (원)</label>
                            <input
                                type="number"
                                className="quantity-input"
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