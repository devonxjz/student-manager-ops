import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './index.css';

// Data router (cần cho useBlocker ở trang nhập điểm); các route chi tiết khai báo trong App.jsx
const router = createBrowserRouter([{ path: '*', element: <App /> }], {
  future: { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <TooltipProvider delayDuration={200}>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  </React.StrictMode>,
);
