import React, { useState } from "react";
asdasdasdasdasdasd

// 고객사 더미 데이터 가져오기
import { customerList } from "./CustomerDummy";

// CRM 화면 전용 CSS
import './CrmPage.css';

function CrmPage() {

    // 검색창에 입력한 업체명(업체명 하나만저장하니까 문자열로)을 저장하는 state
    //검색버튼을 눌렀을때 어떤업체명을 검색해야 되는지 기억하기위해 만듬 
    const [search, setSearch] = useState('');

    // 검색 결과로 나온 고객 목록(전체정보)을 저장하는 state
    //검색 결과 그 업체의 모든정보가 나오게 하기위해 만듬
    const [searchResult, setSearchResult] = useState(customerList);



    // 검색 버튼을 클릭하면 실행되는 함수
    function searchCustomer() {

        // 전체 고객 목록(customerList)에서
        // 업체명(companyName)에 검색어(search)가 포함된 고객만 찾기
        // 검색 결과를 searchResult state에 저장
        // 전체 고객 목록에서 업체명에 검색어가 포함된 고객만 찾아 검색 결과 배열에 저장한다.
        setSearchResult(
            customerList.filter((item) =>
                item.companyName.includes(search)
            )
        );
    }


    return (
        <div className="crm-page">


            <h2>고객 관리</h2>


            <input
                placeholder="업체명을 입력하세요"

                // 입력할 때마다 search state 업데이트
                onChange={(e) => setSearch((e.target.value))}
            />


            <button onClick={searchCustomer}>
                검색
            </button>


            <table>


                <thead>
                    <tr>
                        <th>번호</th>
                        <th>업체명</th>
                        <th>사업자 등록번호</th>
                        <th>고객사 담당자명</th>
                        <th>담당자</th>
                        <th>연락처</th>
                        <th>이메일</th>
                        <th>주소</th>
                        <th>등록일</th>
                        <th>메모</th>
                    </tr>
                </thead>


                <tbody>



                    {searchResult.map((customer) => (
                        // 고객 한 명당 하나의 행(tr) 생성
                        // key : React가 각 행을 구분하는 고유값
                        <tr key={customer.id}>


                            <td>{customer.id}</td>
                            <td>{customer.companyName}</td>
                            <td>{customer.businessNumber}</td>
                            <td>{customer.customerManager}</td>
                            <td>{customer.employeeName}</td>
                            <td>{customer.phone}</td>
                            <td>{customer.email}</td>
                            <td>{customer.address}</td>
                            <td>{customer.createdAt}</td>
                            <td>{customer.memo}</td>

                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


export default CrmPage;
