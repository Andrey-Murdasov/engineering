document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("projects-container");
  if (!container) return;

const category = document.body.dataset.page;
const jsonPath = "projects.json";
const assetPrefix = "";

  // Создаем лайтбокс для просмотра фото на весь экран
  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  overlay.innerHTML = '<img src="" alt="Просмотр объекта">';
  document.body.appendChild(overlay);
  const overlayImg = overlay.querySelector("img");
  overlay.addEventListener("click", () => overlay.classList.remove("active"));

  function openLightbox(src) {
    overlayImg.src = src;
    overlay.classList.add("active");
  }

  try {
    const response = await fetch(jsonPath + "?v=" + Date.now());
    if (!response.ok) throw new Error("Файл проектов пока пуст");
    const allProjects = await response.json();
    const filtered = allProjects.filter(p => p.category === category);

    if (filtered.length === 0) {
      container.innerHTML = '<p style="color:#666;">Примеры работ в этом разделе скоро появятся.</p>';
      return;
    }

    container.innerHTML = "";

    for (const item of filtered) {
      // Поддержка как массива images (из новой формы), так и одиночного image
      const rawImgs = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []);
      const imgs = rawImgs.map(src => src.startsWith("http") ? src : assetPrefix + src);
      const mainImg = imgs[0] || "";

      const card = document.createElement("div");
      card.className = "project-card";

      // Если фото больше одного — рисуем миниатюры переключения
      let thumbsHtml = "";
      if (imgs.length > 1) {
        thumbsHtml = `<div style="display:flex; gap:6px; padding:8px 16px 0 16px; flex-wrap:wrap;">` +
          imgs.map((src, idx) => `<img src="${src}" data-idx="${idx}" style="width:44px; height:34px; object-fit:cover; border:2px solid #333; cursor:pointer;" alt="Фото ${idx + 1}">`).join("") +
          `</div>`;
      }

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
          <div class="project-meta">
            ${item.location ? `📍 ${item.location}` : ""} 
            ${item.date ? ` • 📅 ${item.date}` : ""}
          </div>
        </div>
      `;

      const mainImgEl = card.querySelector(".main-card-img");
      mainImgEl.addEventListener("click", () => openLightbox(mainImgEl.src));

      // Переключение фото по клику на миниатюры
      card.querySelectorAll("[data-idx]").forEach(thumb => {
        thumb.addEventListener("click", () => {
          mainImgEl.src = thumb.src;
        });
      });

      container.appendChild(card);
    }
  } catch (err) {
    container.innerHTML = '<p style="color:#666;">Загрузите первый проект через форму, и он появится здесь.</p>';
  }
});
