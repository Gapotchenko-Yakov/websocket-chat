import { useEffect, useState } from "react";

type Message = string;

let renderCounter = 0;

const Chat = () => {
  renderCounter++;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<Message>("");
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => console.log("Connection established");

    ws.onmessage = (event) =>
      setMessages((prevMessages) => [...prevMessages, event.data]);

    ws.onclose = () => console.log("Connection closed");

    ws.onerror = (error) => console.log("WebSocket error:", error);

    setSocket(ws);

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (socket && messageInput.trim()) {
      socket.send(messageInput);
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
