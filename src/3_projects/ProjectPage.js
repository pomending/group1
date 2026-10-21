import React from "react";
import './projects.css'

function ProjectPage(){

    const projects = [
        {
          id: 1,
          name: "ABC대학교 텀블러 제작",
          customerId: 1,
          managerId: 1,
          startDate: "2026-10-21",
          dueDate: "2026-11-20",
          status: "진행 중",
          description: "창립기념 텀블러 300개 제작"
        },
        {
          id: 2,
          name: "미래전자 에코백 제작",
          customerId: 2,
          managerId: 2,
          startDate: "2026-10-25",
          dueDate: "2026-11-15",
          status: "대기",
          description: "홍보용 에코백 500개 제작"
        }
      ]

    return(

        <div>
            시작
            <p>테스트</p>
        </div>

    )

}

export default ProjectPage