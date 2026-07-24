
// import React, { useState } from "react";
// import axios from "axios";
// import logo from "../components/assets/WhatsApp_Image_2026-06-29_at_4.39.27_PM-removebg-preview.png";
// import { useNavigate } from "react-router-dom";

// const Auth = () => {
//   const [isLogin, setIsLogin] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const [form, setForm] = useState({ name: "", email: "", password: "" });

//   const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.email || !form.password) return alert("Email aur Password zaroori hai");
//     if (!isLogin && !form.name) return alert("Name zaroori hai");

//     try {
//       setLoading(true);
//       const url = isLogin
//         ? "https://najah-1.onrender.com/api/admin/login"
//         : "https://najah-1.onrender.com/api/admin/register";

//       const res = await axios.post(url, form);

//       if (isLogin) {
//         localStorage.setItem("token", res.data.data.token);
//         navigate("/admin");
//       } else {
//         alert("Register Success");
//         setIsLogin(true);
//       }
//     } catch (err) {
//       alert(err.response?.data?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={styles.page}>
//       <div style={styles.card}>
//         {/* Logo Section */}
//         <div style={styles.logoContainer}>
//           <img src={logo} alt="Logo" style={styles.logo} />
//           <span style={styles.brandName}>NAJAH ACADMY</span>
//         </div>

//         {/* Tabs */}
//         <div style={styles.tabs}>
//           <div
//             onClick={() => setIsLogin(true)}
//             style={{ ...styles.tab, ...(isLogin ? styles.tabActive : {}) }}
//           >
//             Login
//           </div>
//           <div
//             onClick={() => setIsLogin(false)}
//             style={{ ...styles.tab, ...(!isLogin ? styles.tabActive : {}) }}
//           >
//             Register
//           </div>
//         </div>

//         <form onSubmit={handleSubmit}>
//           {!isLogin && (
//             <div style={styles.field}>
//               <label style={styles.label}>Full name</label>
//               <input
//                 name="name"
//                 type="text"
//                 placeholder="Your full name"
//                 onChange={handleChange}
//                 style={styles.input}
//               />
//             </div>
//           )}

//           <div style={styles.field}>
//             <label style={styles.label}>Email address</label>
//             <input
//               name="email"
//               type="email"
//               placeholder="admin@NAJAH ACADMY.com"
//               onChange={handleChange}
//               style={styles.input}
//             />
//           </div>

//           <div style={styles.field}>
//             <label style={styles.label}>Password</label>
//             <input
//               name="password"
//               type="password"
//               placeholder="Enter your password"
//               onChange={handleChange}
//               style={styles.input}
//             />
//           </div>

//           <button style={styles.btn} disabled={loading}>
//             {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
//           </button>
//         </form>

//         <div style={styles.divider}>
//           <div style={styles.line} />
//           <span style={styles.orText}>or</span>
//           <div style={styles.line} />
//         </div>

//         <p style={styles.toggle}>
//           {isLogin ? "Don't have an account? " : "Already have an account? "}
//           <span onClick={() => setIsLogin(!isLogin)} style={styles.toggleLink}>
//             {isLogin ? "Register here" : "Sign in"}
//           </span>
//         </p>
//       </div>
//     </div>
//   );
// };

