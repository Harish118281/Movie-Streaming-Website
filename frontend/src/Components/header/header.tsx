import logo from "../../assets/logo.png";
import "./header.css";

export default function Header() {
  return (
    <header className="header">

      <div className="header-left">
        <img
      src={logo}
      alt="MovieFlix logo"
      className="logo"
      />

      </div>

    </header>


  )
}