"use client";

import React from "react";
import Sidebar from "./Sidebar";
import "./SidebarLayout.css";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <div className="sidebar-layout">
      <Sidebar />
      <div className="main-content-with-sidebar">{children}</div>
    </div>
  );
}
