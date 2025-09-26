
import { createRoot } from 'react-dom/client'
import './index.css'
import "leaflet/dist/leaflet.css";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router-dom";
import { GlobalProvider } from './Providers/Globals.tsx';
import { AlertProvider } from './Providers/Alerts.tsx';
import CreateChrono from './Pages/Create.tsx';
import { Toaster } from "@/components/ui/sonner"
import Chrono from './Pages/Chrono.tsx';
import Layout from './Layout.tsx';
import { TimerProvider } from './Providers/Timer.tsx';
import { SocketProvider } from './Providers/Socket.tsx';
import ChronoSession from './Pages/Session.tsx';
import Home from './Pages/Home.tsx';
import Admin from './Pages/admin.tsx';
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout><Home /></Layout>,
  },
  {
    path: "/createchrono",
    element: <Layout><CreateChrono /></Layout>,
  },
  {
    path: "/chrono",
    element: <Layout><Chrono /></Layout>,
  }, {
    path: "/session",
    element: <Layout><ChronoSession /></Layout>,
  }, {
    path: "/admin",
    element: <Layout><Admin /></Layout>,
  },
  {
    path: "*",
    element: <Layout><Home /></Layout>,
  }
  

]);
createRoot(document.getElementById('root')!).render(

  <AlertProvider>
    <GlobalProvider>
      <TimerProvider>
        <SocketProvider>
          <RouterProvider router={router} />
          <Toaster richColors closeButton/>
        </SocketProvider>
      </TimerProvider>
    </GlobalProvider>
  </AlertProvider>

)
