import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { DataProvider } from "./data";
import { FarmProvider } from "./farm";
import { LanguageProvider } from "./language";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <DataProvider>
        <FarmProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </FarmProvider>
      </DataProvider>
    </BrowserRouter>
  </React.StrictMode>
);
