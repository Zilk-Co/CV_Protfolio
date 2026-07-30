import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Portfolio from "@/pages/portfolio";
import BlogsPage from "@/pages/blogs";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import CreateClientForm from "@/pages/CreateClientForm";
import ClientManagement from "@/pages/ClientManagement";
import ExplorePage from "@/pages/Explore";

import { setPortfolioSlugGetter, setPortfolioPasswordGetter } from "@workspace/api-client-react";

// Dynamically extract slug from the URL for API requests
setPortfolioSlugGetter(() => {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const first = parts.length > 0 ? parts[0] : 'default';
  
  // Admin management routes — no portfolio context needed
  if (first === 'admin' && parts.length > 1) {
    const sub = parts[1];
    if (sub === 'clients' || sub === 'create') return null;
    return sub; // /admin/:slug — slug is the second segment
  }
  
  // /admin (no slug) — fallback to localStorage
  if (first === 'admin') {
    return localStorage.getItem("portfolio_slug") || 'default';
  }
  
  if (first === 'blogs') {
    return localStorage.getItem("portfolio_slug") || 'default';
  }
  
  return first === 'login' ? null : first;
});

setPortfolioPasswordGetter(() => {
  // Prefer JWT token over password
  return localStorage.getItem("portfolio_token") || localStorage.getItem("portfolio_password") || null;
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Portfolio} />
      <Route path="/login" component={LoginPage} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/admin" component={Portfolio} />
      <Route path="/admin/clients" component={ClientManagement} />
      <Route path="/admin/create" component={CreateClientForm} />
      <Route path="/admin/:slug" component={Portfolio} />
      {/* Blog routes MUST come before /:slug to take precedence */}
      <Route path="/blogs" component={BlogsPage} />
      <Route path="/:slug/blogs" component={BlogsPage} />
      <Route path="/:slug" component={Portfolio} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
