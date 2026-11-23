// Модуль водяных знаков: "grid" (сетка), "center" (центр), "badges" (плашки как на Авито), "none" (без знака)
function applyWatermark(ctx, w, h, mode) {
  if (!mode || mode === "none") return;

  const wmText = "Андрей Мурдасов | Сочи • @murdasov_st";

  if (mode === "badges") {
    // Режим 3: Хаотичные полупрозрачные белые плашки (как на Авито)
    const fontSize = Math.max(14, Math.round(w * 0.022));
    ctx.save();
    ctx.font = "bold " + fontSize + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const padX = Math.round(fontSize * 0.9);
    const padY = Math.round(fontSize * 0.55);
    const boxW = ctx.measureText(wmText).width + padX * 2;
    const boxH = fontSize + padY * 2;

    // 4 базовые зоны с небольшим случайным сдвигом и углом наклона
    const zones = [
      { x: w * 0.28, y: h * 0.22 },
      { x: w * 0.72, y: h * 0.34 },
      { x: w * 0.32, y: h * 0.68 },
      { x: w * 0.70, y: h * 0.80 }
    ];

    zones.forEach(function(z) {
      const jitterX = (Math.random() - 0.5) * (w * 0.08);
      const jitterY = (Math.random() - 0.5) * (h * 0.06);
      const angle = ((Math.random() - 0.5) * 16 * Math.PI) / 180; // наклон от -8° до +8°

      ctx.save();
      ctx.translate(z.x + jitterX, z.y + jitterY);
      ctx.rotate(angle);

      // Полупрозрачная белая плашка
      ctx.fillStyle = "rgba(255, 255, 255, 0.52)";
      ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);

      // Тёмный контрастный текст поверх плашки
      ctx.fillStyle = "rgba(17, 17, 17, 0.72)";
      ctx.fillText(wmText, 0, 0);
      ctx.restore();
    });

    ctx.restore();
    return;
  }

  if (mode === "center") {
    // Режим 2: Крупная полупрозрачная подпись строго по центру
    const fontSize = Math.max(22, Math.round(w * 0.04));
    ctx.save();
    ctx.font = "bold " + fontSize + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillText(wmText, w / 2 + 2, h / 2 + 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.30)";
    ctx.fillText(wmText, w / 2, h / 2);
    ctx.restore();
    return;
  }

  if (mode === "grid") {
    // Режим 1: Диагональная шахматная сетка по всему фото
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
