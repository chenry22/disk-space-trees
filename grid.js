// canvas only used for drawing
// offset set to 0,0 on load
// offset used for grid system.

let interactCanvas = document.querySelector('.interaction');
let interactCtx = interactCanvas.getContext('2d');
let canvas = document.querySelector('.field');
let ctx = canvas.getContext('2d');

interactCanvas.width = window.innerWidth;
interactCanvas.height = window.innerHeight;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const maxBlockSize = 200;
const minBlockSize = 110;
let step = 140; // Math.max(minBlockSize, Math.min(maxBlockSize, window.innerWidth / 9)); // how big each block is
let gridBlockBorderColor = "#d1e5d0";

const inp = document.getElementById('file-input');

function worldToScreen(x, y) {
    return {
        x: window.innerWidth / 2 + offset.x + x * step,
        y: window.innerHeight / 2 + offset.y - y * step
    };
}
function screenToWorld(x, y) {
    return {
        x: (x - window.innerWidth / 2 - offset.x) / step,
        y: (window.innerHeight / 2 + offset.y - y) / step
    };
}
function getGridCoordinate(x, y) {
    const world = screenToWorld(x, y);
    return { x: Math.floor(world.x), y: Math.floor(world.y) };
}


let offset = { x: -step / 2, y: -step / 2 };
let startOffset = { x: 0, y: 0 };

// trees are { x, y, hash, name, title, description}
var trees = {};
const treeAt = (x, y) => trees[x + ',' + y];

function drawGridLines() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.beginPath();
    const minX = Math.floor(
        (-width / 2 - offset.x) / step
    ) - 1;
    const maxX = Math.ceil(
        (width / 2 - offset.x) / step
    ) + 1;
    const minY = Math.floor(
        (-height / 2 + offset.y) / step
    ) - 1;
    const maxY = Math.ceil(
        (height / 2 + offset.y) / step
    ) + 1;

    for (let xLabel = minX; xLabel <= maxX; xLabel++) {
        const { x } = worldToScreen(xLabel, 0);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    for (let yLabel = minY; yLabel <= maxY; yLabel++) {
        const { y } = worldToScreen(0, yLabel);
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.strokeStyle = gridBlockBorderColor;
    ctx.stroke();
}

function drawBlocks(time) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const minX = Math.floor(
        (-width / 2 - offset.x) / step
    ) - 1;
    const maxX = Math.ceil(
        (width / 2 - offset.x) / step
    ) + 1;
    const minY = Math.floor(
        (-height / 2 + offset.y) / step
    ) - 1;
    const maxY = Math.ceil(
        (height / 2 + offset.y) / step
    ) + 1;

    for (let xLabel = minX; xLabel <= maxX; xLabel++) {
        for (let yLabel = minY; yLabel <= maxY; yLabel++) {
            const { x, y } = worldToScreen(xLabel, yLabel);
            if (x + step < 0 || x > width || y + step < 0 || y > height) continue;

            ctx.font = "10px serif";
            ctx.fillStyle = "#02020230";
            ctx.fillText( `${xLabel}, ${yLabel}`, x + 5, y + 15);

            const tree = treeAt(xLabel, yLabel );
            if (!tree) continue;

            const moundCenterY = y + step - step / 10;
            ctx.beginPath();
            ctx.moveTo(x + step * 0.32, moundCenterY);
            ctx.quadraticCurveTo(
                x + step * 0.5, y + step - step * 0.22,
                x + step * 0.68, moundCenterY
            );
            ctx.quadraticCurveTo(
                x + step * 0.5, y + step - step * 0.02,
                x + step * 0.32, moundCenterY
            );

            ctx.closePath();
            ctx.fillStyle = "#423a30";
            ctx.fill();

            branch(ctx, tree.hash, 
                x + step / 2, y + step - step / 9, 
                x + step / 2, y + step - step * 0.48, 
                12, tree, time
            );
        }
    }
}

function draw(time, loop = false) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGridLines();
    drawBlocks(time);

    if (loop) {
        window.requestAnimationFrame(t => draw(t, true));
    }
}

