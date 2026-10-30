//고객 목록 및 관리(조회 등록 수정 삭제 페이지이동 엑셀다운로드)

import React, { useState,useEffect } from "react";
//고객정보를 엑셀 파일로 생성하기 위한 라이브러리
import ExcelJS from "exceljs";
//생성된 엑셀 파일을 다운로드하기 위한 기능
import { saveAs } from "file-saver";
import "./02_CustomerManagement.css";
import { useERP } from "../context/ERPContext";


function CustomerManagement() {
    //ERPcontext에 있는 함수 가져오기
    const { customers, setCustomers, addCustomer,
        saveEditedCustomer,deleteCustomers} = useERP();


    //검색창에 입력한 검색어
    const [search, setSearch] = useState("");
    //검색조건으로 나온 고객목록
    const [searchList, setSearchList] = useState(customers);
    useEffect(()=>{
        setSearchList(customers)
    },[customers])
    //체크 박스로 선택한 고객들의 ID목록
    const [checkedIds, setCheckedIds] = useState([]);
    //현재 보고있는 페이지 번호
    const [currentPage, setCurrentPage] = useState(1);
    //한 페이지에 보여줄 고객목록 수
    const customerCountPerPage = 10;
    //math.ceil() : 소수점이하를 올림하여 정수로 만드는 함수
    //totalPageCount :전체 페이지수  currentPagecustomers:현재목록에 표시할 고개목록
    const totalPageCount = Math.ceil(searchList.length / customerCountPerPage);
    const currentPageCustomer = searchList.slice(
        (currentPage - 1) * customerCountPerPage,
        currentPage * customerCountPerPage
    );

    //고객사명으로 고객 검색
    function searchCustomer(e) {
        e.preventDefault();

        setSearchList(
            customers.filter((customer) =>
                customer.companyName.includes(search)
            )
        );

        setCurrentPage(1);
    }

    //검색어와 검색결과 초기화
    function resetCustomerSearch() {
        setSearch("");
        setSearchList(customers);
        setCurrentPage(1);
    }

    
    

    //선택한 고객의 수정팝업 열기
    function openEditCustomer() {
        const selectedCustomer = customers.find((customer) =>
            customer.id === checkedIds[0]
        );
        //주소,창이름,크기
        window.open(
            "/crm/edit?id=" + selectedCustomer.id + "&popup=1",
            "customerEdit",
            "width=600,height=700"
        );
    }
    
    //체크박스로 선택한 고객 삭제(체크가 되어있지 않은 목록을 불러와 저장)
    function deleteSelectedCustomers() {
        const deleteCount = checkedIds.length;
        const isConfirmed = window.confirm(
            `선택한 고객 ${deleteCount}건을 삭제하시겠습니까?`
        );
        if (!isConfirmed) {
            return;
        }
        //삭제함수 context에서 가져오기
        deleteCustomers(checkedIds);

        setSearch("");
        setCheckedIds([]);
        setCurrentPage(1);

        alert(`고객정보 ${deleteCount}건이 삭제되었습니다.`);
    }

    

    //고객 등록·수정 팝업에서 부모 창의 함수와 데이터를 사용하도록 연결
    window.saveEditedCustomer = saveEditedCustomer;
    window.getCurrentCustomers = () => customers;
    window.addCustomer = addCustomer;

    //고객 목록을 엑셀파일로 생성 및 다운로드파일 만들기 async =비동기 처리
    //엑셀 문서 생성 → 시트 생성 → 고객 데이터 입력 → XLSX 데이터 생성 → Blob으로 묶기 → 다운로드
    async function downloadExcel(data = searchList) {
        //엑셀문서 생성
        const workbook = new ExcelJS.Workbook();
        //엑셀시트 생성
        const worksheet = workbook.addWorksheet("고객 목록");
        //엑셀 시트 내용
        //열 제목,속성값,너비
        worksheet.columns = [
            { header: "번호", key: "id", width: 10 },
            { header: "고객사명", key: "companyName", width: 25 },
            { header: "사업자등록번호", key: "businessNumber", width: 20 },
            { header: "고객사 담당자", key: "customerManager", width: 20 },
            { header: "연락처", key: "phone", width: 20 },
            { header: "이메일", key: "email", width: 30 },
            { header: "주소", key: "address", width: 40 },
            { header: "등록일", key: "createdAt", width: 18 },
            { header: "메모", key: "memo", width: 35 },
            { header: "내부 담당자", key: "employeeName", width: 20 }
        ];
        //고객정보를 반복하여 엑셀시트에 한 행씩 추가
        data.forEach((customer) => {
            worksheet.addRow(customer);
        });
        // 엑셀 문서를 실제 파일 데이터로 변환
        const buffer = await workbook.xlsx.writeBuffer();
        // XLSX 데이터를 브라우저에서 파일처럼 다룰 수 있도록 묶기
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
        // 생성된 엑셀 파일을 고객목록.xlsx라는 이름으로 다운로드실행
        saveAs(blob, "고객목록.xlsx");
    }


    //선택한 고객만 엑셀로 생성 및 다운로드
    async function downloadSelectedExcel() {
        const selectedCustomers = customers.filter((customer) =>
            checkedIds.includes(customer.id)
        );

        await downloadExcel(selectedCustomers);
    }

    return (
        <div className="crm-page">
            <div className="crm-header">
                <div>
                    <p className="crm-path">CRM / 고객 관리</p>
                    <h2>고객 관리</h2>
                    <p className="crm-description">
                        고객사 정보 조회 및 관리
                    </p>
                </div>
            </div>

            <div className="crm-summary">
                <div className="crm-summary-card">
                    <span>전체 고객사</span>
                    <strong>{customers.length}개</strong>
                </div>
            </div>

            <div className="crm-content">
                <div className="crm-content-header">
                    <h3>고객사 목록</h3>
                    <span>총 {searchList.length}건</span>
                </div>

                <form
                    className="crm-search"
                    onSubmit={searchCustomer}
                >
                    <input
                        placeholder="고객사명을 입력하세요"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <button
                        type="submit"
                        className="crm-btn-primary"
                    >
                        검색
                    </button>

                    <button
                        type="button"
                        className="crm-btn-secondary"
                        onClick={resetCustomerSearch}
                    >
                        전체목록으로
                    </button>
                </form>

                <div className="crm-toolbar">
                    <span>선택한 고객: {checkedIds.length}건</span>

                    <div className="crm-actions">
                        <button
                            className="crm-btn-primary"
                            onClick={() =>
                                window.open(
                                    "/crm/register?popup=1",
                                    "customerRegister",
                                    "width=600,height=700"
                                )
                            }
                        >
                            + 고객 등록
                        </button>

                        <button
                            className="crm-btn-secondary"
                            disabled={checkedIds.length !== 1}
                            onClick={openEditCustomer}
                        >
                            수정
                        </button>

                        <button
                            className="crm-btn-delete"
                            disabled={checkedIds.length === 0}
                            onClick={deleteSelectedCustomers}
                        >
                            삭제
                        </button>

                        <button
                            className="crm-btn-secondary"
                            onClick={() => downloadExcel()}
                        >
                            전체/검색결과 다운로드
                        </button>

                        <button
                            className="crm-btn-secondary"
                            disabled={checkedIds.length === 0}
                            onClick={downloadSelectedExcel}
                        >
                            선택 고객 다운로드
                        </button>
                    </div>
                </div>

                <div className="crm-table-wrap">
                    <table className="crm-table">
                        <thead>
                            <tr>
                                <th>선택</th>
                                <th>번호</th>
                                <th>고객사명</th>
                                <th>사업자등록번호</th>
                                <th>고객사 담당자</th>
                                <th>연락처</th>
                                <th>이메일</th>
                                <th>주소</th>
                                <th>등록일</th>
                                <th>메모</th>
                                <th>내부 담당자</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentPageCustomer.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="crm-empty">
                                        검색된 결과가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                currentPageCustomer.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={checkedIds.includes(customer.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setCheckedIds([
                                                            ...checkedIds,
                                                            customer.id
                                                        ]);
                                                    } else {
                                                        setCheckedIds(
                                                            checkedIds.filter(
                                                                (id) => id !== customer.id
                                                            )
                                                        );
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td>{customer.id}</td>
                                        <td className="crm-company">
                                            {customer.companyName}
                                        </td>
                                        <td>{customer.businessNumber}</td>
                                        <td>{customer.customerManager}</td>
                                        <td>{customer.phone}</td>
                                        <td>{customer.email}</td>
                                        <td>{customer.address}</td>
                                        <td>{customer.createdAt}</td>
                                        <td>{customer.memo}</td>
                                        <td>{customer.employeeName}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="crm-pagination">
                    <span className="crm-page-info">
                        {searchList.length === 0
                            ? "0건"
                            : `${(currentPage - 1) * customerCountPerPage + 1}-${Math.min(
                                currentPage * customerCountPerPage,
                                searchList.length
                            )} / ${searchList.length}건`}
                    </span>

                    <div className="crm-page-buttons">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            ◀
                        </button>

                        {Array.from(
                            { length: totalPageCount },
                            (_, index) => index + 1
                        ).map((page) => (
                            <button
                                key={page}
                                className={currentPage === page ? "active" : ""}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            disabled={currentPage >= totalPageCount}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            ▶
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CustomerManagement;



