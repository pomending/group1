//등록된 고객정보를 보여주는 컴포넌트
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import React, { use, useState } from "react";


import { customerList } from "./CustomerDummy";

import './CrmPage.css';

function CustomerList() {

    // 검색창에 입력한 검색어를 저장하고 변경하기 위한 state
    //검색버튼을 눌렀을때 어떤업체명을 검색해야 되는지 기억하기위해 만듬 
    const [search, setSearch] = useState('');

    const [customers, setCustomers] = useState(customerList);
const [searchResult, setSearchResult] = useState(customerList);

    //수정할 고객의 정보를 저장하는 state
    const [editData, setEditData] = useState(null);


    // 현재 페이지 번호를 저장하고 변경하는 state
    // 처음에는 1페이지부터 시작
    const [currentPage, setCurrentPage] = useState(1);
    //한페이지에 나오는 고객목록 수
    const itemsPerPage = 10;

    // 현재 페이지에 보여줄 고객 10명만 가져오기 ,const 변수명=배열.slice(0,1)0부터1까지가져와
    const currentCustomers = searchResult.slice(
        // 시작 위치 계산 (1페이지=0, 2페이지=10)
        (currentPage - 1) * itemsPerPage,
        // 끝 위치 계산 (1페이지=10, 2페이지=20)
        (currentPage - 1) * itemsPerPage + itemsPerPage);

    //검색된 고객 수를 기준으로 전체페이지수 계산( 소수점 올림 Math.ceil() )
    const totalPages = Math.ceil(searchResult.length / itemsPerPage);

    //체크박스에 체크한 고객들의 ID를 배열로 저장
    const [selectedIds, setSelectedIds] = useState([]);


    // 검색 버튼을 클릭하면 실행되는 함수
    function searchCustomer(e) {

        // 전체 고객 목록(customerList)에서
        // 업체명(companyName)에 검색어(search)가 포함된 고객만 찾기
        // 검색 결과를 searchResult state에 저장
        // 전체 고객 목록에서 업체명에 검색어가 포함된 고객만 찾아 검색 결과 배열에 저장한다.
        setSearchResult(
            customers.filter((item) =>
                item.companyName.includes(search)
            )
        );
        //검색했을때 페이지가 1이아닌 다른페이지일경우 검색결과가 1페이지에 있어 다른페이지에서 보이지않음
        //검색할때 자동으로 1페이지로 돌아가게 설정
        setCurrentPage(1);
        e.preventDefault()

    }

    //검색후 다시 초기 전체목록으로 초기화시키는 버튼만드는 함수
    function resetSearch() {
        //창비우기
        setSearch("")
        //현재 전체 고객 목록 다시 표시
        setSearchResult(customers)
        //첫페이지로 이동
        setCurrentPage(1)
    }

    //체크한 고객들을 목록에서 삭제하는 함수
    function deleteSelectedCustomers() {
        //전체  고객목록에서 체크한 고객을 제외하고 나머지만 가져오기
        const remainingCustomers = customers.filter((customer) =>
            !selectedIds.includes(customer.id))

        setCustomers(remainingCustomers)
        setSearchResult(remainingCustomers)
        setSearch("")
        setSelectedIds([])
        setCurrentPage(1)
    }

    function editCustomer() {
        const selectedCustomer = customers.find((customer) =>
            customer.id === selectedIds[0])

        setEditData(selectedCustomer);
        window.open(
            "/crm/edit?id=" + selectedCustomer.id + "&popup=1",
            "customerEdit",
            "width=600,height=700"
        );
    }

    function saveEditedCustomer(updateCustomer) {
        const updateCustomers = customers.map((customer) =>
            customer.id === updateCustomer.id
                ? updateCustomer
                : customer
        )
        setCustomers(updateCustomers)
        setSearchResult(updateCustomers)
        setSearch("")


    }

    function addCustomer(newCustomer) {

        const newId = Math.max(0, ...customers.map((customer) => customer.id || 0)) + 1;
        const updatedCustomers = [
            { ...newCustomer, id: newId },
            ...customers
        ];

        setCustomers(updatedCustomers)
        setSearchResult(updatedCustomers)
        setSearch("")

    }


    window.saveEditedCustomer = saveEditedCustomer
    window.getCurrentCustomers = () => customers;
    window.addCustomer = addCustomer;

    async function downloadExcel(data = searchResult) {
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

    async function downloadSelectedExcel() {
        const selectedCustomers = customers.filter(customer =>
            selectedIds.includes(customer.id)
        );
        await downloadExcel(selectedCustomers);
    }
    return (
        <div className="crm-page">
            <div className="crm-header">
                <div>
                    <p className="crm-path">CRM / 고객 관리</p>
                    <h2>고객 관리</h2>
                    <p className="crm-description">고객사 정보 조회 및 관리</p>
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
                    <span>총 {searchResult.length}건</span>
                </div>

                <form className="crm-search" onSubmit={searchCustomer}>
                    <input
                        placeholder="고객사명을 입력하세요"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" className="crm-btn-primary">
                        검색
                    </button>
                    <button
                        type="button"
                        className="crm-btn-secondary"
                        onClick={resetSearch}
                    >
                        전체목록으로
                    </button>
                </form>

                <div className="crm-toolbar">
                    <span>선택한 고객: {selectedIds.length}건</span>

                    <div className="crm-actions">
                        <button
                            className="crm-btn-primary"
                            onClick={() => window.open(
                                "/crm/register?popup=1",
                                "customerRegister",
                                "width=600,height=700"
                            )}
                        >
                            + 고객 등록
                        </button>

                        <button
                            className="crm-btn-secondary"
                            disabled={selectedIds.length !== 1}
                            onClick={editCustomer}
                        >
                            수정
                        </button>

                        <button
                            className="crm-btn-delete"
                            disabled={selectedIds.length === 0}
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
                            disabled={selectedIds.length === 0}
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
                            {currentCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="crm-empty">
                                        검색된 결과가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                currentCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(customer.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds([
                                                            ...selectedIds,
                                                            customer.id
                                                        ]);
                                                    } else {
                                                        setSelectedIds(
                                                            selectedIds.filter(
                                                                (id) => id !== customer.id
                                                            )
                                                        );
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td>{customer.id}</td>
                                        <td className="crm-company">{customer.companyName}</td>
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
                        {searchResult.length === 0
                            ? "0건"
                            : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                                currentPage * itemsPerPage,
                                searchResult.length
                            )} / ${searchResult.length}건`}
                    </span>

                    <div className="crm-page-buttons">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            ◀
                        </button>

                        {Array.from(
                            { length: totalPages },
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
                            disabled={currentPage >= totalPages}
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




export default CustomerList;



