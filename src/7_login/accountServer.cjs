// 계정 파일은 브라우저에 공개하지 않고 가입·검증 결과만 응답합니다.
const fs = require("fs/promises");
const path = require("path");
const { randomBytes, pbkdf2, timingSafeEqual } = require("crypto");
const { promisify } = require("util");
const express = require("express");
const deriveKey = promisify(pbkdf2);
const fail = (message, status = 400) => Object.assign(new Error(message), { status });

// 기본 저장 위치는 같은 폴더의 accounts.json이며, 서버 구성에 따라 경로를 지정할 수 있습니다.
function createAccountStore(filePath = path.join(__dirname, "accounts.json")) {
  let queue = Promise.resolve();
  async function read() {
    try {
      const data = JSON.parse(await fs.readFile(filePath, "utf8"));
      if (data?.version !== 1 || !Array.isArray(data.accounts) || data.accounts.some(account =>
        !account || typeof account.name !== "string" || typeof account.username !== "string"
        || !/^[a-f0-9]{32}$/.test(account.salt) || !/^[a-f0-9]{64}$/.test(account.passwordHash)
      )) throw new Error("Invalid data");
      return data.accounts;
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw fail("계정 파일을 읽지 못했습니다. 원본 파일을 확인해 주세요.", 500);
    }
  }
  async function save(accounts) {
    const temporary = path.join(path.dirname(filePath), `.accounts-${process.pid}.tmp`);
    try {
      await fs.writeFile(temporary, JSON.stringify({ version: 1, accounts }, null, 2) + "\n", { mode: 0o600 });
      await fs.rename(temporary, filePath);
    } catch (error) { throw Object.assign(fail("회원가입 정보를 파일에 저장하지 못했습니다.", 500), { cause: error }); }
    finally { await fs.unlink(temporary).catch(() => {}); }
  }
  function register(input = {}) {
    // 동시 가입을 순서대로 처리해 같은 ID 등록과 기존 계정 유실을 막습니다.
    const job = queue.then(async () => {
      const name = typeof input.name === "string" ? input.name.trim() : "";
      const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
      const password = input.password;
      if (!name || name.length > 30) throw fail("이름은 1~30자로 입력해 주세요.");
      if (!/^[a-z0-9_]{4,20}$/.test(username)) throw fail("아이디는 영문·숫자·밑줄로 4~20자 입력해 주세요.");
      if (typeof password !== "string" || password.length < 8 || password.length > 128 || !password.trim()) throw fail("비밀번호는 8~128자로 입력해 주세요.");
      const accounts = await read();
      if (accounts.some(account => account.username === username)) throw fail("이미 사용 중인 아이디입니다.", 409);
      const salt = randomBytes(16).toString("hex");
      const passwordHash = (await deriveKey(password, Buffer.from(salt, "hex"), 600000, 32, "sha256")).toString("hex");
      await save([...accounts, { name, username, salt, passwordHash }]);
      return { name, username };
    });
    queue = job.catch(() => {});
    return job;
  }
  async function authenticate(input = {}) {
    const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
    const password = input.password;
    if (typeof password !== "string" || password.length > 128) throw fail("아이디 또는 비밀번호를 확인해 주세요.", 401);
    const account = (await read()).find(item => item.username === username);
    if (!account) throw fail("아이디 또는 비밀번호를 확인해 주세요.", 401);
    const hash = await deriveKey(password, Buffer.from(account.salt, "hex"), 600000, 32, "sha256");
    if (!timingSafeEqual(hash, Buffer.from(account.passwordHash, "hex"))) throw fail("아이디 또는 비밀번호를 확인해 주세요.", 401);
    return { name: account.name, username: account.username };
  }
  return { register, authenticate };
}

function installAccountRoutes(app, store = createAccountStore()) {
  app.use("/api/login", express.json({ limit: "4kb" }));
  for (const [route, handler] of [["register", store.register], ["authenticate", store.authenticate]]) {
    app.post(`/api/login/${route}`, async (request, response) => {
      response.set("Cache-Control", "no-store");
      try {
        const account = await handler(request.body || {});
        response.status(route === "register" ? 201 : 200).json({ account });
      } catch (error) {
        response.status(error.status || 500).json({ message: error.status ? error.message : "계정 처리 중 오류가 발생했습니다." });
      }
    });
  }
}
module.exports = { createAccountStore, installAccountRoutes };
