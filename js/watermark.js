// Модуль наложения водяных знаков: "center" (крупный по центру), "grid" (диагональная сетка), "none" (без знака)
function applyWatermark(ctx, w, h, mode) {
  if (!mode || mode === "none") return;

  const wmText = "Андрей Мурдасов | Сочи | @murdasov_st";

  if (mode === "center") {
    ctx.save();

    // Современный системный шрифт (San Francisco / Roboto / Segoe UI)
    const fontSize = Math.max(18, Math.round(w * 0.032));
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

    // Считаем размеры текста и отступы (padding) для плашки
    const metrics = ctx.measureText(wmText);
    const padX = Math.round(fontSize * 0.9);
    const padY = Math.round(fontSize * 0.55);
    const boxW = metrics.width + padX * 2;
    const boxH = fontSize + padY * 2;
    const boxX = (w - boxW) / 2;
    const boxY = (h - boxH) / 2;
    const radius = Math.round(boxH * 0.35); // Плавное скругление углов

    // 1. Полупрозрачный белый фон со скругленными краями
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxW, boxH, radius);
    } else {
      // Запасной вариант для старых браузеров
      ctx.moveTo(boxX + radius, boxY);
      ctx.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + boxH, radius);
      ctx.arcTo(boxX + boxW, boxY + boxH, boxX, boxY + boxH, radius);
      ctx.arcTo(boxX, boxY + boxH, boxX, boxY, radius);
      ctx.arcTo(boxX, boxY, boxX + boxW, boxY, radius);
      ctx.closePath();
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.72)"; // Прозрачность белого фона (0.72)
    ctx.fill();

    // Тонкая светлая обводка для эффекта "стекла"
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.stroke();

    // 2. Четкий почти черный текст по центру плашки
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(wmText, w / 2, h / 2 + 1);

    ctx.restore();
    return;
  }


  if (mode === "grid") {
    // Режим 2: Диагональная шахматная сетка по всему фото
    const fontSize = Math.max(16, Math.round(w * 0.026));
    ctx.save();
    ctx.font = "bold " + fontSize + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.translate(w / 2, h / 2);
    ctx.rotate((-25 * Math.PI) / 180);

    const stepX = Math.round(ctx.measureText(wmText).width * 1.45);
    const stepY = Math.round(fontSize * 6.5);
    const diag = Math.ceil(Math.sqrt(w * w + h * h));

    for (let y = -diag; y <= diag; y += stepY) {
      const shiftX = (Math.abs(Math.round(y / stepY)) % 2) * (stepX / 2);
      for (let x = -diag; x <= diag; x += stepX) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.fillText(wmText, x + shiftX + 2, y + 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.fillText(wmText, x + shiftX, y);
      }
    }
    ctx.restore();
  }
}
