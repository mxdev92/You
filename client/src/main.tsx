import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { initializeLanguage } from "./hooks/use-language.ts";
import "./index.css";

// Initialize language settings
initializeLanguage();

const queryClient = new QueryClient();

// App version for cache busting - UPDATE THIS WHEN DEPLOYING
const APP_VERSION = "2.4.0-stable-fix"; // Fixed infinite reload loop issue

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
