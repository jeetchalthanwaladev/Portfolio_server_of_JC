import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/base.css";
import "./styles/header.css";
import "./styles/hero.css";
import "./styles/sections.css";
import "./styles/profile.css";
import "./styles/responsive.css";
import "./styles/ambient-code-background.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
