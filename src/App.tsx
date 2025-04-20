import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import NavBar from "@/components/NavBar";
import Index from "./pages/Index";
import Create from "./pages/Create";
import Questions from "./pages/Questions";
import AnswerPage from "./pages/AnswerPage";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Behavioral from "./pages/Behavioral";
import BehavioralInterview from "./pages/BehavioralInterview";
import CreateBehavioral from "./pages/CreateBehavioral";
import BehavioralFeedback from "./pages/BehavioralFeedback";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<><NavBar /><Index /></>} />
            <Route path="/create" element={<><NavBar /><Create /></>} />
            <Route path="/questions" element={<><NavBar /><Questions /></>} />
            <Route path="/answer" element={<><NavBar /><AnswerPage /></>} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/behavioral" element={<Behavioral />} />
            <Route path="/behavioral/create" element={<CreateBehavioral />} />
            <Route path="/behavioral/interview" element={<BehavioralInterview />} />
            <Route path="/behavioral/all" element={<Behavioral />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/behavioral/feedback" element={<BehavioralFeedback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
