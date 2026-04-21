import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout() {
  return (
    <div className="page-shell">
      <div className="app-layout">
        <Sidebar />
        <main className="main-area">
          <Header />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
