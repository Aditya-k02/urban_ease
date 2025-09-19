import React, { useEffect } from "react";
import {
  LayoutGrid,
  Users,
  UserCog,
  FileText,
  CreditCard,
  Tag,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSidebar } from "../../context/AdminSidebarContext";
import logoWhite from "../../imgs/logo_N_white.png";
import logoWhiteCollapsed from "../../imgs/logo_white.png";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function SidebarAdmin() {
  const {
    collapsed,
    toggleSidebar,
    activeTab,
    setActiveTab,
    hoveredItem,
    setHoveredItem,
  } = useSidebar();

  const { logout } = useAdminAuth();

  const navItems = [
    { icon: LayoutGrid, label: "Overview", path: "/admin/dashboard" },
    { icon: Users, label: "All Communities", path: "/admin/communities" },
    { icon: UserCog, label: "Managers", path: "/admin/managers" },
    { icon: FileText, label: "Applications", path: "/admin/applications" },
    { icon: CreditCard, label: "Billing", path: "/admin/payments" },
    { icon: Tag, label: "Subscription Plans", path: "/admin/subscription-plans" },
  ];

  const bottomItems = [
    { icon: User, label: "My Profile", path: "/admin/profile" },
    { icon: LogOut, label: "Sign Out", path: "__logout__" },
  ];

  
  useEffect(() => {
    const currentPath = window.location.pathname;
    setActiveTab(currentPath);
  }, [setActiveTab]);

  const navigate = useNavigate();

  const handleClick = async (path) => {
    if (path === "__logout__") {
      await logout();
      // Use replace so back button doesn't return to admin
      window.location.replace("/adminLogin");
      return;
    }
    setActiveTab(path);
    navigate(path);
  };

  const renderNavItem = (item, index) => {
    const isActive = activeTab === item.path;
    const isHovered = hoveredItem === item.path;
    const Icon = item.icon;

    return (
      <li key={index} style={{ position: "relative", margin: "6px 0" }}>
        <button
          onClick={() => handleClick(item.path)}
          onMouseEnter={() => setHoveredItem(item.path)}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? "0" : "12px",
            padding: collapsed ? "12px 0" : "12px 16px",
            background: isActive
              ? "rgba(59, 130, 246, 0.15)"
              : isHovered
                ? "rgba(255,255,255,0.05)"
                : "transparent",
            color: isActive ? "#ffffff" : "#cbd5e1",
            fontWeight: isActive ? 600 : 500,
            fontSize: "0.95rem",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isHovered && !isActive ? "translateX(4px)" : "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Active indicator bar */}
          {isActive && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "4px",
                height: "60%",
                background: "#3b82f6",
                borderRadius: "0 4px 4px 0",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          )}
          <Icon size={20} />
          {!collapsed && (
            <span
              style={{
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: collapsed ? 0 : 1,
                transform: collapsed ? "translateX(-10px)" : "translateX(0)",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          )}

          {/* Tooltip for collapsed sidebar */}
          {collapsed && isHovered && (
            <div
              style={{
                position: "absolute",
                left: "70px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#1e293b",
                color: "#ffffff",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                opacity: isHovered ? 1 : 0,
                transition:
                  "opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s",
                zIndex: 1000,
                pointerEvents: "none",
              }}
            >
              {item.label}
            </div>
          )}
        </button>
      </li>
    );
  };

  return (
    <aside
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        width: collapsed ? "80px" : "220px",
        height: "calc(100vh - 40px)",
        background: "#0f172a",
        color: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        transition:
          "width 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 1050,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header with Logo + Chevron */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Logo wrapper */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            flex: collapsed ? "0" : "1",
          }}
        >
          <img
            src={collapsed ? logoWhiteCollapsed : logoWhite}
            alt="Urban Ease Logo"
            style={{
              height: "34px", // slightly smaller for better alignment
              width: "auto",
              objectFit: "contain",
              display: "block",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: collapsed ? "scale(0.9)" : "scale(1)",
            }}
          />
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: collapsed ? "0" : "10px",
            transform: "translateY(4px)", // 👈 fine-tune alignment visually
            transition:
              "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin 0.3s ease",
          }}
        >
          {collapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
        </button>
      </div>


      {/* Main Navigation */}
      <div
        style={{
          flex: 1,
          padding: collapsed ? "12px 8px" : "16px 12px",
          transition: "padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {navItems.map((item, index) => renderNavItem(item, index))}
        </ul>
      </div>

      {/* Bottom Section */}
      <div
        style={{
          padding: collapsed ? "10px 8px" : "12px 12px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          transition: "padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowX: "hidden",
        }}
      >
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {bottomItems.map((item, index) => renderNavItem(item, index))}
        </ul>
      </div>
    </aside>
  );
}
