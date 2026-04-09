/**
 * kill-port.mjs — npm run predev에서 자동 실행
 * 지정 포트를 점유한 프로세스를 종료한 뒤 포트가 해제될 때까지 대기합니다.
 * Windows / macOS / Linux 모두 지원.
 */
import { execSync, spawnSync } from "child_process";
import { createServer } from "net";

const port = parseInt(process.argv[2] || "3001", 10);

function isPortFree(p) {
  return new Promise((resolve) => {
    const s = createServer();
    s.once("error", () => resolve(false));
    s.once("listening", () => { s.close(); resolve(true); });
    s.listen(p);
  });
}

async function killPort(p) {
  if (await isPortFree(p)) {
    console.log(`[predev] 포트 ${p} 사용 가능 ✓`);
    return;
  }

  console.log(`[predev] 포트 ${p} 점유 감지 → 프로세스 종료 시도...`);

  try {
    if (process.platform === "win32") {
      // Windows: PowerShell로 PID 찾아 종료
      spawnSync("powershell", [
        "-NoProfile", "-Command",
        `$pids = (Get-NetTCPConnection -LocalPort ${p} -ErrorAction SilentlyContinue).OwningProcess | Sort-Object -Unique;
         if ($pids) { $pids | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }`
      ], { stdio: "inherit" });
    } else {
      // macOS / Linux: lsof
      execSync(`lsof -ti :${p} | xargs kill -9 2>/dev/null || true`);
    }
  } catch {
    // 종료 실패해도 계속 진행 (server.js가 EADDRINUSE 처리)
  }

  // 포트 해제 대기 (최대 3초)
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isPortFree(p)) {
      console.log(`[predev] 포트 ${p} 해제 완료 ✓`);
      return;
    }
  }

  console.warn(`[predev] 포트 ${p} 해제 미확인 — server.js가 자동 대체 포트 사용`);
}

killPort(port);
