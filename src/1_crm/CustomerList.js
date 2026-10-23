//등록된 고객정보를 보여주는 컴포넌트

import React, { useState } from "react";

// getCustomers 기존 고객정보와 신규등록 고객정보를 합쳐서 가져오는 함수
import getCustomers from "./CustomerService";

import './CrmPage.css';

function CustomerList() {

    // 검색창에 입력한 검색어를 저장하고 변경하기 위한 state
    //검색버튼을 눌렀을때 어떤업체명을 검색해야 되는지 기억하기위해 만듬 
    const [search, setSearch] = useState('');

    // 검색 결과로 나온 고객 목록(전체정보)을 저장하는 state
    // 처음에는 전체 고객 목록을 가져와 화면에 표시
    const [searchResult, setSearchResult] = useState(getCustomers());

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

    // 검색 버튼을 클릭하면 실행되는 함수
    function searchCustomer() {

        // 전체 고객 목록(customerList)에서
        // 업체명(companyName)에 검색어(search)가 포함된 고객만 찾기
        // 검색 결과를 searchResult state에 저장
        // 전체 고객 목록에서 업체명에 검색어가 포함된 고객만 찾아 검색 결과 배열에 저장한다.
        setSearchResult(
            getCustomers().filter((item) =>
                item.companyName.includes(search)
            )
        );
        //검색했을때 페이지가 1이아닌 다른페이지일경우 검색결과가 1페이지에 있어 다른페이지에서 보이지않음
        //검색할때 자동으로 1페이지로 돌아가게 설정
        setCurrentPage(1);

    }

    //검색후 다시 초기 전체목록으로 초기화시키는 버튼만드는 함수
    function resetSearch() {

        setSearch("")
        setSearchResult(getCustomers())
        setCurrentPage(1)
    }

    return (
        <div className="crm-page">

            <h2>고객 관리</h2>

            <input
                placeholder="업체명을 입력하세요"
                value={search}

                // 입력할 때마다 search state 업데이트
                onChange={(e) => setSearch((e.target.value))}
            />


            <button onClick={searchCustomer}>검색</button>

            <button onClick={resetSearch}>초기화</button>

            <button onClick={() => window.open('/customer-register', 'customerRegister', 'width=600,height=700')}>고객 등록</button>
            {/* 새창에서 열기 window.open(주소,창이름,크기) */}

            <table>

                <thead>
                    <tr>
                        <th>번호</th>
                        <th>업체명</th>
                        <th>사업자 등록번호</th>
                        <th>고객사 담당자</th>
                        <th>연락처</th>
                        <th>이메일</th>
                        <th>주소</th>
                        <th>등록일</th>
                        <th>메모</th>
                        <th>담당자</th>
                    </tr>
                </thead>


                <tbody>
                    {
                        (currentCustomers.length === 0) ?
                            <tr>
                                <td colSpan={10}>검색된 결과가 없습니다</td>
                            </tr>
                            :

                            currentCustomers.map((customer) => (
                                // 고객 한 명당 하나의 행(tr) 생성
                                // key : React가 각 행을 구분하는 고유값
                                <tr key={customer.id}>


                                    <td>{customer.id}</td>
                                    <td>{customer.companyName}</td>
                                    <td>{customer.businessNumber}</td>
                                    <td>{customer.customerManager}</td>
                                    <td>{customer.phone}</td>
                                    <td>{customer.email}</td>
                                    <td>{customer.address}</td>
                                    <td>{customer.createdAt}</td>
                                    <td>{customer.memo}</td>
                                    <td>{customer.employeeName}</td>

                                </tr>
                            ))}
                </tbody>
            </table>
            <button onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}>◀</button>
            <span>{currentPage}</span>
            <button onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}>▶</button>
        </div>
    );
}




export default CustomerList;



