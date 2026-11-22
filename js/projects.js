document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("projects-container");
  if (!container) return;

  const category = document.body.dataset.page || container.dataset.category;
  const jsonPath = "projects.json";
  const assetPrefix = "";

  // Создаем лайтбокс со стрелками и счетчиком
  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  overlay.innerHTML = `
    <button type="button" id="lb-prev" style="position:fixed;left:15px;top:50%;transform:translateY(-50%);background:#fff;border:3px solid #111;box-shadow:3px 3px 0 #111;font-size:26px;font-weight:900;padding:6px 14px;cursor:pointer;z-index:2010;">‹</button>
    <img id="lb-img" src="" alt="Просмотр объекта" style="max-width:90%;max-height:85vh;border:3px solid #fff;cursor:default;">
    <button type="button" id="lb-next" style="position:fixed;right:15px;top:50%;transform:translateY(-50%);background:#fff;border:3px solid #111;box-shadow:3px 3px 0 #111;font-size:26px;font-weight:900;padding:6px 14px;cursor:pointer;z-index:2010;">›</button>
    <div id="lb-counter" style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:5px 14px;border:2px solid #fff;font-weight:700;font-size:14px;z-index:2010;"></div>
  `;
  document.body.appendChild(overlay);

  const overlayImg = document.getElementById("lb-img");
  const prevBtn = document.getElementById("lb-prev");
  const nextBtn = document.getElementById("lb-next");
  const counterEl = document.getElementById("lb-counter");

  let currentGallery = [];
  let currentIndex = 0;

  function showSlide(idx) {
    if (!currentGallery.length) return;
    currentIndex = (idx + currentGallery.length) % currentGallery.length;
    overlayImg.src = currentGallery[currentIndex];
    const isMulti = currentGallery.length > 1;
    prevBtn.style.display = isMulti ? "block" : "none";
    nextBtn.style.display = isMulti ? "block" : "none";
    counterEl.style.display = isMulti ? "block" : "none";
    counterEl.textContent = `${currentIndex + 1} / ${currentGallery.length}`;
  }

  function openLightbox(gallery, startIndex) {
    currentGallery = gallery;
    showSlide(startIndex);
    overlay.classList.add("active");
  }

  // Закрытие только по клику на тёмный фон (не по картинке и не по кнопкам)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("active");
  });

  prevBtn.addEventListener("click", (e) => { e.stopPropagation(); showSlide(currentIndex - 1); });
  nextBtn.addEventListener("click", (e) => { e.stopPropagation(); showSlide(currentIndex + 1); });

  // Листание стрелками на клавиатуре и закрытие по Esc
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("active")) return;
    if (e.key === "ArrowLeft") showSlide(currentIndex - 1);
    if (e.key === "ArrowRight") showSlide(currentIndex + 1);
    if (e.key === "Escape") overlay.classList.remove("active");
  });

  // Свайпы пальцем на телефоне
  let touchStartX = 0;
  overlay.addEventListener("touchstart", (e) => { touchStartX = e.changedTouches.screenX; }, { passive: true });
  overlay.addEventListener("touchend", (e) => {
    const diff = e.changedTouches.screenX - touchStartX;
    if (Math.abs(diff) > 40) showSlide(diff < 0 ? currentIndex + 1 : currentIndex - 1);
  }, { passive: true });

  try {
    const response = await fetch(jsonPath + "?v=" + Date.now());
    if (!response.ok) throw new Error("Файл проектов пока пуст");
    const allProjects = await response.json();
    const filtered = allProjects.filter(p => p.category === category && !p.hidden);

    if (filtered.length === 0) {
      container.innerHTML = '<p style="color:#666;">Примеры работ в этом разделе скоро появятся.</p>';
      return;
    }

    container.innerHTML = "";

    for (const item of filtered) {
      const rawImgs = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []);
      const imgs = rawImgs.map(src => src.startsWith("http") ? src : assetPrefix + src);
      const mainImg = imgs[0] || "";

      const card = document.createElement("div");
      card.className = "project-card";

      let thumbsHtml = "";
      if (imgs.length > 1) {
        thumbsHtml = `<div style="display:flex; gap:6px; padding:8px 16px 0 16px; flex-wrap:wrap;">` +
          imgs.map((src, idx) => `<img src="${src}" data-idx="${idx}" style="width:44px; height:34px; object-fit:cover; border:2px solid #333; cursor:pointer;" alt="Фото ${idx + 1}">`).join("") +
          `</div>`;
      }
      
      const videoBtnHtml = item.video
        ? `<a href="${item.video}" target="_blank" rel="noopener" class="retro-btn" style="background:#f7e83e;color:#111;margin-bottom:12px;text-align:center;width:100%;">▶️ Смотреть видеообзор</a>`
        : "";

      card.innerHTML = `
        <div class="project-thumb-wrap">
          <img class="main-card-img" src="${mainImg}" alt="${item.title}" loading="lazy">
        </div>
        ${thumbsHtml}
        <div class="project-body">
          <div>
            <div class="project-title">${item.title}</div>
            <div class="project-desc">${item.description || ""}</div>
          </div>
          <div>
            ${videoBtnHtml}
            <div class="project-meta">
              ${item.location ? `📍 ${item.location}` : ""} 
            
          </div>
        </div>
      `;

      const mainImgEl = card.querySelector(".main-card-img");
      let activeIdx = 0;

      mainImgEl.addEventListener("click", () => openLightbox(imgs, activeIdx));

      card.querySelectorAll("[data-idx]").forEach(thumb => {
        thumb.addEventListener("click", () => {
          activeIdx = Number(thumb.dataset.idx);
          mainImgEl.src = imgs[activeIdx];
        });
      });

      container.appendChild(card);
    }
  } catch (err) {
    container.innerHTML = '<p style="color:#666;">Загрузите первый проект через форму, и он появится здесь.</p>';
  }
});
