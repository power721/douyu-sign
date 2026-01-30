const http = require("http");
const vm = require("vm");

const server = http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/sign") {
        res.writeHead(404);
        return res.end("Not found");
    }

    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
        try {
            const payload = JSON.parse(body);

            if (payload.error !== 0 || typeof payload.data !== "object") {
                throw new Error("Invalid payload");
            }

            const roomKey = Object.keys(payload.data).find(k => k.startsWith("room"));
            if (!roomKey) throw new Error("No room key");

            const roomId = roomKey.slice(4);
            const jsCode = payload.data[roomKey];

            const CryptoJS = require("crypto-js");

            const sandbox = {
                console,
                CryptoJS
            };
            const context = vm.createContext(sandbox);
            const { randomUUID } = require("crypto");

            const did = randomUUID().replace(/-/g, ""); // match uuid.uuid4().hex
            const tt = Math.floor(Date.now() / 1000).toString();

            vm.runInContext(jsCode, context, { timeout: 1000 });

            if (typeof context.ub98484234 !== "function") {
                throw new Error("ub98484234 not found");
            }

            const result = context.ub98484234(roomId, did, tt);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ roomId, result: String(result) }));

        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
    });
});

server.listen(3000, () => {
    console.log("Listening on http://localhost:3000");
});
