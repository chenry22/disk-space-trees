// Source - https://stackoverflow.com/a/52531967
// Posted by Kaiido
// Retrieved 2026-10-04, License - CC BY-SA 4.0

async function getHash(blob, algo = "SHA-256") {
  // convert your Blob to an ArrayBuffer
  // could also use a FileReader for this for browsers that don't support Response API
  const buf = await new Response(blob).arrayBuffer();
  const hash = await crypto.subtle.digest(algo, buf);
  let result = '';
  const view = new DataView(hash);
  for (let i = 0; i < hash.byteLength; i += 4) {
    result += view.getUint32(i).toString(16).padStart(8, '0');
  }
  return result;
}

function branch(ctx, hash, x1, y1, x2, y2, width, tree, time) {
    const dx = x2 - x1;
    const dy = y1 - y2;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const length = Math.hypot(dx, dy);

    if (length === 0) return;
    const parentAngle = Math.atan2(dx, dy);

    const ux = dx / length;
    const uy = (y2 - y1) / length;
    const px = -uy;
    const py = ux;

    const topWidth = width * 0.65;

    ctx.fillStyle = '#74613a';
    ctx.beginPath();
    ctx.moveTo(x1 + px * width / 2, y1 + py * width / 2);
    ctx.lineTo(x2 + px * topWidth / 2, y2 + py * topWidth / 2);
    ctx.lineTo(x2 - px * topWidth / 2, y2 - py * topWidth / 2);
    ctx.lineTo(x1 - px * width / 2, y1 - py * width / 2);
    ctx.closePath();
    ctx.fill();

    if (hash.length === 0) {
        // console.log(x2 % (tree.windX.length - 1), y2 % (tree.windY.length - 1))
        const xMax = Math.abs(dx + parentAngle) % 4 - 2;
        const yMax = Math.abs(dy + parentAngle) % 3 - 1.5;

        const windX = xMax * Math.sin(time * Math.abs(xMax) / (1400));
        const windY = yMax * Math.sin(time * Math.abs(yMax) / (1000));
        // console.log(windX, windY)

        ctx.fillStyle = '#0dae12b3';
        ctx.beginPath();
        ctx.arc(x2 + windX, y2 + windY, width * (2.2 + xMax * Math.sin(time / (1200 + (xMax + yMax) * 60)) * 0.06), 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        return;
    }

    function endpoint(x, y, relativeAngle, len) {
        const angle = parentAngle + relativeAngle;
        return {
            x: x + Math.sin(angle) * len,
            y: y - Math.cos(angle) * len
        };
    }
    const childLength = length * 0.72;
    const childWidth = topWidth;

    const hexToBits = (hex) => parseInt(hex, 16).toString(2).padStart(4, "0");;
    function bitsToAngle(bits, startAngle, angleIncrement) {
        const value = parseInt(bits.slice(0, 2), 2);
        return (startAngle + value * angleIncrement) * Math.PI / 180;
    }

    if (hash.length % 2 === 0) {
        const r = Array.from(hash);
        const leftMid= hexToBits(r.pop());
        const leftTop = hexToBits(r.pop());
        const rightMid = hexToBits(r.pop());
        const rightTop = hexToBits(r.pop());
        const remaining = r.join('');
        // console.log(hash);
        // console.log([leftMid, leftTop, rightMid, rightTop]);

        // how many paths are branching
        let numTakes = parseInt(leftMid[3]) + parseInt(rightMid[3])
            + parseInt(leftTop[3]) + parseInt(rightTop[3]);
        let sliceLen = numTakes > 0 ? Math.ceil(remaining.length / numTakes) : -1;
        // console.log(numTakes, sliceLen)
        
        // middle branch
        if (numTakes <= 1) {
            sliceLen = Math.ceil(remaining.length / (numTakes + 1));
            // console.log(sliceLen);
            const end = endpoint(
                x2, y2, 0,
                childLength
            )
            branch(
                ctx, remaining.substring(sliceLen < remaining.length ? sliceLen : 0, remaining.length),
                x2, y2, end.x, end.y,
                childWidth, tree, time
            )
        }

        const leftTopEnd = endpoint(
            x2, y2, 
            -bitsToAngle(leftTop, 30, 10), 
            childLength + (length * 0.05 * parseInt(leftTop[2]))
        );
        branch(
            ctx, leftTop[3] === '1' ? remaining.substring(0, sliceLen) : '',
            x2, y2, leftTopEnd.x, leftTopEnd.y,
            childWidth, tree, time
        );
        const rightTopEnd = endpoint(
            x2, y2, 
            bitsToAngle(rightTop, 30, 10), 
            childLength + (length * 0.05 * parseInt(rightTop[2]))
        );
        branch(
            ctx, 
            rightTop[3] === '1' ? 
                remaining.substring(
                    sliceLen * parseInt(leftTop[3]), 
                    Math.min(
                        sliceLen * (1 + parseInt(leftTop[3])), 
                        remaining.length + 1
                    )
                ) 
                : '',
            x2, y2, rightTopEnd.x, rightTopEnd.y,
            childWidth, tree, time
        );

        const midLength = childLength * 0.8;
        if (leftMid[2] === '1' || leftMid[3] === '1') {
            const leftMidEnd = endpoint(
                midX, midY, 
                -bitsToAngle(leftMid, 30, 15), 
                midLength + (length * 0.05 * parseInt(leftMid[2] && leftMid[3]))
            );
            branch(
                ctx, leftMid[3] === '1' ? 
                    remaining.substring(
                        sliceLen * (parseInt(leftTop[3]) + parseInt(rightTop[3])), 
                        Math.min(
                            sliceLen * (1 + parseInt(leftTop[3]) + parseInt(rightTop[3])), 
                            remaining.length + 1
                        )
                    ) 
                    : '',
                midX, midY, leftMidEnd.x, leftMidEnd.y,
                childWidth, tree, time
            );
        }
        if (rightMid[2] === '1' || rightMid[3] === '1') {
            const rightMidEnd = endpoint(
                midX, midY, 
                bitsToAngle(rightMid, 30, 15), 
                midLength + (length * 0.05 * parseInt(rightMid[2] && rightMid[3]))
            );
            branch(
                ctx, rightMid[3] === '1' ? 
                    remaining.substring(
                        sliceLen * (parseInt(leftTop[3]) + parseInt(rightTop[3]) + parseInt(leftMid[3])), 
                        Math.min(
                            sliceLen * (1 + parseInt(leftTop[3]) + parseInt(rightTop[3]) + parseInt(leftMid[3])), 
                            remaining.length + 1
                        )
                    ) 
                    : '',
                midX, midY, rightMidEnd.x, rightMidEnd.y,
                childWidth, tree, time
            );
        }
        return;
    }

    // odd case
    const bits = parseInt(hash[0], 16).toString(2).padStart(4, "0");
    const remaining = hash.slice(1);

    const left = bits[0] === "1";
    const right = bits[1] === "1";
    const leafLeft = bits[2] === "1";
    const leafRight = bits[3] === "1";
    // console.log(left, right, leafLeft, leafRight);

    if (left && right) {
        const midpoint = Math.floor(remaining.length / 2);
        const leftEnd = endpoint(
            x2, y2, 
            -30 * (1 + parseInt(bits[2])) * Math.PI / 180,
            childLength
        );
        branch(
            ctx, remaining.slice(0, midpoint),
            x2, y2, leftEnd.x, leftEnd.y,
            childWidth, tree, time
        );

        const rightEnd = endpoint(
            x2, y2,
            30 * (1 + parseInt(bits[3])) * Math.PI / 180,
            childLength
        );
        branch(
            ctx, remaining.slice(midpoint),
            x2, y2, rightEnd.x, rightEnd.y,
            childWidth, tree, time
        );
    } else if (left) {
        const end = endpoint(
            x2, y2,
            -30 * (1 + parseInt(bits[2])) * Math.PI / 180,
            childLength
        );
        branch(
            ctx, remaining,
            x2, y2, end.x, end.y,
            childWidth, tree, time
        );
    } else if (right) {
        const end = endpoint(
            x2, y2,
            30 * (1 + parseInt(bits[3])) * Math.PI / 180,
            childLength
        );
        branch(
            ctx, remaining,
            x2, y2, end.x, end.y,
            childWidth, tree, time
        );
    } else {
        const end = endpoint(
            x2, y2, 0,
            childLength
        );
        branch(
            ctx, remaining,
            x2, y2, end.x, end.y,
            childWidth, tree, time
        );
    }

    if (leafLeft) {
        const p = endpoint(
            x2, y2, -Math.PI / 4,
            childLength * 0.6
        );
        branch(
            ctx, "",
            x2, y2, p.x, p.y,
            childWidth, tree, time
        );
    }
    if (leafRight) {
        const p = endpoint(
            x2, y2, Math.PI / 4,
            childLength * 0.6
        );
        branch(
            ctx, "",
            x2, y2, p.x, p.y,
            childWidth, tree, time
        );
    }
}