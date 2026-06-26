import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./signup-login.css";
import { ArrowLeft } from "lucide-react"

export default function Login() {
  const navigate = useNavigate();

  const [email,setEmail] =
    useState("");

  const [password,setPassword] =
    useState("");

  const [message,setMessage] =
    useState("");

  const [messageType,setMessageType] =
    useState<"error" | "success" | "">("");

  const [showSignupLink,setShowSignupLink] =
    useState(false);

  const login = async () => {
    setMessage("");
    setMessageType("");
    setShowSignupLink(false);

    const isEmailMissing =
      email.trim().length === 0;
    const isPasswordMissing =
      password.length === 0;

    if (
      isEmailMissing ||
      isPasswordMissing
    ) {
      setMessage(
        [
          isEmailMissing
            ? "\u274C Enter your Email ID first."
            : "",
          isPasswordMissing
            ? "\u274C Enter your Password first."
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      );
      setMessageType("error");
      return;
    }

    try {
      const response =
        await fetch(
          "http://localhost:5000/api/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        const normalizedMessage =
          data.message || "";

        if (
          normalizedMessage.includes("Email") ||
          normalizedMessage.includes("email")
        ) {
          setMessage("❌ Email not registered.");
          setShowSignupLink(true);
        } else {
          setMessage("❌ Incorrect password.");
        }

        setMessageType("error");
        return;
      }

      localStorage.setItem(
        "token",
        data.token
      );

      if (data.user) {
        localStorage.setItem(
          "movieflix_user",
          JSON.stringify({
            ...data.user,
            memberSince:
              data.user.created_at ||
              new Date().toISOString(),
          })
        );
      }

      setMessage("✅ Login successful.");
      setMessageType("success");
      navigate("/home");
    } catch {
      setMessage(
        "❌ Login failed. Please try again."
      );
      setMessageType("error");
    }
  };

  return (
    <div className="auth-page">
      <button className="back-btn" onClick={() => navigate("/", {replace : true})}>
        <ArrowLeft size={24} />
      </button>
      <h1>Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e)=>
          setEmail(e.target.value)
        }
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e)=>
          setPassword(e.target.value)
        }
      />

      {message && (
        <div className={`auth-message ${messageType}`}>
          {message}
        </div>
      )}

      {showSignupLink && (
        <p className="auth-switch">
          <Link to="/signup">
            Create a new account
          </Link>
        </p>
      )}

      <button className="login-btn" onClick={login}>
        Login
      </button>

      <p className="auth-switch">
        New to MovieFlix?{" "}
        <Link to="/signup">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
