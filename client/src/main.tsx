import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {" "}
    {/* <--- 2. ENVOLVER LA APP AQUÍ */}
    <App />
  </React.StrictMode>,
);
