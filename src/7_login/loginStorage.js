// 파일 읽기·쓰기는 accountServer.cjs에서 처리합니다. 브라우저는 가입·로그인 결과만 받습니다.
async function requestAccount(action, fields) {
  let response;
  try {
    response = await fetch(`/api/login/${action}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields), cache: "no-store",
    });
  } catch { throw new Error("로그인 서버에 연결하지 못했습니다. 서버 실행 상태를 확인해 주세요."); }
  let result;
  try { result = await response.json(); }
  catch { throw new Error("로그인 서버 응답을 확인하지 못했습니다. 서버 연결을 확인해 주세요."); }
  if (!response.ok) throw new Error(result.message || "계정 처리에 실패했습니다.");
  if (typeof result.account?.name !== "string" || typeof result.account?.username !== "string") throw new Error("계정 응답 형식이 올바르지 않습니다.");
  return result.account;
}
export const registerLoginAccount = fields => requestAccount("register", fields);
export const authenticateLoginAccount = (username, password) => requestAccount("authenticate", { username, password });
