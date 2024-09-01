const http = require("http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const url = require("url");

const PORT = 8080;
const SECRET_KEY = "secret_key";

const server = http.createServer((req, res) => {
  // Устанавливаем заголовки CORS
  res.setHeader("Access-Control-Allow-Origin", "*"); // Разрешаем все источники, замените '*' на нужный домен при необходимости
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  ); // Разрешаем указанные методы
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Разрешаем указанные заголовки

  // Обработка preflight-запросов (OPTIONS)
  if (req.method === "OPTIONS") {
    res.writeHead(204); // No Content
    res.end();
    return;
  }

  // Логика для обработки других запросов
  else if (req.method === "POST" && req.url === "/login") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { username, password } = JSON.parse(body);

        if (username === "user" && password === "1234") {
          const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ token }));
        } else {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid credentials" }));
        }
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid request" }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
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

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
