const canvas = document.getElementById('mandelbrotCanvas');
const ctx = canvas.getContext('2d');
const maxIterationsSlider = document.getElementById('maxIterations');
const maxIterationsValueSpan = document.getElementById('maxIterationsValue');
const colorPaletteSelect = document.getElementById('colorPalette');
const generateRandomPaletteBtn = document.getElementById('generateRandomPaletteBtn');
const paletteStepsSlider = document.getElementById('paletteSteps');
const paletteStepsValueSpan = document.getElementById('paletteStepsValue');
const powerSelect = document.getElementById('powerSelect');
const saveImageBtn = document = document.getElementById('saveImageBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

const WIDTH = 800;
const HEIGHT = 600;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const DEFAULT_MAX_ITERATIONS = 300;
const DEFAULT_PALETTE_STEPS = 300;
const DEFAULT_POWER = 2.0;

let maxIterations = DEFAULT_MAX_ITERATIONS;
let paletteSteps = DEFAULT_PALETTE_STEPS;
let power = DEFAULT_POWER;

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
let lastTouchCenter = null;

const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = WIDTH;
offscreenCanvas.height = HEIGHT;
const offscreenCtx = offscreenCanvas.getContext('2d');

let palettes = {};

const MAX_ZOOM = 5e12; 

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

function createSeaPalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const t = 1 - (i / numColors);
        const b = 0.5 + 0.5 * t;
        const g = 0.2 + 0.8 * t;
        const r = 0.0;
        palette.push(`rgb(${Math.floor(r * 255)},${Math.floor(g * 255)},${Math.floor(b * 255)})`);
    }
    return palette;
}

function createForestPalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const t = 1 - (i / numColors);
        const g = 0.2 + 0.8 * t;
        const r = 0.1 + 0.1 * t;
        const b = 0.1;
        palette.push(`rgb(${Math.floor(r * 255)},${Math.floor(g * 255)},${Math.floor(b * 255)})`);
    }
    return palette;
}

function createSunsetPalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const t = i / numColors;
        let r, g, b;
        if (t < 0.5) {
            r = 0.5 + t; g = 0.1; b = 0.5 - t;
        } else {
            r = 1.0; g = 0.5 - (t - 0.5); b = 0.0;
        }
        r = Math.min(1.0, Math.max(0.0, r));
        g = Math.min(1.0, Math.max(0.0, g));
        b = Math.min(1.0, Math.max(0.0, b));
        palette.push(`rgb(${Math.floor(r * 255)},${Math.floor(g * 255)},${Math.floor(b * 255)})`);
    }
    return palette;
}

function createDesertPalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const t = i / numColors;
        let r = 0.5 + 0.5 * t;
        let g = 0.2 + 0.7 * t;
        let b = 0.1;
        r = Math.min(1.0, Math.max(0.0, r));
        g = Math.min(1.0, Math.max(0.0, g));
        b = Math.min(1.0, Math.max(0.0, b));
        palette.push(`rgb(${Math.floor(r * 255)},${Math.floor(g * 255)},${Math.floor(b * 255)})`);
    }
    return palette;
}

function createAuroraPalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const t = i / numColors;
        let h = 0.5 - 0.5 * t;
        let s = 1.0;
        let v = 0.5 + 0.5 * t;
        palette.push(hsvToRgb(h, s, v));
    }
    return palette;
}

function createSpacePalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const t = i / numColors;
        let r = 0.2 * (1 - t);
        let g = 0.1 * t + 0.2 * (1-t);
        let b = 0.5 * t + 0.3 * (1-t);
        palette.push(`rgb(${Math.floor(r * 255)},${Math.floor(g * 255)},${Math.floor(b * 255)})`);
    }
    return palette;
}

function createCandyPalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const hue = i / numColors;
        palette.push(hsvToRgb(hue, 0.8, 1));
    }
    return palette;
}

function createSepiaPalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const t = i / numColors;
        const r = 0.6 + 0.4 * t;
        const g = 0.4 + 0.4 * t;
        const b = 0.2 + 0.4 * t;
        palette.push(`rgb(${Math.floor(r * 255)},${Math.floor(g * 255)},${Math.floor(b * 255)})`);
    }
    return palette;
}

function createRandomPalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const hue = Math.random();
        palette.push(hsvToRgb(hue, 0.9, 0.9));
    }
    return palette;
}

function createSmoothRandomPalette(numColors) {
    const palette = [];
    const startHue = Math.random();
    const endHue = Math.random();
    for (let i = 0; i < numColors; i++) {
        const t = i / (numColors - 1);
        const hue = (startHue + (endHue - startHue) * t) % 1;
        palette.push(hsvToRgb(hue, 0.9, 0.9));
    }
    return palette;
}

function createCyberpunkPalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const t = i / numColors;
        let r, g, b;
        if (t < 0.25) {
            r = 1.0; g = 0.0; b = 1.0 - t * 4;
        } else if (t < 0.5) {
            r = 1.0 - (t - 0.25) * 4; g = 0.0; b = 0.0;
        } else if (t < 0.75) {
            r = 0.0; g = (t - 0.5) * 4; b = 0.0;
        } else {
            r = 0.0; g = 1.0 - (t - 0.75) * 4; b = 1.0;
        }
        palette.push(`rgb(${Math.floor(r * 255)},${Math.floor(g * 255)},${Math.floor(b * 255)})`);
    }
    return palette;
}

function createToxicPalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const t = i / numColors;
        let r, g, b;
        if (t < 0.5) {
            r = t * 2; g = 1.0; b = 0;
        } else {
            r = 1.0 - (t - 0.5) * 2; g = 1.0; b = (t - 0.5) * 2;
        }
        palette.push(`rgb(${Math.floor(r * 255)},${Math.floor(g * 255)},${Math.floor(b * 255)})`);
    }
    return palette;
}

function createElectricPalette(numColors) {
    const palette = [];
    for (let i = 0; i < numColors; i++) {
        const t = i / numColors;
        let h = (t * 0.5) + 0.5;
        let s = 1.0;
        let v = 1.0;
        palette.push(hsvToRgb(h, s, v));
    }
    return palette;
}

function regenerateAllPalettes() {
    palettes = {
        rainbow: createRainbowPalette(paletteSteps),
        grayscale: createGrayscalePalette(paletteSteps),
        fire: createFirePalette(paletteSteps),
        sea: createSeaPalette(paletteSteps),
        forest: createForestPalette(paletteSteps),
        sunset: createSunsetPalette(paletteSteps),
        desert: createDesertPalette(paletteSteps),
        aurora: createAuroraPalette(paletteSteps),
        space: createSpacePalette(paletteSteps),
        candy: createCandyPalette(paletteSteps),
        sepia: createSepiaPalette(paletteSteps),
        random: createRandomPalette(paletteSteps),
        random1: createSmoothRandomPalette(paletteSteps),
        cyberpunk: createCyberpunkPalette(paletteSteps),
        toxic: createToxicPalette(paletteSteps),
        electric: createElectricPalette(paletteSteps)
    };
}

function updateZoomDisplay() {
    const initialWidth = initialMaxX - initialMinX;
    const currentWidth = maxX - minX;
    const currentZoom = initialWidth / currentWidth;
    
    if (zoomDisplay) {
        let zoomText = currentZoom.toPrecision(3);
        
        if (currentZoom >= 1000 || currentZoom <= 0.001) {
            const parts = currentZoom.toExponential(2).split('e');
            const exponent = parts[1].startsWith('+') ? parts[1].substring(1) : parts[1];
            zoomText = `${parts[0]} x 10<sup>${exponent}</sup>`;
        }
        zoomDisplay.innerHTML = `現在の拡大率: ${zoomText}`;
    }
}

function drawMandelbrot() {
    const imageData = ctx.createImageData(WIDTH, HEIGHT);
    const data = imageData.data;

    const currentPalette = palettes[colorPaletteSelect.value];
    const whiteInsidePalettes = ['grayscale', 'sunset', 'desert'];
    const currentPower = parseFloat(powerSelect.value);

    for (let py = 0; py < HEIGHT; py++) {
        for (let px = 0; px < WIDTH; px++) {
            const cRe = minX + px / WIDTH * (maxX - minX);
            const cIm = minY + py / HEIGHT * (maxY - minY);
            let zRe = 0;
            let zIm = 0;
            let n = 0;
            
            let tempZre = 0;
            let tempZim = 0;
            
            switch (currentPower) {
                case 1.0:
                    while (zRe * zRe + zIm * zIm <= 4 && n < maxIterations) {
                        zRe = zRe + cRe;
                        zIm = zIm + cIm;
                        n++;
                    }
                    break;
                case 2.0:
                    while (zRe * zRe + zIm * zIm <= 4 && n < maxIterations) {
                        tempZre = zRe * zRe - zIm * zIm + cRe;
                        zIm = 2 * zRe * zIm + cIm;
                        zRe = tempZre;
                        n++;
                    }
                    break;
                case 3.0:
                    while (zRe * zRe + zIm * zIm <= 4 && n < maxIterations) {
                        tempZre = zRe * (zRe * zRe - 3 * zIm * zIm) + cRe;
                        zIm = zIm * (3 * zRe * zRe - zIm * zIm) + cIm;
                        zRe = tempZre;
                        n++;
                    }
                    break;
                case 4.0:
                    while (zRe * zRe + zIm * zIm <= 4 && n < maxIterations) {
                        const zRe2 = zRe * zRe;
                        const zIm2 = zIm * zIm;
                        tempZre = zRe2 * zRe2 + zIm2 * zIm2 - 6 * zRe2 * zIm2 + cRe;
                        zIm = 4 * zRe * zIm * (zRe2 - zIm2) + cIm;
                        zRe = tempZre;
                        n++;
                    }
                    break;
                case 5.0:
                    while (zRe * zRe + zIm * zIm <= 4 && n < maxIterations) {
                        const zRe2 = zRe * zRe;
                        const zIm2 = zIm * zIm;
                        tempZre = zRe * (zRe2*zRe2 - 10*zRe2*zIm2 + 5*zIm2*zIm2) + cRe;
                        zIm = zIm * (5*zRe2*zRe2 - 10*zRe2*zIm2 + zIm2*zIm2) + cIm;
                        zRe = tempZre;
                        n++;
                    }
                    break;
                case 6.0:
                    while (zRe * zRe + zIm * zIm <= 4 && n < maxIterations) {
                        const zRe3 = zRe * (zRe * zRe - 3 * zIm * zIm);
                        const zIm3 = zIm * (3 * zRe * zRe - zIm * zIm);
                        tempZre = zRe3 * zRe3 - zIm3 * zIm3 + cRe;
                        zIm = 2 * zRe3 * zIm3 + cIm;
                        zRe = tempZre;
                        n++;
                    }
                    break;
                case 7.0:
                    while (zRe * zRe + zIm * zIm <= 4 && n < maxIterations) {
                        const zRe3 = zRe * (zRe * zRe - 3 * zIm * zIm);
                        const zIm3 = zIm * (3 * zRe * zRe - zIm * zIm);
                        const zRe4 = zRe*zRe*zRe*zRe + zIm*zIm*zIm*zIm - 6*zRe*zRe*zIm*zIm;
                        const zIm4 = 4*zRe*zIm*(zRe*zRe - zIm*zIm);
                        tempZre = zRe3*zRe4 - zIm3*zIm4 + cRe;
                        zIm = zRe3*zIm4 + zIm3*zRe4 + cIm;
                        zRe = tempZre;
                        n++;
                    }
                    break;
                case 8.0:
                    while (zRe * zRe + zIm * zIm <= 4 && n < maxIterations) {
                        const zRe4 = zRe*zRe*zRe*zRe + zIm*zIm*zIm*zIm - 6*zRe*zRe*zIm*zIm;
                        const zIm4 = 4*zRe*zIm*(zRe*zRe - zIm*zIm);
                        tempZre = zRe4*zRe4 - zIm4*zIm4 + cRe;
                        zIm = 2 * zRe4 * zIm4 + cIm;
                        zRe = tempZre;
                        n++;
                    }
                    break;
                default:
                    while (zRe * zRe + zIm * zIm <= 4 && n < maxIterations) {
                        const r = Math.sqrt(zRe * zRe + zIm * zIm);
                        const theta = Math.atan2(zIm, zRe);
                        zRe = Math.pow(r, currentPower) * Math.cos(currentPower * theta) + cRe;
                        zIm = Math.pow(r, currentPower) * Math.sin(currentPower * theta) + cIm;
                        n++;
                    }
                    break;
            }
            
            const index = (py * WIDTH + px) * 4;
            if (n === maxIterations) {
                if (whiteInsidePalettes.includes(colorPaletteSelect.value)) {
                    data[index] = 255;
                    data[index + 1] = 255;
                    data[index + 2] = 255;
                } else {
                    data[index] = 0;
                    data[index + 1] = 0;
                    data[index + 2] = 0;
                }
            } else {
                const colorIndex = Math.floor(n / maxIterations * currentPalette.length);
                const color = currentPalette[colorIndex];
                const rgb = color.match(/\d+/g);
                data[index] = parseInt(rgb[0]);
                data[index + 1] = parseInt(rgb[1]);
                data[index + 2] = parseInt(rgb[2]);
            }
            data[index + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    updateZoomDisplay();
}

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    offscreenCtx.drawImage(canvas, 0, 0);
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.drawImage(offscreenCanvas, dx, dy);
        updateZoomDisplay();
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (isDragging) {
        isDragging = false;
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        const width = maxX - minX;
        const height = maxY - minY;
        minX -= dx / WIDTH * width;
        maxX -= dx / WIDTH * width;
        minY -= dy / HEIGHT * height;
        maxY -= dy / HEIGHT * height;
        drawMandelbrot();
    }
});

canvas.addEventListener('mouseout', (e) => {
    if (isDragging) {
        isDragging = false;
        drawMandelbrot();
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    offscreenCtx.drawImage(canvas, 0, 0);
    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;

    const currentZoom = (initialMaxX - initialMinX) / (maxX - minX);
    if (e.deltaY < 0 && currentZoom * zoomFactor > MAX_ZOOM) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.save();
    ctx.translate(mouseX, mouseY);
    ctx.scale(zoomFactor, zoomFactor);
    ctx.drawImage(offscreenCanvas, -mouseX, -mouseY);
    ctx.restore();

    const oldWidth = maxX - minX;
    const oldHeight = maxY - minY;
    const newWidth = oldWidth / zoomFactor;
    const newHeight = oldHeight / zoomFactor;
    
    const cRe = minX + (mouseX / WIDTH) * oldWidth;
    const cIm = minY + (mouseY / HEIGHT) * oldHeight;

    minX = cRe - (mouseX / WIDTH) * newWidth;
    maxX = cRe + (1 - mouseX / WIDTH) * newWidth;
    minY = cIm - (mouseY / HEIGHT) * newHeight;
    maxY = cIm + (1 - mouseY / HEIGHT) * newHeight;
    
    clearTimeout(window.zoomTimeout);
    window.zoomTimeout = setTimeout(() => {
        drawMandelbrot();
    }, 200);
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialPinchDistance = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);
        lastTouchCenter = { x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 };
        offscreenCtx.drawImage(canvas, 0, 0);
    } else if (e.touches.length === 1) {
        isDragging = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
        offscreenCtx.drawImage(canvas, 0, 0);
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 2 && initialPinchDistance) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentPinchDistance = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);
        const scaleFactor = currentPinchDistance / initialPinchDistance;

        const currentZoom = (initialMaxX - initialMinX) / (maxX - minX);
        if (scaleFactor > 1 && currentZoom * zoomFactor > MAX_ZOOM) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const centerX = lastTouchCenter.x - rect.left;
        const centerY = lastTouchCenter.y - rect.top;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scaleFactor, scaleFactor);
        ctx.drawImage(offscreenCanvas, -centerX, -centerY);
        ctx.restore();

        const oldWidth = maxX - minX;
        const oldHeight = maxY - minY;
        const newWidth = oldWidth / scaleFactor;
        const newHeight = oldHeight / scaleFactor;
        
        const cRe = minX + (centerX / WIDTH) * oldWidth;
        const cIm = minY + (centerY / HEIGHT) * oldHeight;

        minX = cRe - (centerX / WIDTH) * newWidth;
        maxX = cRe + (1 - centerX / WIDTH) * newWidth;
        minY = cIm - (centerY / HEIGHT) * newHeight;
        maxY = cIm + (1 - mouseY / HEIGHT) * newHeight;
        
        initialPinchDistance = currentPinchDistance;
        updateZoomDisplay();

    } else if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - lastMouseX;
        const dy = e.touches[0].clientY - lastMouseY;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.drawImage(offscreenCanvas, dx, dy);

        const width = maxX - minX;
        const height = maxY - minY;
        minX -= dx / WIDTH * width;
        maxX -= dx / WIDTH * width;
        minY -= dy / HEIGHT * height;
        maxY -= dy / HEIGHT * height;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
    }
});

