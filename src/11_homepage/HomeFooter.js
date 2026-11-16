import React from "react";
import "./HomeFooter.css";


function HomeFooter() {
    return (
        <footer className="goods-footer">
            <div className="goods-footer-inner">
                <div className="goods-footer-compact-brand">
                    <strong>GOODS</strong>
                    <span>CUSTOM GOODS STUDIO</span>
                </div>
                <div className="goods-footer-details">
                    <p>상호명 : MODU GOODS  <span className="goods-footer-sep">|</span> 대표자 : 홍길동 <span className="goods-footer-sep">|</span> 사업자등록번호 : 000-00-00000 </p>
                    <p>주소 : 서울특별시 강남구  <span className="goods-footer-sep">|</span> 고객센터 : 0000-0000  <span className="goods-footer-sep">|</span> 이메일 : kh@example.com </p>
                    <p>운영시간 : 평일 09:00~18:00  <span className="goods-footer-sep">|</span> 이용약관 · 개인정보처리방침 · 배송 및 교환 안내 </p>
                </div>
                <p className="goods-footer-copyright">© 2026 MODU GOODS. All rights reserved. <span>1조 팀 프로젝트 · 가상 기업 데모</span></p>
            </div>
        </footer>
    );
}

export default HomeFooter;
