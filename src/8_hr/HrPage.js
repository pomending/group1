import React from "react";
import { useERP } from "../context/ERPContext";

function HrPage() {

    const { employees } = useERP()

    return (
        <div>
            <h1>인적자원 관리</h1>
            <p>직원 정보 및 부서별 인원 현황</p>
            <div>

                <div>
                    <p>전체 직원</p>
                    <h3>{employees.length}명</h3>
                </div>

                <div>
                    <p>재직 직원</p>
                    <h3>{employees.filter(
                        e => e.status === '재직'
                    ).length}명</h3>
                </div>

                <div>
                    <p>휴직 직원</p>
                    <h3>{employees.filter(
                        e => e.status === '휴직'
                    ).length}명</h3>
                </div>
            </div>

            <hr />

            <div>
                <h1>직원 목록</h1>

                <div>
                    
                </div>

            </div>

        </div>
    )
}

export default HrPage