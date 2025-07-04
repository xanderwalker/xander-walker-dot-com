import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import Home from "@/pages/home";
import About from "@/pages/about";
import Portfolio from "@/pages/portfolio";
import Projects from "@/pages/projects";
import SensorDashboard from "@/pages/sensor-dashboard";
import GlassOfWater from "@/pages/glass-of-water";
import Balls333 from "@/pages/333-balls";
import Clock from "@/pages/clock";
import PixelClock from "@/pages/pixel-clock";
import Roulette from "@/pages/roulette";
import Camera from "@/pages/camera";
import SpotifyLyrics from "@/pages/spotify-lyrics";
import SpotifyApiTest from "@/pages/spotify-api-test";
import MonetPaint from "@/pages/monet-paint";
import AnalogClock from "@/pages/analog-clock";
import TrumpClock from "@/pages/trump-clock";
import SlotMachine from "@/pages/slot-machine";
import WindChimes from "@/pages/wind-chimes";
import TennisBallGun from "@/pages/tennis-ball-gun";
import CameraKaleidoscope from "@/pages/camera-kaleidoscope";
import CameraCollage from "@/pages/camera-collage";
import CameraHexagon from "@/pages/camera-hexagon";
import CameraSquares from "@/pages/camera-squares";
import CameraOptimal from "@/pages/camera-optimal";
import CameraOptimal80 from "@/pages/camera-optimal-80";
import CameraHexSquare from "@/pages/camera-hex-square";
import Cameras from "@/pages/cameras";
import KaleidoscopeGallery from "@/pages/kaleidoscope-gallery";
import Contact from "@/pages/contact";
import NotFound from "@/pages/not-found";

// Component to handle scroll restoration
function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/portfolio" component={Portfolio} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/sensor-dashboard" component={SensorDashboard} />
        <Route path="/projects/glass-of-water" component={GlassOfWater} />
        <Route path="/projects/333-balls" component={Balls333} />
        <Route path="/projects/clock" component={Clock} />
        <Route path="/projects/pixel-clock" component={PixelClock} />
        <Route path="/projects/roulette" component={Roulette} />
        <Route path="/projects/camera" component={Camera} />
        <Route path="/projects/spotify-lyrics" component={SpotifyLyrics} />
        <Route path="/projects/spotify-api-test" component={SpotifyApiTest} />
        <Route path="/projects/monet-paint" component={MonetPaint} />
        <Route path="/projects/analog-clock" component={AnalogClock} />
        <Route path="/projects/trump-clock" component={TrumpClock} />
        <Route path="/projects/camera-kaleidoscope" component={CameraKaleidoscope} />
        <Route path="/projects/camera-collage" component={CameraCollage} />
        <Route path="/projects/camera-hexagon" component={CameraHexagon} />
        <Route path="/projects/camera-squares" component={CameraSquares} />
        <Route path="/projects/camera-optimal" component={CameraOptimal} />
        <Route path="/projects/camera-optimal-80" component={CameraOptimal80} />
        <Route path="/projects/camera-hex-square" component={CameraHexSquare} />
        <Route path="/projects/cameras" component={Cameras} />
        <Route path="/projects/kaleidoscope-gallery" component={KaleidoscopeGallery} />
        <Route path="/projects/slot-machine" component={SlotMachine} />
        <Route path="/projects/wind-chimes" component={WindChimes} />
        <Route path="/projects/tennis-ball-gun" component={TennisBallGun} />
        <Route path="/contact" component={Contact} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="page-transition">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
