import logo from "../assets/Logo.png";
import LoginManager from "./LoginManager";

function Navbar() {
    return (
        <nav
            className="navbar navbar-expand-lg px-4"
            style={{ backgroundColor: "var(--dark-brown)" }}
        >

            <a
                className="navbar-brand fw-bold d-flex align-items-center text-white"
                href="/"
            >

                <img
                    src={logo}
                    alt="Booked Logo"
                    width="200"
                    height="72"
                    className="me-2"
                />

            </a>

            <div className="ms-auto">
                <LoginManager />
            </div>

        </nav>
    );
}

export default Navbar;