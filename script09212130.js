const canvas = document.getElementById('mandelbrotCanvas');
const ctx = canvas.getContext('2d');
const maxIterationsSlider = document.getElementById('maxIterations');
const maxIterationsValueSpan = document.getElementById('maxIterationsValue');
const colorPaletteSelect = document.getElementById('colorPalette');
const saveImageBtn = document.getElementById('saveImageBtn');
const resetBtn = document.getElementById('resetBtn');

const WIDTH = 800;
const HEIGHT = 600;
canvas.width = WIDTH;
canvas.height = HEIGHT;

let maxIterations = parseInt(maxIterationsSlider.value);

const initialMinX = -2.5;
const initialMaxX = 1.5;
const initialMinY = -1.5;
const initialMaxY = 1.5;

let minX = initialMinX;
let maxX = initialMaxX;
let minY = initialMinY;
let maxY = initialMaxY;

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let initialPinchDistance = null;

const palettes = {
    rainbow: createRainbowPalette(maxIterations),
    grayscale: createGrayscalePalette(maxIterations),
    fire: createFirePalette(maxIterations),
};

// 描画品質を制御するためのフラグ
let renderQuality = 'high'; // 初期値は高品質

// パレット生成関数群 (変更なし)
function createRainbowPalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const hue = i / numColors;
        palette.push(hsvToRgb(hue, 1, 1));
    }
    return palette;
}

function createGrayscalePalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const value = i / numColors;
        palette.push(`rgb(${Math.floor(value * 255)}, ${Math.floor(value * 255)}, ${Math.floor(value * 255)})`);
    }
    return palette;
}

function createFirePalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const t = i / numColors;
        let r, g, b;
        if (t < 0.25) {
            r = 0; g = t * 4; b = 0;
        } else if (t < 0.5) {
            r = (t - 0.25) * 4; g = 1; b = 0;
        } else if (t < 0.75) {
            r = 1; g = 1 - (t - 0.5) * 4; b = 0;
        } else {
            r = 1; g = 0; b = (t - 0.75) * 4;
        }
        r = Math.floor(r * 255);
        g = Math.floor(g * 255);
        b = Math.floor(b * 255);
        palette.push(`rgb(${r},${g},${b})`);
    }
    return palette;
}

function hsvToRgb(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return `rgb(${Math.floor(r * 255)},${Math.floor(g * 255)},${Math.floor(b * 255)})`;
}

// 描画ロジックの変更
function drawMandelbrot() {
    // 描画品質に応じてピクセルを間引く
    const step = renderQuality === 'low' ? 4 : 1; 
    
    // オフスクリーンキャンバスを使用
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = WIDTH;
    offscreenCanvas.height = HEIGHT;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    const imageData = offscreenCtx.createImageData(WIDTH, HEIGHT);
    const data = imageData.data;
    const currentPalette = palettes[colorPaletteSelect.value];
    
    for (let py = 0; py < HEIGHT; py += step) {
        for (let px = 0; px < WIDTH; px += step) {
            const cRe = minX + px / WIDTH * (maxX - minX);
            const cIm = minY + py / HEIGHT * (maxY - minY);
            let zRe = 0;
            let zIm = 0;
            let n = 0;

            while (zRe * zRe + zIm * zIm <= 4 && n < maxIterations) {
                const newZRe = zRe * zRe - zIm * zIm + cRe;
                zIm = 2 * zRe * zIm + cIm;
                zRe = newZRe;
                n++;
            }

            const colorIndex = n % currentPalette.length;
            const color = currentPalette[colorIndex];
            const rgb = color.match(/\d+/g);

            // 間引いたピクセルを中心にブロックを描画
            for (let y = 0; y < step; y++) {
                for (let x = 0; x < step; x++) {
                    const index = ((py + y) * WIDTH + (px + x)) * 4;
                    if (n === maxIterations) {
                        data[index] = 0;
                        data[index + 1] = 0;
                        data[index + 2] = 0;
                    } else {
                        data[index] = parseInt(rgb[0]);
                        data[index + 1] = parseInt(rgb[1]);
                        data[index + 2] = parseInt(rgb[2]);
                    }
                    data[index + 3] = 255;
                }
            }
        }
    }
    offscreenCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(offscreenCanvas, 0, 0);
}

