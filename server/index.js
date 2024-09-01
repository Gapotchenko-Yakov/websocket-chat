const http = require("http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const url = require("url");
const express = require("express");
const cors = require("cors");

const PORT = 8080;
const SECRET_KEY = "secret_key";
const users = {
  user: "1234",
};

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(cors());

const generateToken = (username) => {
  return jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
};

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (users[username] === password) {
    const token = generateToken(username);
    res.status(200).json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

wss.on("connection", (ws) => {
  let userToken = null;

  ws.on("message", (messageBuffer) => {
    const message = messageBuffer.toString();

    const data = JSON.parse(message);
    if (data.type === "auth") {
      try {
        const decoded = jwt.verify(data.token, SECRET_KEY);
        userToken = data.token;
        console.log("Authenticated");
        ws.send(JSON.stringify({ status: "Authenticated" }));
      } catch (err) {
        console.log("Authentication failed");
        ws.send(JSON.stringify({ status: "Authentication failed" }));
      }
    } else if (userToken) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// server.on("upgrade", (request, socket, head) => {
//   const pathname = url.parse(request.url).pathname;

//   if (pathname === "/chat") {
//     wss.handleUpgrade(request, socket, head, (ws) => {
//       wss.emit("connection", ws, request);
//     });
//   } else {
//     socket.destroy();
//   }
// });

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
