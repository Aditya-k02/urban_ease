import React from "react";
import SidebarAdmin from "../partials/SidebarAdmin";
import { Outlet } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { SidebarProvider, useSidebar } from "../../context/AdminSidebarContext";
import styles from "./AdminLayout.module.css";

function AdminLayoutContent() {
  const { collapsed } = useSidebar();

  return (
    <div className={styles.layout}>
      <SidebarAdmin />
      <div className={`${styles.main} ${collapsed ? styles.collapsed : styles.expanded}`}>
        <main className={styles.contentWrapper}>
          <div className={`${styles.transparentCard} ${collapsed ? styles.collapsed : ''}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminLayoutContent />
    </SidebarProvider>
  );
}
