import React from "react";
import "./Dashboard.css";

function DashboardPage() {
    return (
        <div className="dashboard">
            <h1>대시보드</h1>



            <div className="dashboard-banner">
                <strong>NOTICE</strong>
                <span>중요 공지사항 표시</span>
            </div>


            <div className="dashboard-grid">

                <div className="dashboard-left">

                <div className="dashboard-card">
                    <h3>공지사항</h3>
                    <p>사내 정기회의 안내</p>
                    <p>프로젝트 관리 안내</p>
                    <p>신규 시스템 이용 안내</p>
                </div>

                <div className="dashboard-card">
                    <h3>사내 커뮤니티</h3>
                    <p>최근 게시글이 표시</p>
                </div>
                
            </div>


            <div className="dashboard-right">

                <div className="dashboard-cardschedule-card">
                    <h3>오늘의 일정</h3>
                    <p>오늘의 업무일정 표시</p>
                </div>
            
            </div>


            </div>
        </div>
    )
}

export default DashboardPage