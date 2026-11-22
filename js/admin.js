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

                // === ДИАГОНАЛЬНАЯ СЕТКА ВОДЯНЫХ ЗНАКОВ ===
        const wmText = "Андрей Мурдасов | Сочи • @murdasov_st";
        const fontSize = Math.max(16, Math.round(w * 0.026));
        ctx.save();
        ctx.font = "bold " + fontSize + "px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Поворачиваем холст на -25 градусов для диагонального нанесения
        ctx.translate(w / 2, h / 2);
        ctx.rotate((-25 * Math.PI) / 180);

        const stepX = Math.round(ctx.measureText(wmText).width * 1.45);
        const stepY = Math.round(fontSize * 6.5);
        const diag = Math.ceil(Math.sqrt(w * w + h * h));

        for (let y = -diag; y <= diag; y += stepY) {
          // Смещаем четные ряды в шахматном порядке
          const shiftX = (Math.abs(Math.round(y / stepY)) % 2) * (stepX / 2);
          for (let x = -diag; x <= diag; x += stepX) {
            // Тёмная тень для читаемости на светлых стенах и чертежах
            ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
            ctx.fillText(wmText, x + shiftX + 2, y + 2);
            // Полупрозрачный белый текст поверх
            ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
            ctx.fillText(wmText, x + shiftX, y);
          }
        }
        ctx.restore();
        // ==========================================

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

let selectedFiles = []; // Элементы вида { file: File|null, preview: string, existingPath: string|null }
let editingIndex = null; // null = новый проект, число = индекс редактируемого проекта

const photoInput = document.getElementById("p-photos");
const queueEl = document.getElementById("photo-queue");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

function renderPhotoQueue() {
  if (!selectedFiles.length) {
    queueEl.innerHTML = "";
    return;
  }
  queueEl.innerHTML = selectedFiles.map(function(item, idx) {
    return `
      <div style="border: 2px solid #111; background: #f5f5f5; padding: 5px; text-align: center;">
        <div style="font-size: 11px; font-weight: 800; margin-bottom: 4px;">№${idx + 1} ${idx === 0 ? "(Главное)" : ""}</div>
        <img src="${item.preview}" style="width: 100%; height: 75px; object-fit: cover; border: 1px solid #333; margin-bottom: 5px;">
        <div style="display: flex; justify-content: space-between; gap: 2px;">
          <button type="button" onclick="moveQueuePhoto(${idx}, -1)" style="flex:1; border:1px solid #111; background:#fff; font-weight:800; cursor:pointer;" ${idx === 0 ? "disabled" : ""}>⬅️</button>
          <button type="button" onclick="removeQueuePhoto(${idx})" style="flex:1; border:1px solid #111; background:#ff8a80; font-weight:800; cursor:pointer;">✕</button>
          <button type="button" onclick="moveQueuePhoto(${idx}, 1)" style="flex:1; border:1px solid #111; background:#fff; font-weight:800; cursor:pointer;" ${idx === selectedFiles.length - 1 ? "disabled" : ""}>➡️</button>
        </div>
      </div>
    `;
  }).join("");
}

window.moveQueuePhoto = function(idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= selectedFiles.length) return;
  const temp = selectedFiles[idx];
  selectedFiles[idx] = selectedFiles[target];
  selectedFiles[target] = temp;
  renderPhotoQueue();
};

window.removeQueuePhoto = function(idx) {
  selectedFiles.splice(idx, 1);
  renderPhotoQueue();
};

photoInput.addEventListener("change", function() {
  const files = Array.from(photoInput.files);
  files.forEach(function(file) {
    selectedFiles.push({
      file: file,
      preview: URL.createObjectURL(file),
      existingPath: null
    });
  });
  photoInput.value = "";
  renderPhotoQueue();
});

