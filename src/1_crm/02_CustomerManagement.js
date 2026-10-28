//고객 목록 및 관리(조회 등록 수정 삭제 페이지이동 엑셀다운로드)
import React, { useState } from "react";
//고객정보를 엑셀 파일로 생성하기 위한 라이브러리
import ExcelJS from "exceljs";
//생성된 엑셀 파일을 다운로드하기 위한 기능
import { saveAs } from "file-saver";
import { initialCustomerList } from "./04_initialCustomerList";
import "./02_CustomerManagement.css";

function CustomerManagement() {
    //현재등록된 전체 고객목록
    const [customerList, setCustomerList] = useState(
        JSON.parse(localStorage.getItem("crmCustomers")) || initialCustomerList
    );
    //검색창에 입력한 검색어
    const [search, setSearch] = useState("");
    //검색조건으로 나온 고객목록
    const [searchList, setSearchList] = useState(initialCustomerList);
    //체크 박스로 선택한 고객들의 ID목록
    const [checkedIds, setCheckedIds] = useState([]);
    //현재 보고있는 페이지 번호
    const [currentPage, setCurrentPage] = useState(1);
    //한 페이지에 보여줄 고객목록 수
    const customerCountPerPage = 10;
    //math.ceil() : 소수점이하를 올림하여 정수로 만드는 함수
    //totalPageCount :전체 페이지수  currentPageCustomerList:현재목록에 표시할 고개목록
    const totalPageCount = Math.ceil(searchList.length / customerCountPerPage);
    const currentPageCustomer = searchList.slice(
        (currentPage - 1) * customerCountPerPage,
        currentPage * customerCountPerPage
    );

    //고객사명으로 고객 검색
    function searchCustomer(e) {
        e.preventDefault();

        setSearchList(
            customerList.filter((customer) =>
                customer.companyName.includes(search)
            )
        );

        setCurrentPage(1);
    }

    //검색어와 검색결과 초기화
    function resetCustomerSearch() {
        setSearch("");
        setSearchList(customerList);
        setCurrentPage(1);
    }

    //신규고객등록 및 목록추가
    function addCustomer(newCustomer) {
        const newId = Math.max(
            0,
            ...customerList.map((customer) => customer.id)
        ) + 1;

        const updatedCustomers = [
            { ...newCustomer, id: newId },
            ...customerList
        ];

        setCustomerList(updatedCustomers);
        setSearchList(updatedCustomers);
        setSearch("");
    }

    //선택한 고객의 수정팝업 열기
    function openEditCustomer() {
        const selectedCustomer = customerList.find((customer) =>
            customer.id === checkedIds[0]
        );

        window.open(
            "/crm/edit?id=" + selectedCustomer.id + "&popup=1",
            "customerEdit",
            "width=600,height=700"
        );
    }
    //수정한 고객정보 저장
    function saveEditedCustomer(updateCustomer) {
        const updateCustomers = customerList.map((customer) =>
            customer.id === updateCustomer.id
                ? updateCustomer
                : customer
        );

        setCustomerList(updateCustomers);
        setSearchList(updateCustomers);
        setSearch("");
    }
    //체크박스로 선택한 고객 삭제
    function deleteSelectedCustomers() {
        const remainingCustomers = customerList.filter((customer) =>
            !checkedIds.includes(customer.id)
        );

        setCustomerList(remainingCustomers);
        setSearchList(remainingCustomers);
        setSearch("");
        setCheckedIds([]);
        setCurrentPage(1);
    }

    window.saveEditedCustomer = saveEditedCustomer;
    window.getCurrentCustomers = () => customerList;
    window.addCustomer = addCustomer;

    //고객 목록을 엑셀파일로 생성 및 다운로드
    async function downloadExcel(data = searchList) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("고객 목록");

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

        data.forEach((customer) => {
            worksheet.addRow(customer);
        });

        const buffer = await workbook.xlsx.writeBuffer();

        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        saveAs(blob, "고객목록.xlsx");
    }
    //선택한 고객만 엑셀로 생성 및 다운로드
    async function downloadSelectedExcel() {
        const selectedCustomers = customerList.filter((customer) =>
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
                    <strong>{customerList.length}개</strong>
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



