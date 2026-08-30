import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import ListingDetail from "./pages/ListingDetail";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Publish from "./pages/Publish";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/connexion"} component={Auth} />
      <Route path={"/inscription"} component={Auth} />
      <Route path={"/profil"} component={Profile} />
      <Route path={"/publier"} component={Publish} />
      <Route path={"/annonces/:id"} component={ListingDetail} />
      <Route path={"/messages"} component={Messages} />
      <Route path={"/messages/:id"} component={Messages} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
