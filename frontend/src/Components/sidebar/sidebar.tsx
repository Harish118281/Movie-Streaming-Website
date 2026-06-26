import "./sidebar.css"
import { useEffect, useRef, useState } from "react"
import { NavLink } from "react-router-dom"

import {
  House,
  Search,
  Monitor,
  Clapperboard,
  Trophy,
  LayoutGrid,
  CircleUserRound,
} from "lucide-react"

const menuItems = [
  {
    icon: House,
    label: "Home",
    path: "/home",
  },
  {
    icon: Search,
    label: "Search",
    path: "/search",
  },
  {
    icon: Monitor,
    label: "TV",
    path: "/tv",
  },
  {
    icon: Clapperboard,
    label: "Movies",
    path: "/movies",
  },
  {
    icon: Trophy,
    label: "Animes",
    path: "/Animes",
  },
  {
    icon: LayoutGrid,
    label: "Categories",
    path: "/categories",
  },
];

export default function Sidebar() {
  const [isClickPaused, setIsClickPaused] = useState(false);
  const clickPauseTimer = useRef<number | undefined>(undefined);

  const startClickPause = () => {
    setIsClickPaused(true);
    window.clearTimeout(clickPauseTimer.current);
  };

  const finishClickPause = () => {
    window.clearTimeout(clickPauseTimer.current);
    clickPauseTimer.current = window.setTimeout(() => {
      setIsClickPaused(false);
    }, 700);
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(clickPauseTimer.current);
    };
  }, []);

  return(
    <aside className={`sidebar ${isClickPaused ? "sidebar-click-paused" : ""}`}>
      <nav className="sidebar-nav">
        {menuItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={label}
            to={path}
            onPointerDown={startClickPause}
            onPointerUp={finishClickPause}
            onPointerCancel={finishClickPause}
            onClick={finishClickPause}
            className={({ isActive }) =>
              `sidebar-btn ${isActive ? "active" : ""}`
            }
          >
            <Icon size={24} />
            <span className="sidebar-label">
              {label}
            </span>

            
          </NavLink>
        ))}
      </nav>

      <div className="profile-hover-zone">
        <NavLink
          to="/myspace"
          onPointerDown={startClickPause}
          onPointerUp={finishClickPause}
          onPointerCancel={finishClickPause}
          onClick={finishClickPause}
          className={({ isActive }) =>
            `profile-btn ${isActive ? "active" : ""}`
          }
        >
          <CircleUserRound size={24} />
          <span className="sidebar-label">
            My Space
          </span>

        </NavLink>
      </div>

    </aside>

  )


}
