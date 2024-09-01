import { useState } from "react";
import "./App.css";
import Chat from "./components/Chat";
import Login from "./components/Login";

function App() {
  const [token, setToken] = useState<string | null>(null);

  return (
    <div>{token ? <Chat token={token} /> : <Login setToken={setToken} />}</div>
  );
}

export default App;
