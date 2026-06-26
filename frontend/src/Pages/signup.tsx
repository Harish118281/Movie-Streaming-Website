import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./signup-login.css";
import { ArrowLeft } from "lucide-react"

export default function Signup() {
  const navigate = useNavigate();

  const [username,setUsername] =
    useState("");

  const [email,setEmail] =
    useState("");

  const [password,setPassword] =
    useState("");

  const [message,setMessage] =
    useState("");

  const [messageType,setMessageType] =
    useState<"error" | "success" | "">("");

  const passwordChecks = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    minLength: password.length >= 8,
  };

  const isStrongPassword =
    Object.values(passwordChecks).every(Boolean);

  const signup = async () => {
    setMessage("");
    setMessageType("");

    const isUsernameMissing =
      username.trim().length === 0;
    const isEmailMissing =
      email.trim().length === 0;
    const isPasswordMissing =
      password.length === 0;

    if (
      isUsernameMissing ||
      isEmailMissing ||
      isPasswordMissing
    ) {
      const missingMessages = [
        isUsernameMissing
          ? "Enter your Username first."
          : "",
        isEmailMissing
          ? "Enter your Email ID first."
          : "",
        isPasswordMissing
          ? "Enter your Password first."
          : "",
      ].filter(Boolean);

      const allFieldsMissing =
        isUsernameMissing &&
        isEmailMissing &&
        isPasswordMissing;

      setMessage(
        missingMessages
          .map((missingMessage) =>
            allFieldsMissing
              ? missingMessage
              : `\u274C ${missingMessage}`
          )
          .join("\n")
      );
      setMessageType("error");
      return;
    }

    if (!isStrongPassword) {
      setMessage("❌ Password is weak");
      setMessageType("error");
      return;
    }

    try {
      const response =
        await fetch(
          "http://localhost:5000/api/auth/signup",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              username,
              email,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        const errorMessage =
          data.message || "";

        setMessage(
          errorMessage.includes("registered") ||
            errorMessage.includes("exists")
            ? "❌ This email is already registered."
            : `❌ ${errorMessage || "Signup failed."}`
        );
        setMessageType("error");
        return;
      }

      if (data.token) {
        localStorage.setItem(
          "token",
          data.token
        );
      }

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

      setMessage(
        "✅ Account created successfully.\nRedirecting to Home..."
      );
      setMessageType("success");

      window.setTimeout(() => {
        navigate("/home");
      }, 1200);
    } catch {
      setMessage(
        "❌ Signup failed. Please try again."
      );
      setMessageType("error");
    }
  };

  return (
    <div className="auth-page">

      <button className="back-btn" onClick={() => navigate("/", {replace : true})}>
        <ArrowLeft size={24} />
      </button>
      <h1>Sign Up</h1>

      <input
        placeholder="Username"
        value={username}
        onChange={(e)=>
          setUsername(e.target.value)
        }
      />

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

      {password && (
        <div className="password-status">
          {isStrongPassword ? (
            <p className="auth-success">
              🟢 Strong Password
            </p>
          ) : (
            <>
              <p className="auth-error">
                ❌ Password is weak
              </p>
              <p>Must contain:</p>
              <ul>
                <li className={passwordChecks.lowercase ? "valid" : "invalid"}>
                  {passwordChecks.lowercase ? "✔" : "✖"} Lowercase
                </li>
                <li className={passwordChecks.uppercase ? "valid" : "invalid"}>
                  {passwordChecks.uppercase ? "✔" : "✖"} Uppercase
                </li>
                <li className={passwordChecks.number ? "valid" : "invalid"}>
                  {passwordChecks.number ? "✔" : "✖"} Number
                </li>
                <li className={passwordChecks.special ? "valid" : "invalid"}>
                  {passwordChecks.special ? "✔" : "✖"} Special Character
                </li>
                <li className={passwordChecks.minLength ? "valid" : "invalid"}>
                  {passwordChecks.minLength ? "✔" : "✖"} Minimum 8 characters
                </li>
              </ul>
            </>
          )}
        </div>
      )}

      {message && (
        <div className={`auth-message ${messageType}`}>
          {message}
        </div>
      )}

      <button className="signup-btn" onClick={signup}>
        Sign Up
      </button>

      <p className="auth-switch">
        Already have an account?{" "}
        <Link to="/login" >
          Login
        </Link>
      </p>
    </div>
  );
}
