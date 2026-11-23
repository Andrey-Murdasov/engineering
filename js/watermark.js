// Модуль наложения водяных знаков: "center" (крупный по центру), "grid" (диагональная сетка), "none" (без знака)
function applyWatermark(ctx, w, h, mode) {
  if (!mode || mode === "none") return;

  const wmText = "Андрей Мурдасов | Сочи | @murdasov_st";

  if (mode === "center") {
    ctx.save();

    // Режим 1: Современный системный шрифт (San Francisco / Roboto / Segoe UI)
    const fontSize = Math.max(18, Math.round(w * 0.045)); // Величина букв (0.32-0.45)
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
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)"; // Прозрачность белого фона (0.55)
    ctx.fill();

    // Тонкая светлая обводка для эффекта "стекла"
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.stroke();

    // 2. Четкий почти черный текст по центру плашки
    ctx.fillStyle = "rgba(17, 17, 17, 0.75)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(wmText, w / 2, h / 2 + 1);

  
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

  if (mode === "stickers") {
    // Режим 3: Хаотичные полупрозрачные белые наклейки (4 шт.)
    const wmLines = "Андрей Мурдасов | Сочи\n@murdasov_st".split("\n");
    const fontSize = Math.max(14, Math.round(w * 0.024));
    const lineHeight = Math.round(fontSize * 1.35);
    const fontStr = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

    ctx.save();
    ctx.font = fontStr;
    const maxLineWidth = Math.max(...wmLines.map(line => ctx.measureText(line).width));
  

    const padX = Math.round(fontSize * 0.9);
    const padY = Math.round(fontSize * 0.5);
    const boxW = maxLineWidth + padX * 2;
    const boxH = wmLines.length * lineHeight + padY * 2 - (lineHeight - fontSize);
    const radius = Math.round(boxH * 0.28);

    function drawBadge(cx, cy, angleDeg) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((angleDeg * Math.PI) / 180);

      const boxX = -boxW / 2;
      const boxY = -boxH / 2;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(boxX, boxY, boxW, boxH, radius);
      } else {
        ctx.moveTo(boxX + radius, boxY);
        ctx.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + boxH, radius);
        ctx.arcTo(boxX + boxW, boxY + boxH, boxX, boxY + boxH, radius);
        ctx.arcTo(boxX, boxY + boxH, boxX, boxY, radius);
        ctx.arcTo(boxX, boxY, boxX + boxW, boxY, radius);
        ctx.closePath();
      }
      ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.stroke();

      ctx.font = fontStr;
      ctx.fillStyle = "rgba(17, 17, 17, 0.80)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const totalTextH = (wmLines.length - 1) * lineHeight;
      const startY = -totalTextH / 2 + 1;

      wmLines.forEach((line, index) => {
        ctx.fillText(line, 0, startY + index * lineHeight);
      });

    
    }

    const zones = [
      { x: 0.28, y: 0.25 },
      { x: 0.72, y: 0.30 },
      { x: 0.32, y: 0.72 },
      { x: 0.70, y: 0.76 }
    ];

    zones.forEach(zone => {
      const offsetX = (Math.random() - 0.5) * w * 0.1;
      const offsetY = (Math.random() - 0.5) * h * 0.1;
      const absAngle = 5 + Math.random() * 35;
      const sign = Math.random() < 0.5 ? -1 : 1;

      drawBadge(w * zone.x + offsetX, h * zone.y + offsetY, absAngle * sign);
    });
    return;
  }
}
