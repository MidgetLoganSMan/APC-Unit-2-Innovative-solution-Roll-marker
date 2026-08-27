import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Login from "./pages/Login";
import AuthContext from "./context/AuthContext";
import ClassRoll from "./pages/ClassRoll"; // You will add this later

function App() {
  const [token, setToken] = useState(null);

  return (
    <AuthContext.Provider value={token}>
      <BrowserRouter>
        {!token ? (
          <Login onLogin={setToken} />
        ) : (
          <>
            <nav>
              <Link to="/roll">Class Roll</Link>
            </nav>

            <Routes>
              <Route path="/roll" element={<ClassRoll />} />
            </Routes>
          </>
        )}
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