const reset = () => {
    start = null;
    startOffset = { x : offset.x, y: offset.y };
    ctx.setTransform(
        1, 0, 0, 
        1, offset.x, offset.y
    );
    interactCtx.setTransform(
        1, 0, 0, 
        1, offset.x, offset.y
    );
    window.requestAnimationFrame(draw);
}



// coordinates
function updateCoordinates(e) {
    const coords = e.target.value.split(',');
    if (coords.length < 2) return;
    const x = parseInt(coords[0]);
    const y = parseInt(coords[1]);
    if (isNaN(x) || isNaN(y)) return;
    offset = { 
        x: -x * step - step / 2, 
        y: y * step - step / 2,
    };
    reset();
    draw();
}
function setCoords() {
    coordsIn.value = 
        Math.floor(-(offset.x + step / 2) / step) 
        + ',' + Math.floor((offset.y + step) / step);
}
const coordsIn = document.getElementById("coordinates");
coordsIn.addEventListener("change", updateCoordinates);



// Mouse event handling:
let start, pos;
const getPos = (e) => ({ x: e.clientX, y: e.clientY });
const normalize = (value, step) => value % step;

canvas.addEventListener("pointerdown", e => {
    start = getPos(e);
    startOffset = { x: offset.x, y: offset.y };
    canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointerup", e => {
    if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
    }
    reset();
});
canvas.addEventListener("pointerleave", e => {
    if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
    }
    reset();
});
canvas.addEventListener("pointermove", e => {
    // Only move the grid when we registered a mousedown event
    if (!start) return;
    pos = getPos(e);

    const dx = pos.x - start.x;
    const dy = pos.y - start.y;
    offset.x += dx;
    offset.y += dy;
    start = pos;

    document.getElementById('cursor-container').style.transform =
        `translate(${offset.x}px, ${offset.y}px)`;

    draw();
    setCoords();
    drawInteract(e);
});

function keyFromHover(x, y) {
    const xLabel = Math.floor(
        (x - startOffset.x - canvas.width / 2) / step
    );
    const yLabel = Math.floor(
        (startOffset.y + canvas.height / 2 - y) / step
    );
    return xLabel + ',' + yLabel;
}

function drawInteract(e) {
    const { xLabel, yLabel } = screenToWorld(e.clientX, e.clientY);
    const { x, y } = worldToScreen(xLabel, yLabel);

    interactCtx.setTransform(1, 0, 0, 1, 0, 0);
    interactCtx.clearRect(
        0, 0,
        interactCanvas.width,
        interactCanvas.height
    );

    const tree = treeAt(xLabel, yLabel);
    if (tree) return;

    interactCtx.fillStyle = 'rgba(254, 254, 254, 0.24)';
    interactCtx.fillRect(x, y, step, step);
}

interactCanvas.addEventListener('pointermove', e => {
    drawInteract(e);
    const clonedEvent = new MouseEvent(e.type, e);
    canvas.dispatchEvent(clonedEvent);
});

let down = null;
let key = '';

interactCanvas.addEventListener('pointerdown', e => {
    down = { x : e.clientX, y : e.clientY };
    const clonedEvent = new MouseEvent(e.type, e);
    canvas.dispatchEvent(clonedEvent);
});
interactCanvas.addEventListener('pointerup', e => {
    if (down && down.x === e.clientX && down.y === e.clientY) {
        const xHover = Math.floor((e.clientX - normalize(offset.x, step)) / step) * step;
        const yHover = Math.floor((e.clientY - normalize(offset.y, step)) / step) * step;
        key = keyFromHover(xHover, yHover);
        if (!trees[key]) {
            inp.click();
        }
    }
    const clonedEvent = new MouseEvent(e.type, e);
    canvas.dispatchEvent(clonedEvent);
});
interactCanvas.addEventListener('pointerleave', e => {
    const clonedEvent = new MouseEvent(e.type, e);
    canvas.dispatchEvent(clonedEvent);
});

window.addEventListener('resize', () => {
    // step = Math.max(minBlockSize, Math.min(maxBlockSize, window.innerWidth / 8));
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    interactCanvas.width = window.innerWidth;
    interactCanvas.height = window.innerHeight;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    interactCtx.setTransform(1, 0, 0, 1, 0, 0);
    draw();
}, true);

window.requestAnimationFrame(t => draw(t, true)); // on page load
setCoords();