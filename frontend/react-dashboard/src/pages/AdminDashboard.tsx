import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ApplicationsList from './ApplicationsList';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('All');
    return (
        <div style={{ padding: '20px' }}>
            <h2>Admin Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px', marginBottom: '40px' }}>
                <Link to="/admin/rules" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' }}>
                        <h3>Rule Management</h3>
                        <p>Configure fraud detection rules and thresholds.</p>
                    </div>
                </Link>
                <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3>Simulators</h3>
                    <p>Test fraud scenarios and rule distinctiveness.</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3>Audit Logs</h3>
                    <p>View system activity and user actions.</p>
                </div>
            </div>

            <div style={{ marginTop: '20px' }}>
                <h3>Application Queue</h3>
                <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #eee' }}>
                    <button
                        style={{
                            padding: '10px 15px',
                            border: 'none',
                            backgroundColor: activeTab === 'All' ? '#007bff' : 'transparent',
                            color: activeTab === 'All' ? 'white' : '#007bff',
                            cursor: 'pointer',
                            borderTopLeftRadius: '5px',
                            borderTopRightRadius: '5px',
                            marginRight: '5px',
                            fontWeight: activeTab === 'All' ? 'bold' : 'normal'
                        }}
                        onClick={() => setActiveTab('All')}
                    >
                        All
                    </button>
                    <button
                        style={{
                            padding: '10px 15px',
                            border: 'none',
                            backgroundColor: activeTab === 'Pending' ? '#007bff' : 'transparent',
                            color: activeTab === 'Pending' ? 'white' : '#007bff',
                            cursor: 'pointer',
                            borderTopLeftRadius: '5px',
                            borderTopRightRadius: '5px',
                            marginRight: '5px',
                            fontWeight: activeTab === 'Pending' ? 'bold' : 'normal'
                        }}
                        onClick={() => setActiveTab('Pending')}
                    >
                        Pending
                    </button>
                    <button
                        style={{
                            padding: '10px 15px',
                            border: 'none',
                            backgroundColor: activeTab === 'APPROVE' ? '#007bff' : 'transparent',
                            color: activeTab === 'APPROVE' ? 'white' : '#007bff',
                            cursor: 'pointer',
                            borderTopLeftRadius: '5px',
                            borderTopRightRadius: '5px',
                            marginRight: '5px',
                            fontWeight: activeTab === 'APPROVE' ? 'bold' : 'normal'
                        }}
                        onClick={() => setActiveTab('APPROVE')}
                    >
                        APPROVE
                    </button>
                    <button
                        style={{
                            padding: '10px 15px',
                            border: 'none',
                            backgroundColor: activeTab === 'REJECT' ? '#007bff' : 'transparent',
                            color: activeTab === 'REJECT' ? 'white' : '#007bff',
                            cursor: 'pointer',
                            borderTopLeftRadius: '5px',
                            borderTopRightRadius: '5px',
                            fontWeight: activeTab === 'REJECT' ? 'bold' : 'normal'
                        }}
                        onClick={() => setActiveTab('REJECT')}
                    >
                        Rejected
                    </button>
                </div>
                <ApplicationsList statusFilter={activeTab} />
            </div>
        </div>
    );
};

export default AdminDashboard;
