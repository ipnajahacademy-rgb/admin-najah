import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Users from "./Users";
import CategoryManager from "./CategoryManager";
import CreateCourse from "./CreateCourse";
import SectionManager from "./SectionManager";
import BannersOperations from "../components/Banner/BannersOperations";
import LiveClassesOperations from "../components/LiveClass/LiveClassesOperations";
import PaymentHistoryOperations from "../components/Payment/PaymentHistoryOperations";
import ExamQuestionsOperations from "../components/Exam/ExamQuestionsOperations";
import Questions from "../components/Exam/Question";
import ExamAttemptOperations from "../components/Exam/Attempts";
import ExamPurchaseOperations from "../components/Exam/ExamPurchase";
import AllTeacher from "../components/Teacher/AllTeachers";
import AllAttendance from "../components/Teacher/Attendence";
import TeacherLeaves from "../components/Teacher/TeacherLeaves";
import AdminDashboard from "../components/Dashboard/AdminDashboard";
import MaintenanceConfig from "../components/Mantaince/MaintenanceConfig";
import CreateNotification from "../components/Notification/Notification";

// Placeholder components for nested sub-items.
// Replace these with real imports once you build the actual pages,
// e.g. import TeacherAttendance from "./TeacherAttendance";
const PlaceholderPage = ({ title }) => (
  <div style={{ padding: "40px", textAlign: "center", color: "#95a5a6" }}>
    <h2 style={{ color: "#2c3e50", marginBottom: "8px" }}>{title}</h2>
    <p>This section is under construction.</p>
  </div>
);