canvas.addEventListener('touchend', () => {
    isDragging = false;
    initialPinchDistance = null;
    lastTouchCenter = null;
    drawMandelbrot();
});

maxIterationsSlider.addEventListener('input', () => {
    maxIterations = parseInt(maxIterationsSlider.value);
    maxIterationsValueSpan.textContent = maxIterations;
    paletteStepsSlider.max = maxIterations;
    if (parseInt(paletteStepsSlider.value) > maxIterations) {
        paletteStepsSlider.value = maxIterations;
        paletteSteps = maxIterations;
        regenerateAllPalettes();
    }
});
maxIterationsSlider.addEventListener('change', () => {
    drawMandelbrot();
});

paletteStepsSlider.addEventListener('input', () => {
    paletteSteps = parseInt(paletteStepsSlider.value);
    paletteStepsValueSpan.textContent = paletteSteps;
    regenerateAllPalettes();
});
paletteStepsSlider.addEventListener('change', () => {
    drawMandelbrot();
});

colorPaletteSelect.addEventListener('change', () => {
    const selectedPalette = colorPaletteSelect.value;
    if (selectedPalette.startsWith('random')) {
        generateRandomPaletteBtn.style.display = 'inline-block';
    } else {
        generateRandomPaletteBtn.style.display = 'none';
    }
    drawMandelbrot();
});

generateRandomPaletteBtn.addEventListener('click', () => {
    const selectedPalette = colorPaletteSelect.value;
    if (selectedPalette === 'random') {
        palettes.random = createRandomPalette(paletteSteps);
    } else if (selectedPalette === 'random1') {
        palettes.random1 = createSmoothRandomPalette(paletteSteps);
    }
    drawMandelbrot();
});

powerSelect.addEventListener('change', () => {
    drawMandelbrot();
});

resetBtn.addEventListener('click', () => {
    minX = initialMinX;
    maxX = initialMaxX;
    minY = initialMinY;
    maxY = initialMaxY;

    drawMandelbrot();
});

saveImageBtn.addEventListener('click', () => {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'mandelbrot_fractal.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

regenerateAllPalettes();
drawMandelbrot();