// Модуль наложения водяных знаков: "center" (крупный по центру), "grid" (диагональная сетка), "none" (без знака)
function applyWatermark(ctx, w, h, mode) {
  if (!mode || mode === "none") return;

  const wmText = "Андрей Мурдасов | Сочи • +7 (965) 475-11-77";

  if (mode === "center") {
    // Режим 1: Крупная полупрозрачная подпись строго по центру фото
    const fontSize = Math.max(22, Math.round(w * 0.04));
    ctx.save();
    ctx.font = "bold " + fontSize + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Лёгкая тень для читаемости на белом фоне
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillText(wmText, w / 2 + 2, h / 2 + 2);

    // Полупрозрачный белый текст в середине
    ctx.fillStyle = "rgba(255, 255, 255, 0.30)";
    ctx.fillText(wmText, w / 2, h / 2);
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
