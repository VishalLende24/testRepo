import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationService } from '../services/api';

interface Application {
  _id: string;
  fullName: string;
  phone: string;
  address: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVE' | 'REJECT';
  riskScore?: {
    normalizedScore: number;
    riskBand: string;
  };
}

interface ApplicationsListProps {
  statusFilter?: string;
}

const ApplicationsList: React.FC<ApplicationsListProps> = ({ statusFilter }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === 'All' ? undefined : statusFilter?.toUpperCase();
      const response = await applicationService.getApplications(statusParam);
      setApplications(response.data.data);
    } catch (err: any) {
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskBand: string) => {
    switch (riskBand) {
      case 'HIGH': return '#dc3545';
      case 'MEDIUM': return '#ffc107';
      case 'LOW': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Applications ({applications.length})</h2>
        <Link
          to="/submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          New Application
        </Link>
      </div>

      {applications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No applications found. <Link to="/submit">Submit the first one</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {applications.map((app) => (
            <div
              key={app._id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{app.fullName}</h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>Phone: {app.phone}</p>
                  <p style={{ margin: '5px 0', color: '#666' }}>Address: {app.address}</p>
                  <p style={{ margin: '5px 0', fontWeight: 'bold', color: app.status === 'APPROVE' ? 'green' : app.status === 'REJECT' ? 'red' : 'orange' }}>
                    Status: {app.status || 'PENDING'}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    Submitted: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {app.riskScore && (
                    <div>
                      <div
                        style={{
                          padding: '5px 10px',
                          borderRadius: '20px',
                          color: 'white',
                          backgroundColor: getRiskColor(app.riskScore.riskBand),
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginBottom: '10px'
                        }}
                      >
                        {app.riskScore.riskBand} RISK
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        Score: {app.riskScore.normalizedScore}/100
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/applications/${app._id}`}
                    style={{
                      display: 'inline-block',
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsList;