
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    dateKey,
    expandSchedules,
    isValidScheduleDate,
    isValidScheduleTime
} from "../5_schedule/scheduleData";
import "./Today.css";


// 기존 일정관리에서 저장한 일정을 읽어옴
function getSchedules() {
    try {
        const saved = localStorage.getItem("made-mate-schedules");
        const data = JSON.parse(saved || "[]");

        if (!Array.isArray(data)) return [];

        return data.filter((item) =>
            item &&
            typeof item.title === "string" &&
            isValidScheduleDate(item.date) &&
            isValidScheduleTime(item.time)
        ).map((item) => ({
            ...item,
            excludedDates: Array.isArray(item.excludedDates)
                ? item.excludedDates : []
        }));
    } catch {
        return [];
    }
}


function DashboardToday() {

    // 현재 날짜를 기억
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {

        // 다시 화면으로 돌아오면 날짜와 일정을 갱신
        const refresh = () => setNow(new Date());

        // 다른 탭에서 일정이 수정되었는지 확인
        const onStorage = (e) => {
            if (e.key === "made-mate-schedules" || e.key === null) {
                refresh();
            }
        };

        const onVisible = () => {
            if (!document.hidden) refresh();
        };

        window.addEventListener("focus", refresh);
        window.addEventListener("storage", onStorage);
        document.addEventListener("visibilitychange", onVisible);

        // 1분마다 날짜와 일정 확인
        const timer = setInterval(refresh, 60000);

        return () => {
            window.removeEventListener("focus", refresh);
            window.removeEventListener("storage", onStorage);
            document.removeEventListener("visibilitychange", onVisible);
            clearInterval(timer);
        };

    }, []);


    // 일정 불러오기
    const schedules = getSchedules();

    // 현재 연도, 월, 오늘 날짜
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = dateKey(now);

    // 이번 달 첫날과 마지막 날
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    // 이번 달의 반복 일정까지 가져오기
    const monthSchedules = expandSchedules(
        schedules,
        dateKey(first),
        dateKey(last)
    );

    // 오늘 날짜에 해당하는 일정
    const todaySchedules = monthSchedules.filter(
        (item) => item.date === today
    );


    // 날짜별로 일정을 따로 모으기
    const scheduleByDate = {};

    for (const item of monthSchedules) {

        // 해당 날짜에 배열이 없다면 새로 생성
        if (!scheduleByDate[item.date]) {
            scheduleByDate[item.date] = [];
        }

        scheduleByDate[item.date].push(item);
    }


    // 달력 날짜 배열
    const days = [];

    // 1일 이전의 빈칸 만들기
    for (let i = 0; i < first.getDay(); i++) {
        days.push(null);
    }

    // 이번 달 날짜 추가
    for (let number = 1; number <= last.getDate(); number++) {
        days.push(number);
    }


    return (
        <div className="today-box">

            {/* 연도와 월 */}
            <div className="today-month">
                {year}년 {month + 1}월
            </div>


            {/* 요일 */}
            <div className="today-weekdays">
                {["일", "월", "화", "수", "목", "금", "토"].map((name) => (
                    <span key={name}>
                        {name}
                    </span>
                ))}
            </div>


            {/* 달력 날짜 */}
            <div className="today-days">

                {days.map((number, index) => {

                    // 날짜가 없는 빈칸
                    if (number === null) {
                        return (
                            <div
                                className="today-blank"
                                key={"blank-" + index}
                            />
                        );
                    }

                    // 현재 날짜
                    const currentDate = dateKey(
                        new Date(year, month, number)
                    );

                    // 현재 날짜에 등록된 일정
                    const daySchedules = scheduleByDate[currentDate] || [];

                    // 해당 날짜의 첫 번째 일정
                    const firstSchedule = daySchedules[0];

                    // 프로젝트명이 있으면 프로젝트명 사용
                    // 프로젝트명이 없으면 일정 제목 사용
                    let projectName = "";

                    if (firstSchedule) {
                        projectName = firstSchedule.project || firstSchedule.title;
                    }

                    return (
                        <div
                            key={currentDate}
                            className={
                                currentDate === today
                                    ? "today-day today-current"
                                    : "today-day"
                            }
                        >

                            {/* 날짜 숫자 */}
                            <span className="today-date">
                                {number}
                            </span>


                            {/* 일정이 있는 날짜에는 프로젝트명 출력 */}
                            {firstSchedule && (
                                <span
                                    className="today-project"
                                    title={projectName}
                                >
                                    {projectName}
                                </span>
                            )}


                            {/* 일정이 여러 개 있을 때 */}
                            {daySchedules.length > 1 && (
                                <span className="today-more">
                                    +{daySchedules.length - 1}건
                                </span>
                            )}

                        </div>
                    );
                })}

            </div>


            {/* 오늘의 일정 목록 */}
            <div className="today-title">
                오늘 등록된 일정 ({todaySchedules.length})
            </div>


            {todaySchedules.length === 0 ? (

                <p className="today-empty">
                    오늘 등록된 일정이 없습니다.
                </p>

            ) : (

                <div className="today-list">

                    {todaySchedules.map((item, index) => (
                        <Link
                            to="/schedule"
                            className="today-item"
                            key={String(item.id) + "-" + item.date + "-" + index}
                        >

                            {/* 일정 시간 */}
                            <span className="today-time">
                                {item.time}
                                {item.endTime ? " ~ " + item.endTime : ""}
                            </span>


                            {/* 프로젝트명 */}
                            {item.project && (
                                <span className="today-name">
                                    {item.project}
                                </span>
                            )}


                            {/* 일정 제목 */}
                            <span className="today-detail">
                                {item.title}
                            </span>


                            {/* 완료한 일정 */}
                            {item.status === "completed" && (
                                <span className="today-done">
                                    완료
                                </span>
                            )}

                        </Link>
                    ))}

                </div>
            )}

        </div>
    );
}

export default DashboardToday;