// const styles = {
//   page: {
//     minHeight: "100vh",
//     background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: "20px",
//     fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
//   },
//   card: {
//     background: "rgba(255, 255, 255, 0.95)",
//     borderRadius: "20px",
//     width: "100%",
//     maxWidth: "400px",
//     padding: "40px 32px",
//     boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.2)",
//     transform: "perspective(1000px) rotateX(3deg) rotateY(1deg)",
//     transition: "all 0.3s ease",
//     backdropFilter: "blur(10px)",
//     border: "1px solid rgba(255,255,255,0.2)",
//   },
//   logoContainer: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: "12px",
//     marginBottom: "28px",
//   },
//   logo: {
//     width: "50px",
//     height: "50px",
//     objectFit: "contain",
//     filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
//     animation: "float 3s ease-in-out infinite",
//   },
//   brandName: {
//     fontSize: "24px",
//     fontWeight: "700",
//     background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//     WebkitBackgroundClip: "text",
//     WebkitTextFillColor: "transparent",
//     backgroundClip: "text",
//     letterSpacing: "-0.5px",
//   },
//   tabs: {
//     display: "flex",
//     background: "#f3f4f6",
//     borderRadius: "12px",
//     padding: "4px",
//     marginBottom: "24px",
//     boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
//   },
//   tab: {
//     flex: 1,
//     textAlign: "center",
//     padding: "10px 0",
//     fontSize: "14px",
//     fontWeight: "600",
//     cursor: "pointer",
//     borderRadius: "8px",
//     color: "#9ca3af",
//     transition: "all 0.3s ease",
//   },
//   tabActive: {
//     background: "#fff",
//     color: "#4338ca",
//     boxShadow: "0 4px 12px rgba(102,126,234,0.2)",
//     transform: "scale(1.02)",
//   },
//   field: {
//     marginBottom: "16px",
//   },
//   label: {
//     display: "block",
//     fontSize: "12px",
//     fontWeight: "600",
//     color: "#4a5568",
//     marginBottom: "6px",
//     letterSpacing: "0.03em",
//   },
//   input: {
//     width: "100%",
//     padding: "12px 14px",
//     border: "2px solid #e2e8f0",
//     borderRadius: "10px",
//     fontSize: "14px",
//     color: "#2d3748",
//     outline: "none",
//     background: "#f7fafc",
//     transition: "all 0.3s ease",
//     boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
//   },
//   btn: {
//     width: "100%",
//     padding: "12px 0",
//     background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//     color: "#fff",
//     border: "none",
//     borderRadius: "10px",
//     fontSize: "15px",
//     fontWeight: "600",
//     cursor: "pointer",
//     marginTop: "8px",
//     boxShadow: "0 4px 15px rgba(102,126,234,0.4)",
//     transition: "all 0.3s ease",
//     letterSpacing: "0.5px",
//   },
//   divider: {
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//     margin: "20px 0",
//   },
//   line: {
//     flex: 1,
//     height: "1px",
//     background: "linear-gradient(to right, transparent, #e2e8f0, transparent)",
//   },
//   orText: {
//     fontSize: "12px",
//     color: "#a0aec0",
//     fontWeight: "500",
//   },
//   toggle: {
//     textAlign: "center",
//     fontSize: "13px",
//     color: "#4a5568",
//     marginTop: "4px",
//   },
//   toggleLink: {
//     color: "#667eea",
//     cursor: "pointer",
//     fontWeight: "600",
//     transition: "all 0.3s ease",
//   },
// };

// // Add animations and hover effects
// const styleSheet = document.createElement("style");
// styleSheet.textContent = `
//   @keyframes float {
//     0% { transform: translateY(0px) rotate(0deg); }
//     50% { transform: translateY(-10px) rotate(3deg); }
//     100% { transform: translateY(0px) rotate(0deg); }
//   }

//   input:focus {
//     border-color: #667eea !important;
//     box-shadow: 0 0 0 3px rgba(102,126,234,0.1) !important;
//     background: #fff !important;
//   }

//   button:hover:not(:disabled) {
//     transform: translateY(-2px);
//     box-shadow: 0 6px 20px rgba(102,126,234,0.5) !important;
//   }

//   button:active:not(:disabled) {
//     transform: translateY(0px);
//   }

//   button:disabled {
//     opacity: 0.7;
//     cursor: not-allowed;
//   }

//   .tab:hover {
//     transform: scale(1.02);
//   }

//   .toggleLink:hover {
//     color: #764ba2;
//     text-decoration: underline;
//   }

//   @media (max-width: 480px) {
//     .card {
//       padding: 28px 20px !important;
//       transform: none !important;
//     }
//     .logo {
//       width: 40px !important;
//       height: 40px !important;
//     }
//     .brandName {
//       font-size: 20px !important;
//     }
//     .input {
//       padding: 10px 12px !important;
//       font-size: 13px !important;
//     }
//     .btn {
//       padding: 10px 0 !important;
//       font-size: 14px !important;
//     }
//   }

//   @media (max-width: 360px) {
//     .card {
//       padding: 20px 16px !important;
//     }
//     .tab {
//       font-size: 12px !important;
//       padding: 8px 0 !important;
//     }
//   }
// `;
// document.head.appendChild(styleSheet);

// export default Auth;


