import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import "./02_ConsultationManagement.css";
import { useERP } from "../context/ERPContext";
import { validateDuplicateConsultation, validateConsultationForm } from "../utils/consultationUtils";
import { formatPhone } from "../utils/formatUtils";


function ConsultationManagement() {

    const {
        consultations,
        deleteConsultations,
        employees,
        claims,
        saveConsultationWithCustomer
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

    //미배정된 사람만 볼 수 있게 하는 checkbox
    const [onlyUnassigned, setOnlyUnassigned] = useState(false);

    const originalConsultation = consultations.find(
        (consultation) => consultation.id === editData.id)

    const isReadOnly = ["문의 종료", "인계 완료"].includes(
        originalConsultation?.status
    );
    //페이지설정기준
    const [currentPage, setCurrentPage] = useState(1)
    //페이지당 보여질 목록개수
    const consultationPerPage = 10;

    const editConsultation = () => {

        const selectedConsultation = consultations.find(
            (item) => item.id === checkIds[0])
        setEditData(selectedConsultation);
        alert(
            ["문의 종료", "인계 완료"].includes(selectedConsultation.status)
                ? "문의 상세정보를 불러왔습니다.\n이 상담은 조회만 가능합니다."
                : "문의 상세정보를 불러왔습니다.\n상단에서 내용을 확인하거나 수정할 수 있습니다."
        );

    }

    const saveConsultation = () => {

        // 중복 상담은 사용자에게 등록 여부 확인
        if (!validateDuplicateConsultation(editData, consultations)) {
            return;
        }

        const result = saveConsultationWithCustomer(editData);

        if (!result.ok) {
            alert(result.message);
            return;
        }

        if (result.customerAction === "created") {
            alert("문의 정보가 저장되고 고객관리에 신규 등록되었습니다.");
        } else if (result.customerAction === "linked") {
            alert("문의 정보가 저장되고 기존 고객정보와 연결되었습니다.");
        } else if (editData.id) {
            alert("문의 정보가 수정되었습니다.");
        } else {
            alert("새로운 문의가 등록되었습니다.");
        }

        setEditData({});
        setCheckedIds([]);
    };

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
        setCurrentPage(1);
        if (checkIds.includes(editData.id)) {
            setEditData({})
        }
    }


    const searchConsultation = () => {

        setSearchResult(search);
        setSearchTypeResult(searchType);
        setCurrentPage(1);
    }

    const resetConsultationSearch = () => {
        setSearch("");
        setSearchResult("");
        setOnlyUnassigned(false);
        setCheckedIds([]);
        setCurrentPage(1);
    };

    // 업체명 검색어에 일치하는 문의 목록을 필터링
    const filteredConsultation = consultations.filter((item) => {

        if (
            onlyUnassigned &&
            item.employeeId != null &&
            item.employeeId !== ""
        ) {
            return false;
        }

        if (searchTypeResult === "companyName") {
            return (item.companyName || "").includes(searchResult)
        } else {
            const employeeName = employees.find(
                (employee) => employee.id === item.employeeId
            )?.name || "";
            return employeeName.includes(searchResult);
        }
    })

    //페이지네이션
    const startIndex = (currentPage - 1) * consultationPerPage
    const endIndex = startIndex + consultationPerPage

    const currentConsultations = filteredConsultation.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filteredConsultation.length / consultationPerPage)


    //클레임 건수확인
    const pendingClaims = (claims ?? []).filter(claim =>
        claim.status === "접수" || claim.status === "처리 중"
    )
    const pendingCount = pendingClaims.length;

    return (
        <div className="consultation-page">
            <PageHeader
                eyebrow="CONSULTATION MANAGEMENT"
                title="상담 관리"
                description="고객 문의 접수 및 처리 현황을 관리합니다."
            />
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
                    readOnly={isReadOnly}
                    onChange={(e) => setEditData(
                        { ...editData, companyName: (e.target.value) }
                    )} />
                <label>문의 경로</label>
                <select
                    value={editData?.inquiryChannel || ""}
                    disabled={isReadOnly}
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
                    readOnly={isReadOnly}
                    onChange={(e) => setEditData(
                        { ...editData, customerManager: (e.target.value) }
                    )} />

                <label>연락처</label>
                <input type="text"
                    value={editData?.phone || ""}
                    readOnly={isReadOnly}
                    onChange={(e) => setEditData(
                        { ...editData, phone: formatPhone(e.target.value) }
                    )} /><br />

                <label>이메일</label>
                <input type="text"
                    value={editData?.email || ""}
                    readOnly={isReadOnly}
                    onChange={(e) => setEditData(
                        { ...editData, email: (e.target.value) }
                    )} />


                <label>담당자</label>
                <select value={(editData.employeeId) ?? ""}
                    disabled={isReadOnly}
                    onChange={(e) =>
                        setEditData({
                            ...editData,
                            employeeId: e.target.value === "" ? null : Number(e.target.value)
                        })
                    }>
                    <option value="">미배정</option>
                    {employees
                        .filter(employee =>
                            (
                                employee.department === "영업팀" &&
                                employee.status === "재직"
                            ) ||
                            employee.id === originalConsultation?.employeeId
                        )
                        .map(employee => (
                            <option
                                key={employee.id}
                                value={employee.id}
                                disabled={
                                    employee.status !== "재직" ||
                                    employee.department !== "영업팀"
                                }
                            >
                                {employee.name}
                                {employee.status !== "재직" ? ` (${employee.status})` : ""}
                            </option>
                        ))}
                </select>
                <br />

                <label>진행상태</label>
                <select
                    value={editData?.status || "문의 접수"}
                    disabled={
                        isReadOnly ||
                        originalConsultation?.status === "견적 요청"
                    }
                    onChange={(e) => setEditData({
                        ...editData,
                        status: e.target.value
                    })}
                >
                    <option>문의 접수</option>
                    <option>처리 중</option>
                    <option>견적 요청</option>
                    <option>문의 종료</option>

                    <option value="인계 완료" disabled>
                        인계 완료
                    </option>
                </select>
                <br />
                <label>문의 사항/처리 내용</label>
                <textarea
                    value={editData?.memo || ""}
                    readOnly={isReadOnly}
                    onChange={(e) => setEditData({
                        ...editData,
                        memo: e.target.value
                    })}
                />

                <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={saveConsultation}
                >
                    등록/수정 저장
                </button>

            </div>
            <hr />

            <form
                className="consultation-box"
                onSubmit={(e) => {
                    e.preventDefault();
                    searchConsultation();
                }}
            >
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
                <button type="submit">검색</button>

                <label className="consultation-unassigned-filter">
                    <input
                        type="checkbox"
                        checked={onlyUnassigned}
                        onChange={(e) => {
                            setOnlyUnassigned(e.target.checked);
                            setCurrentPage(1);
                            setCheckedIds([]);
                        }}
                    />
                    미배정만 보기
                </label>
            </form>

            <div>
                <div className="consultation-table-actions">
                    <button
                        disabled={checkIds.length !== 1}
                        onClick={editConsultation}>상세보기</button>
                    <button
                        className="consultation-delete-btn"
                        disabled={checkIds.length === 0}
                        onClick={deleteConsultation}>삭제</button>

                    <button type="button" onClick={resetConsultationSearch}>
                        초기화
                    </button>
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
                        {currentConsultations
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
                <div className="consultation-pagination">
                    <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        이전
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            type="button"
                            key={index + 1}
                            className={currentPage === index + 1 ? "active" : ""}
                            onClick={() => setCurrentPage(index + 1)}
                        >
                            {index + 1}
                        </button>
                    ))}

                    <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        다음
                    </button>
                </div>

            </div>
        </div>
    )
}

export default ConsultationManagement;