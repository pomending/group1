import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./NotFoundPage.css";

function NotFoundPage() {

    const navi = useNavigate();

    return (
        <section className="nf-page">
            <div className="nf-card">

                <div className="nf-error-code">
                    404
                </div>

                <h1 className="nf-title">
                    페이지를 찾을 수 없습니다
                </h1>

                <p className="nf-description">
                    요청하신 페이지가 존재하지 않거나
                    주소가 변경되었을 수 있습니다.
                    <span>주소를 다시 확인해주세요.</span>
                </p>

                <div className="nf-actions">
                    <button
                        type="button"
                        className="nf-back-btn"
                        onClick={() => navi(-1)}
                    >
                        ← 이전 페이지
                    </button>

                    <Link to="/" className="nf-home-btn">
                        대시보드로
                    </Link>
                </div>

            </div>
        </section>
    );
}

export default NotFoundPage;