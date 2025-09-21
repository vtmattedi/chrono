import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "leaflet/dist/leaflet.css";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router-dom";
import { GlobalProvider } from './Providers/Globals.tsx';
import { AlertProvider } from './Providers/Alerts.tsx';
import  Teams  from './Pages/Teams.tsx';
import { Toaster } from "@/components/ui/sonner"
import Chrono from './Pages/Chrono.tsx';
import Layout from './Layout.tsx';
import { TimerProvider } from './Providers/Timer.tsx';
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout><Teams /></Layout>,
  },
  {
    path: "/chrono",
    element: <Layout><Chrono /></Layout>,
  }

]);
createRoot(document.getElementById('root')!).render(

    <AlertProvider>
      <GlobalProvider>
        <TimerProvider>
          <RouterProvider router={router} />
          <Toaster  richColors/>
        </TimerProvider>
      </GlobalProvider>
    </AlertProvider>

)
