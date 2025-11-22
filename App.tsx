// App.tsx
import React, { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Escucha cambios de sesión (login/logout/refresh)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    // Realmente no hace falta, el listener ya pone isAuthenticated = true,
    // pero lo dejamos por si quieres forzar algo extra aquí.
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    // onAuthStateChanged se encargará de poner isAuthenticated = false
  };

  if (checkingAuth) {
    // Pequeño loader mientras comprobamos si hay sesión previa
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Comprobando sesión...</span>
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-900">
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;