// マウスイベント
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    renderQuality = 'low'; // ドラッグ中は低品質に
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        const width = maxX - minX;
        const height = maxY - minY;
        minX -= dx / WIDTH * width;
        maxX -= dx / WIDTH * width;
        minY -= dy / HEIGHT * height;
        maxY -= dy / HEIGHT * height;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        drawMandelbrot();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    renderQuality = 'high'; // ドラッグ終了後に高品質に
    drawMandelbrot();
});

canvas.addEventListener('mouseout', () => {
    if (isDragging) {
        isDragging = false;
        renderQuality = 'high';
        drawMandelbrot();
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    renderQuality = 'low'; // ズーム中は低品質に
    const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cRe = minX + (mouseX / WIDTH) * (maxX - minX);
    const cIm = minY + (mouseY / HEIGHT) * (maxY - minY);

    const newWidth = (maxX - minX) * zoomFactor;
    const newHeight = (maxY - minY) * zoomFactor;

    minX = cRe - (mouseX / WIDTH) * newWidth;
    maxX = cRe + (1 - mouseX / WIDTH) * newWidth;
    minY = cIm - (mouseY / HEIGHT) * newHeight;
    maxY = cIm + (1 - mouseY / HEIGHT) * newHeight;

    drawMandelbrot();
    
    // ズーム終了後に高品質で再描画
    setTimeout(() => {
        renderQuality = 'high';
        drawMandelbrot();
    }, 100);
});

// タッチイベント
canvas.addEventListener('touchstart', (e) => {
    renderQuality = 'low'; // タッチ操作中は低品質に
    if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialPinchDistance = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);
    } else if (e.touches.length === 1) {
        isDragging = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 2 && initialPinchDistance) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentPinchDistance = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);
        const zoomFactor = initialPinchDistance / currentPinchDistance;

        const rect = canvas.getBoundingClientRect();
        const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
        const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

        const cRe = minX + (centerX / WIDTH) * (maxX - minX);
        const cIm = minY + (centerY / HEIGHT) * (maxY - minY);

        const newWidth = (maxX - minX) * zoomFactor;
        const newHeight = (maxY - minY) * zoomFactor;

        minX = cRe - (centerX / WIDTH) * newWidth;
        maxX = cRe + (1 - centerX / WIDTH) * newWidth;
        minY = cIm - (centerY / HEIGHT) * newHeight;
        maxY = cIm + (1 - centerY / HEIGHT) * newHeight;

        initialPinchDistance = currentPinchDistance;
        drawMandelbrot();

    } else if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - lastMouseX;
        const dy = e.touches[0].clientY - lastMouseY;
        const width = maxX - minX;
        const height = maxY - minY;
        minX -= dx / WIDTH * width;
        maxX -= dx / WIDTH * width;
        minY -= dy / HEIGHT * height;
        maxY -= dy / HEIGHT * height;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
        drawMandelbrot();
    }
});

canvas.addEventListener('touchend', () => {
    isDragging = false;
    initialPinchDistance = null;
    renderQuality = 'high';
    drawMandelbrot();
});

// ボタンイベント
maxIterationsSlider.addEventListener('input', () => {
    maxIterations = parseInt(maxIterationsSlider.value);
    maxIterationsValueSpan.textContent = maxIterations;
    drawMandelbrot();
});

colorPaletteSelect.addEventListener('change', () => {
    drawMandelbrot();
});

resetBtn.addEventListener('click', () => {
    minX = initialMinX;
    maxX = initialMaxX;
    minY = initialMinY;
    maxY = initialMaxY;
    renderQuality = 'high';
    drawMandelbrot();
});

saveImageBtn.addEventListener('click', () => {
    // 保存時は常に高品質で描画
    const originalQuality = renderQuality;
    renderQuality = 'high';
    drawMandelbrot();
    
    // ダウンロード処理を少し遅延させて描画を待つ
    setTimeout(() => {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'mandelbrot_fractal.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        renderQuality = originalQuality; // 元の品質に戻す
        drawMandelbrot();
    }, 100);
});

// 初期描画
drawMandelbrot();