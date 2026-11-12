import React, { useState } from "react";
import "./02_ConsultationManagement.css";
import { useERP } from "../context/ERPContext";
import {
    validateCompanyName, validateConsultation, validateCustomerManager, validateDuplicateConsultation,
    validateEmail, validateMemo, validatePhone, formatPhone
} from "../utils/consultationUtils";


function ConsultationManagement() {
    //문의목록을 관리할 usestate
    const { consultations, addConsultation, updateConsultation,
        deleteConsultations, employees, customers, addCustomer,
        saveEditedCustomer, claims
    } = useERP();

    //체크박스로 선택한 문의 Id를 저장할 usestate
    const [checkIds, setCheckedIds] = useState([]);

    //수정할 문의를 저장하는 usestate
    const [editData, setEditData] = useState({});

    //검색창의 글자를 저장하는 usestate
    const [search, setSearch] = useState("");

    //버튼을눌러 확정된 검색어를 저장하는 usestate
    const [searchResult, setSearchResult] = useState("");

    //선택창에서 고른 검색기준 
    const [searchType, setSearchType] = useState("companyName")

    //버튼을 눌러 확정한 검색기준
    const [searchTypeResult, setSearchTypeResult] = useState("companyName")

    const editConsultation = () => {

        const selectedConsultation = consultations.find(
            (item) => item.id === checkIds[0])
        setEditData(selectedConsultation);
        alert("문의 상세정보를 불러왔습니다.\n상단에서 내용을 확인하거나 수정할 수 있습니다.");


    }

    const saveConsultation = () => {

        if (!validateConsultation(editData)) {
            return;
        }


        if (!validatePhone(editData.phone)) {
            return;
        }

        if (!validateEmail(editData.email)) {
            return;
        }
        if (!validateCompanyName(editData.companyName)) {
            return;
        }
        if (!validateCustomerManager(editData.customerManager)) {
            return;
        }
        if (!validateMemo(editData.memo)) {
            return;
        }
        if (!validateDuplicateConsultation(editData, consultations)) {
            return;
        }

        if (editData.status === "처리 중"
            || editData.status === "견적 요청"
            || editData.status === "문의 종료") {
            if (editData.employeeId === null
                || editData.employeeId === ""
                || editData.employeeId === undefined) {
                alert("처리중 단계부터는 담당자를 지정해야 됩니다.")
                return;
            }
        }

        let isNewCustomer = false;
        const originalConsultation = consultations.find(
            (consultation) => consultation.id === editData.id)

        const isMemoChanged = !originalConsultation
            || (originalConsultation.memo !== editData.memo)

        if (originalConsultation &&
            originalConsultation.companyName !== editData.companyName &&
            originalConsultation.status === "견적 요청") {
            alert("견적 요청된 상담의 고객은 변경할 수 없습니다.")
            return;
        }

        let customerId = editData.customerId ?? null
        if (editData.status === "견적 요청") {
            const existingCustomer = customers.find(
                (customer) => customer.companyName === editData.companyName)


            if (!existingCustomer) {
                const newCustomerId = addCustomer({
                    companyName: editData.companyName,
                    businessNumber: "",
                    customerManager: editData.customerManager,
                    employeeId: editData.employeeId ?? null,
                    phone: editData.phone,
                    email: editData.email || "",
                    address: "",
                    createdAt: new Date().toLocaleDateString("sv-SE"),
                    memo: editData.memo?.trim()
                        ? `${new Date().toLocaleDateString("sv-SE")} | ${editData.memo}`
                        : "",
                    registrationSource: "autosave"
                }
                )

                customerId = newCustomerId
                isNewCustomer = true;
            } else {
                customerId = existingCustomer.id
                //날짜형식 
                const today = new Date().toLocaleDateString("sv-SE");
                //메모형식
                const newMemo = `${today} | ${editData.memo}`;

                const updatedMemo = editData.memo?.trim()
                        
                    ? [existingCustomer.memo, newMemo].filter(Boolean).join("\n")
                    : (existingCustomer.memo || "");

                if (existingCustomer.customerManager !== editData.customerManager
                    || existingCustomer.email !== (editData.email?.trim() || existingCustomer.email)
                    || existingCustomer.phone !== editData.phone
                    || existingCustomer.memo !== editData.updatedMemo
                ) {
                    saveEditedCustomer(
                        {
                            ...existingCustomer, customerManager: editData.customerManager,
                            email: editData.email?.trim() || existingCustomer.email,
                            phone: editData.phone, memo: updatedMemo
                        }
                    )
                }
            }
        }

        if (editData.id) {
            const result = updateConsultation({ ...editData, customerId });

            if (!result.ok) {
                alert(result.message);
                return;
            }
        } else {
            addConsultation({ ...editData, customerId });
        }
        if (isNewCustomer) {
            alert("문의 정보가 저장되고 고객관리에 신규 등록되었습니다.");
        } else if (editData.status === "견적 요청" && isNewCustomer === false) {
            alert("문의 정보가 저장되고 기존 고객정보와 연결되었습니다.");
        } else {
            if (editData.id) {
                alert("문의 정보가 수정되었습니다.");
            } else {
                alert("새로운 문의가 등록되었습니다.");
            }
        }
        setEditData({});
        setCheckedIds([]);
    }

    const deleteConsultation = () => {

        const result = window.confirm(`선택된 ${checkIds.length}건을 삭제하시겠습니까?`)
        if (result === false) {
            return;
        }

        const deleteResult = deleteConsultations(checkIds);

        if (!deleteResult.ok) {
            alert(deleteResult.message);
            return;
        }

        setCheckedIds([]);
        if (checkIds.includes(editData.id)) {
            setEditData({})
        }
    }


    const searchConsultation = () => {

        setSearchResult(search)
        setSearchTypeResult(searchType)
    }

    const resetConsultationSearch = () => {
        setSearch("");
        setSearchResult("");
    }

    // 업체명 검색어에 일치하는 문의 목록을 필터링
    const filteredConsultation = consultations.filter((item) => {
        if (searchTypeResult === "companyName") {
            return (item.companyName || "").includes(searchResult)
        } else {
            const employeeName = employees.find(
                (employee) => employee.id === item.employeeId
            )?.name || "";
            return employeeName.includes(searchResult);
        }
    })

    //클레임 건수확인
    const pendingClaims = claims.filter(claim =>
        claim.status === "접수" || claim.status === "처리 중"
    )
    const pendingCount = pendingClaims.length;

    return (
        <div className="consultation-page">
            <h2>상담 관리</h2>
            <h3>미완료 클레임 {pendingCount}건</h3>
            <div className="consultation-box">
                <h6>고객 문의 접수 및 처리 현황 관리</h6>

                <h4>문의 등록/수정
                    <span>
                        {editData.id ? "기존 정보 수정중" : "신규 문의 등록 중"}
                    </span>
                </h4>
                <label>고객사명</label>
                <input type="text"
                    value={editData?.companyName || ""}
                    onChange={(e) => setEditData(
                        { ...editData, companyName: (e.target.value) }
                    )} />
                <label>문의 경로</label>
                <select
                    value={editData?.inquiryChannel || ""}
                    onChange={(e) => setEditData(
                        { ...editData, inquiryChannel: (e.target.value) }
                    )}>
                    <option>전화</option>
                    <option>이메일</option>
                    <option>방문</option>
                    <option>기타</option>
                </select>
                <br />
                <label>고객사 담당자</label>
                <input type="text"
                    value={editData?.customerManager || ""}
                    onChange={(e) => setEditData(
                        { ...editData, customerManager: (e.target.value) }
                    )} />

                <label>연락처</label>
                <input type="text"
                    value={editData?.phone || ""}
                    onChange={(e) => setEditData(
                        { ...editData, phone: formatPhone(e.target.value) }
                    )} /><br />

                <label>이메일</label>
                <input type="text"
                    value={editData?.email || ""}
                    onChange={(e) => setEditData(
                        { ...editData, email: (e.target.value) }
                    )} />


                <label>담당자</label>
                <select value={(editData.employeeId) ?? ""}
                    onChange={(e) =>
                        setEditData({
                            ...editData,
                            employeeId: e.target.value === "" ? null : Number(e.target.value)
                        })
                    }>
                    <option value="">미배정</option>
                    {employees
                        .filter((employee) => employee.department === "영업팀")
                        .map((employee) =>
                            <option key={employee.id}
                                value={employee.id}>{employee.name}</option>)}
                </select>
                <br />

                <label>진행상태</label>
                <select
                    value={editData?.status || "문의 접수"}
                    onChange={(e) => setEditData(
                        { ...editData, status: (e.target.value) }
                    )}>
                    <option>문의 접수</option>
                    <option>처리 중</option>
                    <option>견적 요청</option>
                    <option>문의 종료</option>
                </select>
                <br />
                <label>문의 사항/처리 내용</label>
                <textarea
                    value={editData?.memo || ""}
                    onChange={(e) => setEditData(
                        { ...editData, memo: (e.target.value) }
                    )} />

                <button
                    onClick={saveConsultation}>등록/수정 저장</button>

            </div>
            <hr />

            <div className="consultation-box">
                <h4>문의 목록</h4>
                <select
                    value={searchType}
                    onChange={((e) => setSearchType(e.target.value))}>
                    <option value="companyName">고객사명</option>
                    <option value="employeeName">담당자명</option>
                </select>
                <input type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)} />
                <button
                    onClick={searchConsultation}>검색</button>
                <button
                    onClick={resetConsultationSearch}>전체목록으로</button>
            </div>

            <div>
                <div className="consultation-table-actions">
                    <button
                        disabled={checkIds.length !== 1}
                        onClick={editConsultation}>상세보기</button>
                    <button
                        disabled={checkIds.length === 0}
                        onClick={deleteConsultation}>삭제</button>

                </div>
                <table>
                    <thead>
                        <tr>
                            <th>선택</th>
                            <th>고객사명</th>
                            <th>문의 경로</th>
                            <th>고객사 담당자</th>
                            <th>연락처</th>
                            <th>이메일</th>
                            <th>담당자</th>
                            <th>진행 상태</th>

                        </tr>
                    </thead>
                    <tbody>
                        {filteredConsultation
                            .map((item) => (
                                <tr key={item.id}>
                                    <td><input type="checkbox"
                                        checked={checkIds.includes(item.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setCheckedIds(
                                                    [...checkIds, item.id])
                                            }
                                            else {
                                                setCheckedIds(
                                                    checkIds.filter((id) => id != item.id)
                                                )
                                            }
                                        }}
                                    /></td>
                                    <td>{item.companyName}</td>
                                    <td>{item.inquiryChannel}</td>
                                    <td>{item.customerManager}</td>
                                    <td>{item.phone}</td>
                                    <td>{item.email}</td>
                                    <td>
                                        {employees.find((employee) => employee.id === item.employeeId)?.name || "미배정"}
                                    </td>
                                    <td>{item.status}</td>

                                </tr>
                            ))}
                        {filteredConsultation.length === 0 && (
                            <tr>
                                <td colSpan={8}>검색 결과가 없습니다</td>
                            </tr>
                        )}
                    </tbody>


                </table>

            </div>
        </div>
    )
}

export default ConsultationManagement;