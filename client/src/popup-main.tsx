import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import PopupPage from "@/pages/popup";
import "./index.css";

const container = document.getElementById('extension-root');
if (!container) throw new Error('Failed to find the root element');

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PopupPage />
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);