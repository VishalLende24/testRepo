import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HealthCheck from './HealthCheck';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="App">
            <HealthCheck />

            <nav className="navbar">
                <div className="nav-container">
                    <h1>Fraud Detection System</h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div className="nav-links">
                            {(user?.role === 'Officer' || user?.role === 'Admin') && (
                                <Link to="/">Applications</Link>
                            )}
                            {user?.role === 'Officer' && (
                                <Link to="/submit">New Application</Link>
                            )}
                            {user?.role === 'Admin' && (
                                <Link to="/admin/dashboard">Dashboard</Link>
                            )}
                        </div>

                        {user && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '15px' }}>
                                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
                                    Logged in as: <strong>{user.role}</strong>
                                </span>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '13px'
                                    }}
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
