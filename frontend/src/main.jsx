import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* every component in the app will have access to the theme and auth context */}
    <ThemeProvider> {/* theme context provider from context/ThemeContext.jsx */}
      <AuthProvider> {/* auth context provider from context/AuthContext.jsx */}
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
