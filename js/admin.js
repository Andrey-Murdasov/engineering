const TOKEN_KEY = "gh_portfolio_token";
const API_BASE = "https:__api.github.com_repos_Andrey-Murdasov_engineering_contents_".replace(/_/g, "/");
const REPO_URL = "https:__api.github.com_repos_Andrey-Murdasov_engineering".replace(/_/g, "/");


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
    const res = await fetch(REPO_URL, {
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
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        // === АВТОМАТИЧЕСКИЙ ВОДЯНОЙ ЗНАК ===
        const wmText = "Андрей Мурдасов|Сочи • @murdasov_st";
        const fontSize = Math.max(14, Math.round(w * 0.022));
        ctx.font = "bold " + fontSize + "px sans-serif";

        const padX = Math.round(fontSize * 0.8);
        const padY = Math.round(fontSize * 0.5);
        const textWidth = ctx.measureText(wmText).width;
        const boxW = textWidth + padX * 2;
        const boxH = fontSize + padY * 2;
        const margin = Math.round(w * 0.02);

        const boxX = w - boxW - margin;
        const boxY = h - boxH - margin;

        // Полупрозрачная тёмная подложка для читаемости на любом фоне
        ctx.fillStyle = "rgba(17, 17, 17, 0.55)";
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // Белый текст поверх подложки
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.textBaseline = "middle";
        ctx.fillText(wmText, boxX + padX, boxY + boxH / 2);
        // ====================================

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

document.getElementById("project-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  const files = document.getElementById("p-photos").files;
  if (!files.length) return showStatus("Выберите хотя бы одно фото!", "status-err");

  const btn = document.getElementById("submit-btn");
  btn.disabled = true;

  try {
    const uploadedPaths = [];
    const timestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      showStatus("⏳ Загружаю фото " + (i + 1) + " из " + files.length + "...", "status-load");
      const base64Content = await compressImage(files[i]);
      const fileName = "img/projects/" + timestamp + "_" + (i + 1) + ".jpg";
      await ghApi(fileName, "PUT", {
        message: "Add photo " + timestamp + "_" + (i + 1),
        content: base64Content
      });
      uploadedPaths.push(fileName);
    }

    showStatus("⏳ Обновляю ленту проектов...", "status-load");
    let projects = [];
    let sha = null;
    try {
      const existing = await ghApi("projects.json", "GET");
      sha = existing.sha;
      projects = JSON.parse(decodeURIComponent(escape(atob(existing.content))));
    } catch (err) {
      projects = [];
    }

    projects.unshift({
      category: document.getElementById("p-category").value,
      title: document.getElementById("p-title").value.trim(),
      location: document.getElementById("p-location").value.trim(),
      description: document.getElementById("p-desc").value.trim(),
      images: uploadedPaths,
      hidden: false,
      date: new Date().toLocaleDateString("ru-RU")
    });

    const updatedBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(projects, null, 2))));
    const putBody = { message: "Add project", content: updatedBase64 };
    if (sha) putBody.sha = sha;

    await ghApi("projects.json", "PUT", putBody);

    showStatus("✅ Готово! Проект опубликован (появится на сайте через 30 сек).", "status-ok");
    document.getElementById("project-form").reset();
    loadManageList();
  } catch (err) {
    showStatus("❌ " + err.message, "status-err");
  } finally {
    btn.disabled = false;
  }
});

