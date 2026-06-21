/**
 * Author: Yushan WANG (frontend entry and application bootstrap)
 * Collaborator: Zizhen WANG (integration and overall wiring)
 */

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/globals.css";
import { AuthProvider } from "./auth/AuthContext.tsx";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

  