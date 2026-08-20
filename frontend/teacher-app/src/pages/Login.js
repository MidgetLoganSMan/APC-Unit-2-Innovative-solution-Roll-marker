import { useState } from "react";
import { login } from "../api/auth";

export default function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await login(email, password);
    if (token) setToken(token);
  };

  return (
    <div>
      <h2>Teacher Login</h2>
      <form onSubmit={handleSubmit}>
        <input 
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button>Login</button>
      </form>
    </div>
  );
}
