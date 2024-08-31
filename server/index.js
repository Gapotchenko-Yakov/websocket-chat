const http = require("http");
const WebSocket = require("ws");

const port = 8080;

const server = http.createServer((req, res) => {});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("open", () => console.log("New client"));

  ws.on("message", (message) => {
    // console.log("🚀 ~ ws.on ~ event:", event);
    // const { data: message } = event;
    console.log(`Received message: ${message}`);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => console.log("Client closed"));

  ws.on("error", (error) => console.log("WebSocket error", error));
});

server.listen(port, () => console.log(`Server is listening on port: ${port}`));
