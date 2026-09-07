import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import AuthContext from './context/AuthContext';
import ClassRoll from './pages/ClassRoll';

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('teacher-token'));

  const logIn = (nextToken) => {
    sessionStorage.setItem('teacher-token', nextToken);
    setToken(nextToken);
  };

  const logOut = () => {
    sessionStorage.removeItem('teacher-token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={token}>
      <BrowserRouter>
        {!token ? (
          <Login onLogin={logIn} />
        ) : (
          <>
            <nav className="app-nav">
              <a className="brand" href="/roll">
                <span aria-hidden="true">✓</span>
                Roll Marker
              </a>
              <button type="button" className="button-secondary" onClick={logOut}>Sign out</button>
            </nav>
            <Routes>
              <Route path="/roll" element={<ClassRoll />} />
              <Route path="*" element={<Navigate to="/roll" replace />} />
            </Routes>
          </>
        )}
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
