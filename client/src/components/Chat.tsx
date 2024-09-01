import { useEffect, useState } from "react";

type Message = string;

let renderCounter = 0;

const Chat = () => {
  renderCounter++;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<Message>("");
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      console.error("No JWT token found. Please login first.");
      return;
    }

    const ws = new WebSocket("ws://localhost:8080/chat");

    ws.onopen = () => {
      console.log("Connection established");

      // Отправка токена через заголовок Authorization
      ws.send(JSON.stringify({ type: "auth", token }));
    };

    ws.onmessage = (event: MessageEvent) => {
      if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          setMessages((prevMessages) => [...prevMessages, text]);
        };
        reader.readAsText(event.data);
      } else if (typeof event.data === "string") {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type === "message") {
          setMessages((prevMessages) => [...prevMessages, parsedData.content]);
        }
      }
    };

    ws.onclose = () => console.log("Connection closed");

    ws.onerror = (error) => console.log("WebSocket error:", error);

    setSocket(ws);

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (socket && messageInput.trim()) {
      socket.send(JSON.stringify({ type: "message", content: messageInput }));
      setMessageInput("");
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>WebSocket Чат (Количество отрисовок: {renderCounter / 2})</h2>
      <div
        id="messages"
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "auto",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
      <div id="input">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)} // Контролируемое поле
          placeholder="Введите сообщение"
          style={{ width: "80%" }}
        />
        <button onClick={sendMessage} style={{ marginLeft: "10px" }}>
          Отправить
        </button>
      </div>
    </div>
  );
};

export default Chat;
