let interactCanvas = document.querySelector('.interaction');
let interactCtx = interactCanvas.getContext('2d');
let canvas = document.querySelector('.field');
let ctx = canvas.getContext('2d');

interactCanvas.width = 1920; // window.innerWidth;
interactCanvas.height = 1080; // window.innerHeight;
canvas.width = 1920; // window.innerWidth;
canvas.height = 1080; // window.innerHeight;

const maxBlockSize = 200;
const minBlockSize = 110;
let step = 140; // Math.max(minBlockSize, Math.min(maxBlockSize, window.innerWidth / 9)); // how big each block is
let gridBlockBorderColor = "#d1e5d0";

const inp = document.getElementById('file-input');

let offset = { x: 0, y: 0 };
let startOffset = { x: 0, y: 0 };

// trees are { x: number, y: number, hash: string, id: string }
var trees = {
    // '1,0' : { hash: "3aa34aaa00860754d4e4099c86c1e90a8cb4f0379e836e675423f02053d65843" },
    // '1,1' : { hash: "654203691c7293af161eb41f8edfce346e3c93bb85b5d0ca31d0013bb0a78894" },
    // '3,2' : { hash: "65e8d65df23f4898f4ab3a96de7af49cb7a8960d95af5eb1912a8c958a6fa6fe" },
    // '-1,0' : { hash: "e68a65f839da6a0c075ff2f76a6f251aed4d033895a3b947d0a4be41169f6355" },
    // '-2,2' : { hash: "ad4e6ddc506091be2e7825b5b8daa91c59e269cc41edc775a6c2c4a1737744ab" }
};
const treeAt = (x, y) => trees[x + ',' + y];

function drawGridLines(left, top, right, bottom) {
    ctx.beginPath();
    for (let x = left; x < right; x += step) {
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
    }
    for (let y = top; y < bottom; y += step) {
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
    }
    ctx.strokeStyle = gridBlockBorderColor;
    ctx.stroke();
}

function drawBlocks(left, top, right, bottom, time) {
    for (let x = left; x < right; x += step) {
        for (let y = top; y < bottom; y += step) {
            const xLabel = Math.floor(
                (x - startOffset.x - canvas.width / 2) / step
            );
            const yLabel = Math.floor(
                (startOffset.y + canvas.height / 2 - y) / step
            );

            ctx.font = "10px serif";
            ctx.fillStyle = '#02020230';
            ctx.fillText(xLabel + ', ' + yLabel, x + 5, y + 15);

            let tree = treeAt(xLabel, yLabel);
            if (tree) {
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
}

function draw(time, loop = false) {
    let left = -Math.ceil(canvas.width / step) * step;
    let top = -Math.ceil(canvas.height / step) * step;
    let right = 2 * canvas.width;
    let bottom = 2 * canvas.height;

    ctx.clearRect(left, top, right - left, bottom - top);
    drawGridLines(left, top, right, bottom);
    drawBlocks(left, top, right, bottom, time);
    
    if (loop) {
        window.requestAnimationFrame(t => draw(t, loop));
    }
}



// coordinates
function updateCoordinates(e) {
    const coords = e.target.value.split(',');
    if (coords.length < 2) return;
    const x = parseInt(coords[0]);
    const y = parseInt(coords[1]);
    if (x === undefined || y === undefined) return;
    offset = { x: -x * step - step / 2, y: y * step };
    reset();
}
function setCoords() {
    coordsIn.value = '';
        // Math.floor(-(offset.x - normalize(offset.x, step) + canvas.width / 2) / step) + ',' 
        // + ((offset.y - normalize(offset.y, step)) / step);
}
const coordsIn = document.getElementById("coordinates");
coordsIn.addEventListener("change", updateCoordinates);

// Mouse event handling:
let start, pos;
const getPos = (e) => ({ x: e.clientX, y: e.clientY });
const normalize = (value, step) => value % step;

const reset = () => {
    start = null;
    startOffset = { x : offset.x - normalize(offset.x, step), y: offset.y - normalize(offset.y, step) };
    ctx.setTransform(
        1, 0, 0, 
        1, normalize(offset.x, step), normalize(offset.y, step)
    );
    interactCtx.setTransform(
        1, 0, 0, 
        1, normalize(offset.x, step), normalize(offset.y, step)
    );
    window.requestAnimationFrame(draw);
}

canvas.addEventListener("pointerdown", e => {
    reset();
    start = getPos(e);
});

canvas.addEventListener("pointerup", reset);
canvas.addEventListener("pointerleave", reset);

canvas.addEventListener("pointermove", e => {
    // Only move the grid when we registered a mousedown event
    if (!start) return;
    pos = getPos(e);

    offset.x += pos.x - start.x;
    offset.y += pos.y - start.y;
    ctx.translate(pos.x - start.x, pos.y - start.y);
    interactCtx.setTransform(
        1, 0, 0, 
        1, normalize(offset.x, step), normalize(offset.y, step)
    );

    document.getElementById('cursor-container')
        .style.transform = `translate(${offset.x}px, ${offset.y}px)`;

    window.requestAnimationFrame(draw);
    start = pos;
    setCoords();
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
    const xHover = Math.floor((e.clientX - normalize(offset.x, step)) / step) * step;
    const yHover = Math.floor((e.clientY - normalize(offset.y, step)) / step) * step;

    // TODO: different behavior if tree or no tree

    interactCtx.clearRect(
        -interactCanvas.width, -interactCanvas.height, 
        interactCanvas.width * 3, interactCanvas.height * 3
    );

    const tree = trees[keyFromHover(xHover, yHover)];
    if (tree) {

    } else {
        interactCtx.fillStyle = 'rgba(254, 254, 254, 0.24)'; // Semi-transparent highlight overlay
        interactCtx.fillRect(xHover, yHover, step, step);
    }
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
    // interactCanvas.width = window.innerWidth;
    // interactCanvas.height = window.innerHeight;
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;
    draw();
}, true);

window.requestAnimationFrame(t => draw(t, true)); // on page load
setCoords();