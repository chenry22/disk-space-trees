import { playhtml } from "https://unpkg.com/playhtml";
import { addTree } from "./firebase.js";

playhtml.init({ 
    cursors: { 
        enabled: true,
        container: "#cursor-container"
    },

    events: {
        plantTree: {
            type: "plantTree",
            onEvent: ({ hash, x, y, name, title, description }) => {
                trees[x + ',' + y] = { hash, name, title, description }
            },
        },
    }
});

playhtml.presence.onPresenceChange("cursor", presences => {
    const count = presences.size || 0;
    document.querySelector('#user-count span').textContent = count;
});

document.addEventListener("DOMContentLoaded", () => {
    const inp = document.getElementById('file-input');
    inp.onchange = () => {
        getHash(inp.files[0])
            .then(async (hash) => {
                trees[key] = { hash };
                const x = parseInt(key.split(',')[0]);
                const y = parseInt(key.split(',')[1]);
                const payload = { hash, x, y, name: '', title: '', description: '' };
                if (await addTree(payload)) {
                    playhtml.dispatchPlayEvent({
                        type: "plantTree",
                        eventPayload: payload,
                    });
                    window.requestAnimationFrame(draw);
                }
            });
    };
})