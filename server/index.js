const http = require("http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const url = require("url");

const SECRET_KEY = "your_secret_key";

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/login") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { username, password } = JSON.parse(body);

      if (username === "user" && password === "password") {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ token }));
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid credentials" }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === "auth") {
        const token = parsedMessage.token;

        jwt.verify(token, SECRET_KEY, (err, decoded) => {
          if (err) {
            ws.send(
              JSON.stringify({ type: "error", message: "Invalid token" })
            );
            ws.close();
          } else {
            ws.isAuthenticated = true;
            ws.send(
              JSON.stringify({ type: "success", message: "Authenticated" })
            );
          }
        });
      } else if (ws.isAuthenticated) {
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "message",
                content: parsedMessage.content,
              })
            );
          }
        });
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });
});

server.on("upgrade", (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;

  if (pathname === "/chat") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
