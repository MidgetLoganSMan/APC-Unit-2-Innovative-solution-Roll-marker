import { useState } from "react";
import Login from "./pages/Login";

function App() {
  const [token, setToken] = useState(null);

  if (!token) return <Login onLogin={setToken} />;

  return <h1>Logged in!</h1>;
}

export default App;