// Активация режима редактирования существующего проекта
window.startEditProject = async function(idx) {
  try {
    const res = await fetch("projects.json?v=" + Date.now());
    const projects = await res.json();
    const p = projects[idx];
    if (!p) return;

    editingIndex = idx;
    document.getElementById("p-category").value = p.category || "obmer";
    document.getElementById("p-title").value = p.title || "";
    document.getElementById("p-location").value = p.location || "";
    document.getElementById("p-desc").value = p.description || "";
    document.getElementById("p-video").value = p.video || "";

    const rawImgs = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
    selectedFiles = rawImgs.map(function(path) {
      return { file: null, preview: path, existingPath: path };
    });
    renderPhotoQueue();

    submitBtn.textContent = "💾 Сохранить изменения";
    submitBtn.style.background = "#2e7d32"; // Зелёная кнопка
    cancelEditBtn.style.display = "block";

    window.scrollTo({ top: 0, behavior: "smooth" });
    showStatus("✏️ Режим редактирования: «" + p.title + "». Поменяйте порядок фото или текст и нажмите «Сохранить изменения».", "status-load");
  } catch (err) {
    showStatus("❌ Не удалось загрузить данные проекта для редактирования.", "status-err");
  }
};

window.cancelEdit = function() {
  editingIndex = null;
  document.getElementById("project-form").reset();
  selectedFiles = [];
  renderPhotoQueue();
  submitBtn.textContent = "🚀 Опубликовать проект на сайте";
  submitBtn.style.background = "#db5323";
  cancelEditBtn.style.display = "none";
  document.getElementById("status").style.display = "none";
};

document.getElementById("project-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  if (!selectedFiles.length) return showStatus("Должно быть хотя бы одно фото!", "status-err");

  submitBtn.disabled = true;

  try {
    const finalPaths = [];
    const timestamp = Date.now();

    for (let i = 0; i < selectedFiles.length; i++) {
      const item = selectedFiles[i];
      if (item.existingPath) {
        // Уже загруженное ранее фото просто сохраняем в новом порядке
        finalPaths.push(item.existingPath);
      } else {
        // Новое фото сжимаем и загружаем
        showStatus("⏳ Загружаю новое фото " + (i + 1) + " из " + selectedFiles.length + "...", "status-load");
        const base64Content = await compressImage(item.file);
        const fileName = "img/projects/" + timestamp + "_" + String(i + 1).padStart(2, "0") + ".jpg";
        await ghApi(fileName, "PUT", {
          message: "Add photo " + timestamp + "_" + (i + 1),
          content: base64Content
        });
        finalPaths.push(fileName);
      }
    }

    showStatus("⏳ Сохраняю базу проектов...", "status-load");
    let projects = [];
    let sha = null;
    try {
      const existing = await ghApi("projects.json", "GET");
      sha = existing.sha;
      projects = JSON.parse(decodeURIComponent(escape(atob(existing.content))));
    } catch (err) {
      projects = [];
    }

    const projectData = {
      category: document.getElementById("p-category").value,
      title: document.getElementById("p-title").value.trim(),
      location: document.getElementById("p-location").value.trim(),
      description: document.getElementById("p-desc").value.trim(),
      video: document.getElementById("p-video").value.trim(),
      images: finalPaths,
      hidden: editingIndex !== null ? Boolean(projects[editingIndex].hidden) : false,
      date: editingIndex !== null ? (projects[editingIndex].date || new Date().toLocaleDateString("ru-RU")) : new Date().toLocaleDateString("ru-RU")
    };

    if (editingIndex !== null) {
      projects[editingIndex] = projectData;
    } else {
      projects.unshift(projectData);
    }

    const updatedBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(projects, null, 2))));
    const putBody = { message: editingIndex !== null ? "Edit project" : "Add project", content: updatedBase64 };
    if (sha) putBody.sha = sha;

    await ghApi("projects.json", "PUT", putBody);

    const wasEdit = editingIndex !== null;
    cancelEdit();
    showStatus(wasEdit ? "✅ Изменения сохранены! Обновится на сайте через 30 сек." : "✅ Готово! Проект опубликован!", "status-ok");
    loadManageList();
                <button type="button" onclick="startEditProject(${idx})" style="background: #69cafa; color: #111; border: 2px solid #111; padding: 4px 10px; font-size: 13px; font-weight: 700; cursor: pointer;">
              ✏️ Изменить
            </button>

  } catch (err) {
    showStatus("❌ " + err.message, "status-err");
  } finally {
    submitBtn.disabled = false;
  }
});