async function loadManageList() {
  const listEl = document.getElementById("manage-list");
  try {
    const res = await fetch("projects.json?v=" + Date.now());
    const projects = await res.json();
    if (!projects.length) {
      listEl.innerHTML = "<small style='color:#666;'>Пока нет ни одного проекта.</small>";
      return;
    }
    listEl.innerHTML = projects.map(function(p, idx) {
      const bg = p.hidden ? "#e0e0e0" : "#f9f9f9";
      const op = p.hidden ? "0.8" : "1";
      const mark = p.hidden ? "🙈 [СКРЫТ] " : "";
      const hideBtnBg = p.hidden ? "#47ed84" : "#f7e83e";
      const hideBtnText = p.hidden ? "👁️ Показать" : "🙈 Скрыть";
      return `
        <div style="border: 2px solid #333; padding: 10px; background: ${bg}; opacity: ${op};">
          <div style="font-weight: 800; font-size: 14px; margin-bottom: 6px;">${mark}${p.title}</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            <select onchange="moveProject(${idx}, this.value)" style="padding: 4px; border: 2px solid #333; font-size: 13px; font-weight: 700;">
              <option value="obmer" ${p.category === "obmer" ? "selected" : ""}>📐 Обмеры</option>
              <option value="electrika" ${p.category === "electrika" ? "selected" : ""}>⚡ Электрика</option>
              <option value="avtonomka" ${p.category === "avtonomka" ? "selected" : ""}>🔋 Автономка</option>
              <option value="remont" ${p.category === "remont" ? "selected" : ""}>🦺 Ремонт</option>
            </select>
            <button type="button" onclick="toggleHideProject(${idx})" style="background: ${hideBtnBg}; color: #111; border: 2px solid #111; padding: 4px 10px; font-size: 13px; font-weight: 700; cursor: pointer;">
              ${hideBtnText}
            </button>
            <button type="button" onclick="deleteProject(${idx})" style="background: #ff5252; color: #fff; border: 2px solid #111; padding: 4px 10px; font-size: 13px; font-weight: 700; cursor: pointer;">
              🗑️ Удалить
            </button>
          </div>
        </div>
      `;
    }).join("");
  } catch (e) {
    listEl.innerHTML = "<small style='color:#666;'>Список проектов пуст или загружается.</small>";
  }
}

async function moveProject(index, newCategory) {
  showStatus("⏳ Переношу проект...", "status-load");
  try {
    const existing = await ghApi("projects.json", "GET");
    const projects = JSON.parse(decodeURIComponent(escape(atob(existing.content))));
    projects[index].category = newCategory;
    const updatedBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(projects, null, 2))));
    await ghApi("projects.json", "PUT", { message: "Move project", content: updatedBase64, sha: existing.sha });
    showStatus("✅ Проект перенесён!", "status-ok");
    loadManageList();
  } catch (err) {
    showStatus("❌ " + err.message, "status-err");
  }
}

async function toggleHideProject(index) {
  showStatus("⏳ Меняю видимость...", "status-load");
  try {
    const existing = await ghApi("projects.json", "GET");
    const projects = JSON.parse(decodeURIComponent(escape(atob(existing.content))));
    projects[index].hidden = !projects[index].hidden;
    const updatedBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(projects, null, 2))));
    await ghApi("projects.json", "PUT", { message: "Toggle visibility", content: updatedBase64, sha: existing.sha });
    showStatus(projects[index].hidden ? "🙈 Проект скрыт с сайта!" : "👁️ Проект снова виден!", "status-ok");
    loadManageList();
  } catch (err) {
    showStatus("❌ " + err.message, "status-err");
  }
}

async function deleteProject(index) {
  if (!confirm("Точно удалить этот проект?")) return;
  showStatus("⏳ Удаляю проект...", "status-load");
  try {
    const existing = await ghApi("projects.json", "GET");
    const projects = JSON.parse(decodeURIComponent(escape(atob(existing.content))));
    projects.splice(index, 1);
    const updatedBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(projects, null, 2))));
    await ghApi("projects.json", "PUT", { message: "Delete project", content: updatedBase64, sha: existing.sha });
    showStatus("✅ Проект удалён!", "status-ok");
    loadManageList();
  } catch (err) {
    showStatus("❌ " + err.message, "status-err");
  }
}

verifyAndOpenGate(localStorage.getItem(TOKEN_KEY), false);
loadManageList();
