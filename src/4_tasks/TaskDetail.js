import React, { useState } from "react";
import { useNavigate } from "react-router-dom";



import "./TaskPage.css";
import { useERP } from "../context/ERPContext";


function TaskDetail() {
    const navigate = useNavigate();

    const { projects,
        customers,
        employees,
        quotations,
        products } = useERP();


    // 선택한 프로젝트 번호
    const [selectedProjectId, setSelectedProjectId] = useState("");

    // 선택한 프로젝트 찾기
    const selectedProject = projects.find(
        (project) => project.id === Number(selectedProjectId)
    );

    // 프로젝트와 연결된 정보 찾기
    const selectedCustomer = customers.find(
        (customer) => customer.id === selectedProject?.customerId
    );

    const selectedManager = employees.find(
        (employee) => employee.id === selectedProject?.managerId
    );

    const selectedQuotation = quotations.find(
        (quotation) => quotation.id === selectedProject?.quotationId
    );

    const selectedProduct = products.find(
        (product) => product.id === selectedQuotation?.productId
    );

    //작업 진행상태
    const [taskStatus, setTaskStatus] = useState("대기중");
    //등록된 작업 목록
    const [taskList, setTaskList] = useState([]);
    //담당자
    const [employeeId, setEmployeeId] = useState("");
    //작업마감일
    const [taskDeadline, setTaskDeadline] = useState("");

    const handleSubmit = () => {

        if(!selectedProjectId){
            alert("프로젝트를 선택하세요");
            return;
        }

        if (!employeeId){
            alert("담당자를 선택하세요");
            return;
        }

        if(!taskDeadline){
            alert("작업 마감일을 선택하세요.");
            return;
        }

        //선택한 담당자 찾기
        const selectedEmployee = employees.find(
            (employee) => employee.id === Number(employeeId)
        );

        //저장할 작업 데이터
        const newTask = {
            id: Date.now(),
            projectId: Number(selectedProjectId),
            taskStatus: taskStatus,
            employeeId: Number(employeeId),
            employeeName: selectedEmployee?.name || "-",
            taskDeadline: taskDeadline,
            progress: "대기중"
        };
    
        // 기존 목록에 새로운 작업 추가
            setTaskList((prev) => [...prev, newTask]);

            alert("작업이 저장되었습니다.");

            // 입력값 초기화
            setTaskStatus("대기중");
            setEmployeeId("");
            setTaskDeadline("");
    }
   

    return (
        <div className="task-detail-page">

            {/* 상단 제목 */}
            <div className="td-header">
                <div>
                    <p className="td-eyebrow">
                        PROJECT MANAGEMENT / DETAIL
                    </p>
                    <h2>프로젝트 상세 관리</h2>
                    <p>등록된 프로젝트를 선택하여 상세정보를 확인합니다.</p>
                </div>

                <button
                    className="td-back-btn"
                    onClick={() => navigate("/tasks")}
                >
                    ← 작업 목록으로
                </button>
            </div>

            {/* 프로젝트 선택 */}
            <div className="td-select-box">
                <label htmlFor="projectSelect">프로젝트 선택</label>

                <select
                    id="projectSelect"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                    <option value="">프로젝트를 선택하세요</option>

                    {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                            {project.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* 프로젝트 선택 전 */}
            {!selectedProject && (
                <div className="td-empty">
                    <h3>프로젝트를 선택해 주세요.</h3>
                    <p>선택한 프로젝트의 상세정보가 여기에 표시됩니다.</p>
                </div>
            )}

            {/* 프로젝트 선택 후 게시판 */}
            {selectedProject && (
                <div className="td-board">

                    <div className="td-board-header">
                        <div>
                            <span>PROJECT #{selectedProject.id}</span>
                            <h3>{selectedProject.name}</h3>
                        </div>

                        <span className={`td-status ${selectedProject.status === "진행 중"
                                ? "status-progress"
                                : "status-waiting"
                            }`}>
                            {selectedProject.status}
                        </span>
                    </div>

                    <div className="td-board-content">
                        <h4>프로젝트 기본 정보</h4>

                        <table className="td-table">
                            <tbody>
                                <tr>
                                    <th>프로젝트명</th>
                                    <td>{selectedProject.name}</td>
                                    <th>프로젝트 번호</th>
                                    <td>{selectedProject.id}</td>
                                </tr>

                                <tr>
                                    <th>고객사</th>
                                    <td>{selectedCustomer?.companyName || "-"}</td>
                                    <th>담당자</th>
                                    <td>{selectedManager?.name || "-"}</td>
                                </tr>

                                <tr>
                                    <th>제품명</th>
                                    <td>{selectedProduct?.productName || "-"}</td>
                                    <th>프로젝트 상태</th>
                                    <td>{selectedProject.status}</td>
                                </tr>

                                <tr>
                                    <th>시작일</th>
                                    <td>{selectedProject.startDate || "-"}</td>
                                    <th>완료 예정일</th>
                                    <td>{selectedProject.dueDate || "-"}</td>
                                </tr>

                                <tr>
                                    <th>완료일</th>
                                    <td>{selectedProject.completedDate || "-"}</td>
                                    <th>견적 번호</th>
                                    <td>{selectedProject.quotationId}</td>
                                </tr>

                                <tr>
                                    <th>프로젝트 설명</th>
                                    <td colSpan="3">
                                        {selectedProject.description || "-"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>


                    <div className="td-board-content">
                        <h4>프로젝트 상세 정보</h4>
                        <div className="project-detail">

                            {/* 작업 진행상태 */}
                            <div>
                                <p>작업 진행상태</p>
                                <select value={taskStatus}
                                        onChange={(e) => setTaskStatus(e.target.value)}>
                                    <option value="대기중">대기중</option>            
                                    <option value="제작 관리">제작 관리</option> 
                                    <option value="검수 관리">검수 관리</option>
                                    <option value="포장 관리">포장 관리</option>
                                    <option value="배송 관리">배송 관리</option>
                                </select>
                            </div>

                             {/* 담당자 */}
                             <div>
                                <p>담당자</p>
                                <select
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                >
                                    <option value="">담당자를 선택하세요</option>

                                    {employees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name}
                                        </option>
                                    ))}
                                </select>
                             </div>

                            {/* 작업 마감일 */}
                            <div>
                                <p>작업 마감일</p>
                                <input type="date" value={taskDeadline}
                                        onChange={(e) => setTaskDeadline(e.target.value)}/>
                            </div>
                         </div>
                         <button className="save-btn" onClick={handleSubmit}>저장</button>



{/* 작업 목록: 저장 후 표시 */}
{taskList.some(
    (task) => task.projectId === Number(selectedProjectId)
) && (
                      
<div className="td-task-list">

    <div className="td-task-list-header">
        <h4>등록된 작업 목록</h4>
        <span>
            총 {
                taskList.filter(
                    (task) => task.projectId === Number(selectedProjectId)
                ).length
                } 건
        </span>
    </div>

<table className="td-task-table">

    <thead>
        <tr>
            <th>번호</th>
            <th>작업 단계</th>
            <th>담당자</th>
            <th>작업 마감일</th>
            <th>진행 상태</th>
            <th>관리</th>
        </tr>
    </thead>

    <tbody>
        {taskList
            .filter(
                (task) => task.projectId === Number(selectedProjectId)
            )
            .map((task, index) => (

                <tr key={task.id}>
                    <td>{index + 1}</td>

                    <td>{task.taskStatus}</td>

                    <td>{task.employeeName}</td>

                    <td>{task.taskDeadline}</td>

                    <td>
                        <span className="td-task-status">
                            {task.progress}
                        </span>
                    </td>

                    <td>
                        <button
                            className="td-delete-btn"
                            onClick={() => {
                                setTaskList((prev) =>
                                    prev.filter(
                                        (item) => item.id !== task.id
                                    )
                                );
                            }}
                        >
                            삭제
                        </button>
                    </td>
                </tr>

            ))}

       

    </tbody>

</table>

</div>

)}
                        
                    </div>

                </div>
            )}

        </div>


    );
}

export default TaskDetail;