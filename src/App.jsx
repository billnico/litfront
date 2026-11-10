import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Discover from "./pages/Discover";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Subscribe from "./pages/Subscribe";
import SubscribeCallback from "./pages/SubscribeCallback";
import SubscribeReturn from "./pages/SubscribeReturn";
import MockCheckout from "./pages/MockCheckout";
import Spinner from "./components/Spinner";

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner />
    </div>
  );
}

function PublicOnly() {
  const { user, booting } = useAuth();
  if (booting) return <Splash />;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}

function Protected() {
  const { user, booting } = useAuth();
  const loc = useLocation();
  if (booting) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  // University/college is mandatory ("none" is a valid value, empty is not).
  if (!user.university && loc.pathname !== "/profile") {
    return <Navigate to="/profile?complete=1" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<Protected />}>
        <Route element={<Layout />}>
          <Route index element={<Discover />} />
          <Route path="matches" element={<Matches />} />
          <Route path="messages" element={<Messages />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:matchId" element={<Chat />} />
          <Route path="profile" element={<Profile />} />
          <Route path="subscribe" element={<Subscribe />} />
          <Route path="subscribe/checkout" element={<MockCheckout />} />
          <Route path="subscribe/callback" element={<SubscribeCallback />} />
          <Route path="subscribe/return" element={<SubscribeReturn />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
