
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Create from "@/pages/Create";
import Questions from "@/pages/Questions";
import AnswerPage from "@/pages/AnswerPage";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import RequireAuth from "@/components/auth/RequireAuth";
import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/create" 
            element={
              <RequireAuth>
                <Create />
              </RequireAuth>
            } 
          />
          <Route 
            path="/questions" 
            element={
              <RequireAuth>
                <Questions />
              </RequireAuth>
            } 
          />
          <Route 
            path="/answer" 
            element={
              <RequireAuth>
                <AnswerPage />
              </RequireAuth>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
