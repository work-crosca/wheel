import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./styles/base.css";
import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);
registerSW({ immediate: true });

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
