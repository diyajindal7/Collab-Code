import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Dashboard from "../features/dashboard/pages/Dashboard";
import ProtectedRoute from "../components/common/ProtectedRoute";
import CreateRoom from "../features/rooms/pages/CreateRoom";
import JoinRoom from "../features/rooms/pages/JoinRoom";
import Room from "../features/rooms/pages/Room";

import { EditorProvider } from "@/features/editor/context/EditorContext";
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
  path="/create-room"
  element={
    <ProtectedRoute>
      <CreateRoom />
    </ProtectedRoute>
  }
/>

<Route
  path="/join-room"
  element={
    <ProtectedRoute>
      <JoinRoom />
    </ProtectedRoute>
  }
/>

<Route
  path="/room/:roomCode"
  element={
    <ProtectedRoute>
      <EditorProvider>
        <Room />
      </EditorProvider>
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}