const AdminLayout = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedMenu, setExpandedMenu] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [navigate]);


  useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth <= 768);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

  const handleLogout = () => {
    localStorage.clear(); // or localStorage.removeItem("token") if you keep other keys
    navigate("/", { replace: true }); // replace so logout can't be undone with back button
  };

  const navItems = [
    { label: "Dashboard", icon: "📊", color: "#f39c12" },
    { label: "Courses", icon: "📚", color: "#3498db" },
    { label: "Maintenance", icon: "🔧", color: "#3498db" },
    { label: "Notifications", icon: "👨‍🏫", color: "#e67e22" },
    { label: "Users", icon: "👥", color: "#2ecc71" },
    { label: "Categories", icon: "📂", color: "#9b59b6" },
    { label: "Sections", icon: "📝", color: "#e67e22" },
    {
  label: "Teacher",
  icon: "👨‍🏫",
  color: "#e67e22",
  subItems: ["All Teachers", "Teacher Attendance", "Leave Status"],
},
{
  label: "Exam",
  icon: "📝",
  color: "#e67e22",
  subItems: ["All Exams", "Exam Attempt", "Exam Purchase", "Exam Questions"],
},
{
  label: "Payment",
  icon: "💳",
  color: "#e67e22",
  subItems: ["Payment History"],
}, //
{
  label: "Banner",
  icon: "🖼️",
  color: "#e67e22",
  subItems: ["Get All Banners"],
}, // Done
{
  label: "LiveClasses",
  icon: "🎥",
  color: "#e67e22",
  subItems: ["Get All Live Classes"],
},
    // { label: "Settings", icon: "⚙️", color: "#95a5a6" },
  ];

  const handleNavClick = (item) => {
    if (item.subItems) {
      setExpandedMenu(expandedMenu === item.label ? null : item.label);
    } else {
      setActive(item.label);
      setExpandedMenu(null);
      if (isMobile) setSidebarOpen(false);
    }
  };

  const handleSubItemClick = (subLabel) => {
    setActive(subLabel);
    if (isMobile) setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (active) {
      case "Users":
        return <Users />;
      case "Categories":
        return <CategoryManager />;
      case "Courses":
        return <CreateCourse />;
      case "Maintenance":
        return <MaintenanceConfig />;
        case "Notifications":
        return <CreateNotification />;
      case "Sections":
        return <SectionManager />;

      // Teacher
      case "All Teachers":
        return <AllTeacher />;
      case "Teacher Attendance":
        return <AllAttendance />;
      case "Leave Status":
        return <TeacherLeaves />;

      // Exam
      case "All Exams":
        return <ExamQuestionsOperations/>;
      case "Exam Attempt":
        return <ExamAttemptOperations/>;
      case "Exam Purchase":
        return <ExamPurchaseOperations />;
      case "Exam Questions":
        return <Questions />;

      // Payment
      case "Payment History":
        return <PaymentHistoryOperations />;

      // Banner
      case "Get All Banners":
        return <BannersOperations />;
      // case "Create Banner":
      //   return <PlaceholderPage title="Create Banner" />;
      // case "Update Banner":
      //   return <PlaceholderPage title="Update Banner" />;
      // case "Delete Banner":
      //   return <PlaceholderPage title="Delete Banner" />;

      // LiveClasses
      case "Get All Live Classes":
        return <LiveClassesOperations/>;

      default:
        return (
          <div style={styles.dashboard}>
            <div style={styles.dashHeader}>
              <div>
                <h2 style={styles.dashTitle}>Welcome to Admin Dashboard</h2>
                <p style={styles.dashSub}>Select an option from the sidebar to manage your content</p>
              </div>
              <div style={styles.dashDate}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            <AdminDashboard/>

            <div style={styles.quickActions}>
              <h3 style={styles.quickTitle}>Quick Actions</h3>
              <div style={styles.quickGrid}>
                <div style={styles.quickCard} onClick={() => setActive("Courses")}>
                  <span style={styles.quickIcon}>➕</span>
                  <p>Add New Course</p>
                </div>
                <div style={styles.quickCard} onClick={() => setActive("Users")}>
                  <span style={styles.quickIcon}>👤</span>
                  <p>Manage Users</p>
                </div>
                <div style={styles.quickCard} onClick={() => setActive("Categories")}>
                  <span style={styles.quickIcon}>📁</span>
                  <p>Add Category</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Sidebar Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside style={{
        ...styles.sidebar,
        ...(isMobile && styles.sidebarMobile),
        ...(!sidebarOpen && styles.sidebarClosed)
      }}>
        <div style={styles.sbTop}>
          <div style={styles.logo}>
            <span style={styles.logoEmoji}>🏫</span>
          </div>
          <div>
            <div style={styles.brand}>NAJAH ACADMY</div>
            <div style={styles.subBrand}>Admin Portal</div>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={styles.closeBtn}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          )}
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const hasSubItems = !!item.subItems;
            const isExpanded = expandedMenu === item.label;
            const isParentActive =
              active === item.label ||
              (hasSubItems && item.subItems.includes(active));

            return (
              <div key={item.label}>
                <div
                  onClick={() => handleNavClick(item)}
                  style={{
                    ...styles.navItem,
                    ...(isParentActive ? styles.navActive : {}),
                  }}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  <span style={styles.navLabel}>{item.label}</span>
                  {hasSubItems && (
                    <span
                      style={{
                        ...styles.chevron,
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      ▾
                    </span>
                  )}
                  {isParentActive && !hasSubItems && (
                    <span style={styles.navIndicator}></span>
                  )}
                </div>

                {hasSubItems && (
                  <div
                    style={{
                      ...styles.subMenu,
                      maxHeight: isExpanded ? `${item.subItems.length * 44}px` : "0px",
                    }}
                  >
                    {item.subItems.map((sub) => (
                      <div
                        key={sub}
                        onClick={() => handleSubItemClick(sub)}
                        style={{
                          ...styles.subItem,
                          ...(active === sub ? styles.subItemActive : {}),
                        }}
                      >
                        <span style={styles.subDot}></span>
                        <span>{sub}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div style={styles.sbFoot}>
          <div style={styles.userRow}>
            <div style={styles.avatar}>
              <span style={styles.avatarText}>AD</span>
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>Admin</div>
              <div style={styles.userRole}>Super Admin</div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              <span style={styles.logoutIcon}>🚪</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Topbar */}
        <header style={styles.topbar}>
          {isMobile && (
  <button
    onClick={() => setSidebarOpen(!sidebarOpen)}
    style={styles.hamburger}
    aria-label="Toggle sidebar"
  >
    {sidebarOpen ? (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    ) : (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    )}
  </button>
)}

          <div style={styles.topLeft}>
            <span style={styles.topTitle}>{active}</span>
            <span style={styles.topBadge}>Active</span>
          </div>

          <div style={styles.topRight}>
            <span style={styles.topDate}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <div style={styles.topAvatar}>A</div>
          </div>
           <button onClick={handleLogout} className="px-2  py-2 bg-red-100 rounded text-red-600" >
              Logout
            </button>
        </header>



        <main style={styles.content}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    background: "#f0f2f5",
    overflow: "hidden",
  },

  // Sidebar
  sidebar: {
    width: "260px",
    background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
    borderRight: "1px solid #e8ecf1",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
    zIndex: 1000,
    position: "relative",
  },
  sidebarMobile: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    width: "280px",
    zIndex: 1001,
    boxShadow: "0 0 40px rgba(0,0,0,0.15)",
  },
  sidebarClosed: {
    transform: "translateX(-100%)",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(3px)",
    zIndex: 1000,
    animation: "fadeIn 0.3s ease",
  },
  sbTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "24px 20px",
    borderBottom: "1px solid #e8ecf1",
    position: "relative",
  },
  logo: {
    width: "44px",
    height: "44px",
    background: "linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(243, 156, 18, 0.25)",
  },
  logoEmoji: {
    fontSize: "22px",
  },
  brand: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#2c3e50",
    letterSpacing: "-0.3px",
  },
  subBrand: {
    fontSize: "11px",
    color: "#95a5a6",
    marginTop: "2px",
    fontWeight: "500",
  },
  closeBtn: {
    position: "absolute",
    right: "12px",
    top: "12px",
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#95a5a6",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
  },

  // Nav
  nav: {
    flex: 1,
    padding: "16px 12px",
    overflowY: "auto",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#5a6a7a",
    transition: "all 0.2s ease",
    marginBottom: "4px",
    position: "relative",
  },
  navIcon: {
    fontSize: "18px",
    width: "24px",
  },
  navLabel: {
    flex: 1,
  },
  navIndicator: {
    width: "4px",
    height: "24px",
    background: "linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)",
    borderRadius: "2px",
  },
  navActive: {
    background: "linear-gradient(135deg, #fef9e7 0%, #fdebd0 100%)",
    color: "#e67e22",
    boxShadow: "0 2px 8px rgba(243, 156, 18, 0.08)",
    fontWeight: "600",
  },
  chevron: {
    fontSize: "12px",
    transition: "transform 0.25s ease",
    marginLeft: "4px",
  },

  // Sub menu (nested dropdown)
  subMenu: {
    overflow: "hidden",
    transition: "max-height 0.3s ease",
    marginLeft: "20px",
    borderLeft: "2px solid #f0f2f5",
    paddingLeft: "8px",
  },
  subItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    color: "#7f8c8d",
    transition: "all 0.2s ease",
    marginBottom: "2px",
  },
  subItemActive: {
    background: "#fef9e7",
    color: "#e67e22",
    fontWeight: "600",
  },
  subDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "currentColor",
    flexShrink: 0,
  },

  // Sidebar Footer
  sbFoot: {
    padding: "16px 12px",
    borderTop: "1px solid #e8ecf1",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    borderRadius: "10px",
    background: "#f8f9fa",
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#2c3e50",
  },
  userRole: {
    fontSize: "10px",
    color: "#95a5a6",
    fontWeight: "500",
  },
  logoutBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIcon: {
    fontSize: "18px",
  },

  // Main
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#f0f2f5",
    overflow: "hidden",
  },

  // Topbar
  topbar: {
    height: "64px",
    background: "#ffffff",
    borderBottom: "1px solid #e8ecf1",
    display: "flex",
    alignItems: "center",
    padding: "0 24px",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  },
  hamburger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "10px",
    transition: "all 0.2s ease",
    flexShrink: 0,
    color: "#5a6a7a",
  },
  topLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
  },
  topTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#2c3e50",
  },
  topBadge: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#2ecc71",
    background: "#eafaf1",
    padding: "2px 10px",
    borderRadius: "20px",
    letterSpacing: "0.3px",
  },
  topRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  topDate: {
    fontSize: "13px",
    color: "#95a5a6",
    fontWeight: "500",
  },
  topAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
  },

  // Content
  content: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    background: "#f0f2f5",
  },

  // Dashboard
  dashboard: {
    padding: "4px 0",
  },
  dashHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "12px",
  },
  dashTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: "4px",
  },
  dashSub: {
    fontSize: "15px",
    color: "#7f8c8d",
    fontWeight: "400",
  },
  dashDate: {
    fontSize: "14px",
    color: "#95a5a6",
    fontWeight: "500",
    background: "#fff",
    padding: "8px 16px",
    borderRadius: "10px",
    border: "1px solid #e8ecf1",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  statCard: {
    background: "#ffffff",
    padding: "24px 20px",
    borderRadius: "14px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #e8ecf1",
    transition: "all 0.3s ease",
  },
  statIcon: {
    fontSize: "32px",
    display: "block",
    marginBottom: "8px",
  },
  statNumber: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#95a5a6",
    fontWeight: "500",
    margin: 0,
  },
  quickActions: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "14px",
    border: "1px solid #e8ecf1",
  },
  quickTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "16px",
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
  },
  quickCard: {
    padding: "16px",
    borderRadius: "10px",
    background: "#f8f9fa",
    border: "1px solid #e8ecf1",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  quickIcon: {
    fontSize: "24px",
    display: "block",
    marginBottom: "6px",
  },
};