import React, { useState } from "react";
import axios from "axios";
import logo from "../components/assets/WhatsApp_Image_2026-06-29_at_4.39.27_PM-removebg-preview.png";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return alert("Email aur Password zaroori hai");

    try {
      setLoading(true);
      const url = "https://najah-1.onrender.com/api/admin/login";
      const res = await axios.post(url, form);

      if (res.data.data.token) {
        localStorage.setItem("token", res.data.data.token);
        navigate("/admin");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Left Side - Logo */}
        <div style={styles.leftSide}>
          <div style={styles.logoWrapper}>
            <img src={logo} alt="NAJAH ACADMY" style={styles.logo} />
            <h1 style={styles.brandName}>NAJAH ACADMY</h1>
            <p style={styles.tagline}>Welcome Back!</p>
            <p style={styles.subText}>Sign in to continue your learning journey</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div style={styles.rightSide}>
          <div style={styles.card}>
            <h2 style={styles.heading}>Login to Your Account</h2>
            <p style={styles.subheading}>Enter your credentials to access the admin panel</p>

            <form onSubmit={handleSubmit}>
              <div style={styles.field}>
                <label style={styles.label}>Email Address</label>
                <input
                  name="email"
                  type="email"
                  placeholder="admin@najahacadmy.com"
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <button style={styles.btn} disabled={loading}>
                {loading ? "Please wait..." : "Sign In"}
              </button>
            </form>

            <div style={styles.footer}>
              <p style={styles.footerText}>
                © 2026 NAJAH ACADMY. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fef9e7 0%, #fdebd0 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    display: "flex",
    width: "100%",
    maxWidth: "1100px",
    minHeight: "600px",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)",
    transform: "perspective(1000px) rotateX(2deg) rotateY(0.5deg)",
    transition: "all 0.3s ease",
  },
  leftSide: {
    flex: "1",
    background: "linear-gradient(135deg, #f1c40f 0%, #f39c12 50%, #e67e22 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    position: "relative",
    overflow: "hidden",
  },
  logoWrapper: {
    textAlign: "center",
    zIndex: 2,
    animation: "fadeInUp 0.8s ease-out",
  },
  logo: {
    width: "120px",
    height: "120px",
    objectFit: "contain",
    filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.2))",
    animation: "float 3s ease-in-out infinite",
    marginBottom: "20px",
  },
  brandName: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "10px",
    textShadow: "0 2px 8px rgba(0,0,0,0.2)",
    letterSpacing: "-0.5px",
  },
  tagline: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "8px",
    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  subText: {
    fontSize: "16px",
    color: "rgba(255,255,255,0.9)",
    fontWeight: "400",
  },
  rightSide: {
    flex: "1",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
  },
  heading: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: "8px",
  },
  subheading: {
    fontSize: "14px",
    color: "#7f8c8d",
    marginBottom: "32px",
    fontWeight: "400",
  },
  field: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#34495e",
    marginBottom: "6px",
    letterSpacing: "0.03em",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #ecf0f1",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#2c3e50",
    outline: "none",
    background: "#fafbfc",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
  },
  btn: {
    width: "100%",
    padding: "14px 0",
    background: "linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 4px 15px rgba(243, 156, 18, 0.4)",
    transition: "all 0.3s ease",
    letterSpacing: "0.5px",
  },
  footer: {
    marginTop: "32px",
    textAlign: "center",
  },
  footerText: {
    fontSize: "12px",
    color: "#95a5a6",
    fontWeight: "400",
  },
};

// Add animations and hover effects
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes float {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(2deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  input:focus {
    border-color: #f39c12 !important;
    box-shadow: 0 0 0 3px rgba(243, 156, 18, 0.1) !important;
    background: #ffffff !important;
  }

  button:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 6px 25px rgba(243, 156, 18, 0.5) !important;
  }

  button:active:not(:disabled) {
    transform: translateY(0px);
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 968px) {
    .container {
      flex-direction: column;
      max-width: 500px;
      transform: none !important;
    }
    .leftSide {
      padding: 30px 20px;
      min-height: 200px;
    }
    .logo {
      width: 80px !important;
      height: 80px !important;
    }
    .brandName {
      font-size: 28px !important;
    }
    .tagline {
      font-size: 22px !important;
    }
    .subText {
      font-size: 14px !important;
    }
    .rightSide {
      padding: 30px 20px;
    }
    .heading {
      font-size: 24px !important;
    }
  }

  @media (max-width: 480px) {
    .page {
      padding: 10px !important;
    }
    .container {
      border-radius: 16px !important;
    }
    .leftSide {
      padding: 20px 15px !important;
      min-height: 150px !important;
    }
    .logo {
      width: 60px !important;
      height: 60px !important;
      margin-bottom: 12px !important;
    }
    .brandName {
      font-size: 22px !important;
    }
    .tagline {
      font-size: 18px !important;
    }
    .subText {
      font-size: 12px !important;
    }
    .rightSide {
      padding: 20px 16px !important;
    }
    .heading {
      font-size: 20px !important;
    }
    .subheading {
      font-size: 13px !important;
      margin-bottom: 24px !important;
    }
    .input {
      padding: 10px 14px !important;
      font-size: 13px !important;
    }
    .btn {
      padding: 12px 0 !important;
      font-size: 14px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Auth;  