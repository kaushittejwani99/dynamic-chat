const http = require("http");
const WebSocket = require("ws");

const httpServer = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Server created successfully");
});

const wsServer = new WebSocket.Server({ server: httpServer });

wsServer.on("connection", (conn) => {
    console.log("New connection established");

    conn.on("open", () => console.log("Connection is open"));
    conn.on("close", () => console.log("Connection was closed"));
    conn.on("message", (message) => {
        console.log("Message received:", message);
    });
});

httpServer.listen(3000, () => console.log("HTTP server listening on port 3000"));
