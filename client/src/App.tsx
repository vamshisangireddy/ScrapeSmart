import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PopupPage from "@/pages/popup";
import DemoPage from "@/pages/demo";
import RealScraperPage from "@/pages/real-scraper";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={RealScraperPage} />
      <Route path="/popup" component={PopupPage} />
      <Route path="/demo" component={DemoPage} />
      <Route path="/scraper" component={RealScraperPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
