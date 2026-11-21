const TOKEN_KEY = "gh_portfolio_token";
const API_BASE = "https://github.com";

const gateBox = document.getElementById("gate-box");
const closedView = document.getElementById("gate-closed-view");
const openView = document.getElementById("gate-open-view");
const tokenInput = document.getElementById("gh-token");

function showStatus(text, type) {
  const el = document.getElementById("status");
  el.textContent = text;
  el.className = "status-msg " + type;
}

function setGateState(isOpen) {
  gateBox.className = isOpen ? "gate-box gate-open" : "gate-box gate-closed";
  closedView.style.display = isOpen ? "none" : "block";
  openView.style.display = isOpen ? "flex" : "none";
}

function getToken() {
  return (localStorage.getItem(TOKEN_KEY) || tokenInput.value || "").trim();
}

async function verifyAndOpenGate(tokenToCheck, isManual) {
  if (!tokenToCheck) {
    setGateState(false);
    return;
  }
  if (isManual) showStatus("⏳ Проверяю токен...", "status-load");
  try {
    const res = await fetch("https://github.com", {
      headers: { "Authorization": "Bearer " + tokenToCheck, "Accept": "application/vnd.github+json" }
    });
    if (!res.ok) throw new Error("Токен не подошёл (код " + res.status + ")");
    localStorage.setItem(TOKEN_KEY, tokenToCheck);
    setGateState(true);
    if (isManual) showStatus("🟢 Калитка открыта! Вы в системе.", "status-ok");
  } catch (err) {
    localStorage.removeItem(TOKEN_KEY);
    setGateState(false);
    if (isManual) showStatus("❌ " + err.message, "status-err");
  }
}

document.getElementById("login-btn").addEventListener("click", function() {
  verifyAndOpenGate(tokenInput.value.trim(), true);
});

document.getElementById("logout-btn").addEventListener("click", function() {
  localStorage.removeItem(TOKEN_KEY);
  tokenInput.value = "";
  setGateState(false);
  showStatus("🔒 Вы вышли из системы.", "status-load");
});

function compressImage(file) {
  return new Promise(function(resolve) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > 1200) {
          h = Math.round((h * 1200) / w);
          w = 1200;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
        resolve(dataUrl.split(",")[1]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function ghApi(path, method, body) {
  const token = getToken();
  if (!token) throw new Error("Сначала откройте калитку (введите токен)!");
  const opts = {
    method: method || "GET",
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    setGateState(false);
    throw new Error("Токен недействителен (401). Введите его заново.");
  }
  if (!res.ok) throw new Error("Ошибка GitHub (" + res.status + ")");
  return res.json();
}