// Add animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .navItem:hover {
    background: #f8f9fa;
    transform: translateX(4px);
  }

  .navActive:hover {
    background: linear-gradient(135deg, #fef9e7 0%, #fdebd0 100%) !important;
  }

  .statCard:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    border-color: #f39c12;
  }

  .quickCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    border-color: #f39c12;
    background: #fef9e7;
  }

  .logoutBtn:hover {
    background: #fee2e2;
    transform: scale(1.05);
  }

  .hamburger:hover {
    background: #f0f2f5;
  }

  .closeBtn:hover {
    background: #f0f2f5;
    color: #2c3e50;
  }

  @media (max-width: 768px) {
    .topbar {
      padding: 0 16px !important;
    }
    .content {
      padding: 16px !important;
    }
    .topTitle {
      font-size: 16px !important;
    }
    .topDate {
      font-size: 11px !important;
    }
    .dashTitle {
      font-size: 22px !important;
    }
    .statsGrid {
      grid-template-columns: 1fr 1fr !important;
    }
    .quickGrid {
      grid-template-columns: 1fr !important;
    }
    .dashHeader {
      flex-direction: column !important;
    }
  }

  @media (max-width: 480px) {
    .topbar {
      height: 56px !important;
      padding: 0 12px !important;
    }
    .content {
      padding: 12px !important;
    }
    .hamburger {
      width: 36px !important;
      height: 36px !important;
    }
    .topTitle {
      font-size: 14px !important;
    }
    .sidebarMobile {
      width: 260px !important;
    }
    .sbTop {
      padding: 16px !important;
    }
    .brand {
      font-size: 14px !important;
    }
    .statsGrid {
      grid-template-columns: 1fr !important;
    }
    .dashTitle {
      font-size: 20px !important;
    }
    .statNumber {
      font-size: 22px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default AdminLayout;