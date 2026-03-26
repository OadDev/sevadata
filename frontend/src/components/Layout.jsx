import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import {
  House,
  ListDashes,
  UserCircle,
  SignOut,
  List,
  X,
  PawPrint
} from "@phosphor-icons/react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_e14815e9-182a-412c-afe6-1bef3f9a8c01/artifacts/vf48chjp_seva-logo-1.png";

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: House },
    { path: "/cases", label: "Cases", icon: ListDashes },
  ];

  if (isAdmin) {
    navItems.push({ path: "/users", label: "Users", icon: UserCircle });
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E7E5E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3" data-testid="header-logo">
              <img src={LOGO_URL} alt="SEVA Logo" className="h-10 w-10" />
              <div className="hidden sm:block">
                <h1 className="font-bold text-[#1B5E20] text-lg leading-tight" style={{ fontFamily: 'Manrope' }}>
                  SEVA SMS
                </h1>
                <p className="text-xs text-[#57534E]">Shelter Management</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive(item.path)
                      ? "bg-[#E8F5E9] text-[#1B5E20]"
                      : "text-[#57534E] hover:bg-[#F5F5F4] hover:text-[#1C1917]"
                  }`}
                >
                  <item.icon size={20} weight={isActive(item.path) ? "fill" : "regular"} />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-[#4CAF50] flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-[#57534E]">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                data-testid="logout-button"
                className="hidden md:flex items-center gap-2 px-3 py-2 text-[#57534E] hover:text-[#DC2626] hover:bg-red-50 rounded-lg transition-all"
              >
                <SignOut size={20} />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-[#57534E] hover:bg-[#F5F5F4] rounded-lg"
                data-testid="mobile-menu-button"
              >
                {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E7E5E4] bg-white">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                    isActive(item.path)
                      ? "bg-[#E8F5E9] text-[#1B5E20]"
                      : "text-[#57534E]"
                  }`}
                >
                  <item.icon size={22} weight={isActive(item.path) ? "fill" : "regular"} />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-[#DC2626] w-full"
              >
                <SignOut size={22} />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E7E5E4] z-40">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`bottom-nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center gap-1 px-4 py-2 ${
                isActive(item.path) ? "text-[#4CAF50]" : "text-[#78716C]"
              }`}
            >
              <item.icon size={24} weight={isActive(item.path) ? "fill" : "regular"} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-4 py-2 text-[#78716C]"
            data-testid="bottom-nav-logout"
          >
            <SignOut size={24} />
            <span className="text-xs font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16"></div>
    </div>
  );
};

export default Layout;
