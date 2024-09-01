const http = require("http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const url = require("url");

const PORT = 8080;

const server = http.createServer((req, res) => {});

const wss = new WebSocket.Server({ noServer: true });

const SECRET_KEY = "secret_key";

const authenticate = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
};

wss.on("connection", (ws, req) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  const user = authenticate(token);

  if (!user) {
    ws.close();
    return;
  }

  ws.on("open", () => console.log("New client"));

  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);

    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => console.log("WebSocket error", error));

  ws.send("Welcome to the chat!");
});

server.listen(PORT, () => console.log(`Server is listening on PORT: ${PORT}`));
