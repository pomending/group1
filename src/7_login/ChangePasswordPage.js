import { useNavigate } from "react-router-dom";
import { useERP } from "../context/ERPContext"
import { useState } from "react";

function ChangePasswordPage() {

    const { currentUser, changePassword } = useERP();
    const navi = useNavigate();
    const [prevPwd, setPrevPwd] = useState('')
    const [nextPwd1, setNextPwd1] = useState('')
    const [nextPwd2, setNextPwd2] = useState('')

    const handleChangePassword = (e) => {

        e.preventDefault();

        const success = changePassword(currentUser.id,prevPwd, nextPwd1, nextPwd2)

        if(success){
            alert('비밀번호 변경에 성공했습니다')
            navi('/', { replace: true })
        }else{
            alert('비밀번호 변경에 실패했습니다')
        }

    }

    return (
        <div>
            <form onSubmit={handleChangePassword}>
                <h2>비밀번호 변경</h2>
                <div>
                    <p>현재 비밀번호를 입력하세요</p>
                    <input type="password" placeholder="현재 비밀번호" value={prevPwd} 
                    onChange={(e)=>{setPrevPwd(e.target.value)}} required />
                </div>
                <div>
                    <p>변경할 비밀번호를 입력하세요</p>
                    <input type="password" value={nextPwd1} 
                    onChange={(e)=>{setNextPwd1(e.target.value)}} required />
                </div>
                <div>
                    <p>비밀번호 확인</p>
                    <input type="password" value={nextPwd2} 
                    onChange={(e)=>{setNextPwd2(e.target.value)}} required />
                </div>
                <button type='submit'>비밀번호 변경</button>
            </form>
        </div>
    )
}

export default ChangePasswordPage