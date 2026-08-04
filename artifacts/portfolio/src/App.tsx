import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
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
import LandingPage from "@/pages/LandingPage";
import AdminLogin from "@/pages/AdminLogin";

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
  
  // /admin (no slug) — don't load any portfolio
  if (first === 'admin' && parts.length <= 1) {
    return null;
  }
  
  if (first === 'blogs') {
    return localStorage.getItem("portfolio_slug") || 'default';
  }
  
  // Landing page and explore don't need a portfolio slug
  if (!first || first === 'explore') return null;
  
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

function RedirectTo({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => { navigate(to); }, [to, navigate]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/login" component={LoginPage} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/admin" children={<RedirectTo to="/admin-login" />} />
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
