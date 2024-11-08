import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="header-content">
                <Link to="/" className="logo">
                    Stock Analytics
                </Link>
                <div className="auth-buttons">
                    <Link to="/login" className="auth-button">Login</Link>
                    <Link to="/register" className="auth-button">Register</Link>
                </div>
            </div>
        </header>
    );
};

export default Header;