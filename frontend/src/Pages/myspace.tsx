import { CalendarDays, Mail, Pencil, ShieldCheck, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Components/header/header";
import "./page.css";

type StoredProfile = {
  username?: string;
  email?: string;
  created_at?: string;
  memberSince?: string;
};

const readStoredProfile = (): StoredProfile => {
  try {
    return JSON.parse(localStorage.getItem("movieflix_user") || "{}") as StoredProfile;
  } catch {
    return {};
  }
};

const splitDisplayName = (username: string) => {
  return username
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
};

const initialsFor = (name: string) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "MF";
};

const formatMemberDate = (dateValue?: string) => {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function MySpace() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const profile = useMemo(readStoredProfile, []);
  const username = profile.username || "MovieFlixUser";
  const displayName = splitDisplayName(username) || "MovieFlix User";
  const email = profile.email || "Email not available";
  const memberSince = formatMemberDate(profile.created_at || profile.memberSince);
  const initials = initialsFor(displayName);

  const logout = () => {
    setLoggingOut(true);

    window.setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("movieflix_user");
      navigate("/");
    }, 900);
  };

  return (
    <>
      <Header />

      <main className="profile-page">
        <h1>My Profile</h1>

        <section className="profile-card">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar" aria-label={`${displayName} profile picture`}>
              <span>{initials}</span>
            </div>

            <button className="profile-avatar-edit" type="button" aria-label="Edit profile picture">
              <Pencil size={22} />
            </button>
          </div>

          <div className="profile-info">
            <h2>{displayName}</h2>

            <div className="profile-info-row">
              <Mail size={27} />
              <div>
                <span>Email</span>
                <strong>{email}</strong>
              </div>
            </div>

            <div className="profile-info-row">
              <UserRound size={28} />
              <div>
                <span>Username</span>
                <strong>{username}</strong>
              </div>
            </div>

            <div className="profile-info-row">
              <CalendarDays size={28} />
              <div>
                <span>Member Since</span>
                <strong>{memberSince}</strong>
              </div>
            </div>

            <div className="profile-info-row">
              <ShieldCheck size={28} />
              <div>
                <span>Account Status</span>
                <strong className="profile-active-status">Active</strong>
              </div>
            </div>
          </div>
        </section>

        <button className="profile-logout-button" type="button" onClick={logout} disabled={loggingOut}>
          {loggingOut ? (
            <>
              <span className="profile-button-spinner" />
              Logging out...
            </>
          ) : (
            "Logout"
          )}
        </button>
      </main>
    </>
  );
}
