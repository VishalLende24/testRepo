import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ApplicationDetails {
  application: {
    _id: string;
    fullName: string;
    phone: string;
    address: string;
    createdAt: string;
    status?: 'PENDING' | 'APPROVE' | 'REJECT';
  };
  riskScore: {
    totalScore: number;
    normalizedScore: number;
    riskBand: string;
    triggeredRules: string[];
  };
  duplicateMatches: Array<{
    matchType: string;
    field: string;
    score: number;
    matchedApplicationId: {
      fullName: string;
      phone: string;
    };
  }>;
  explanation: {
    explanations: string[];
  };
}


const ApplicationDetail: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [details, setDetails] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await applicationService.getApplicationDetails(id!);
        setDetails(response.data.data);
      } catch (err: any) {
        setError('Failed to fetch application details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

  const handleAction = async (action: string) => {
    if (action === 'APPROVE') {
      if (!window.confirm('Are you sure you want to approve this application?')) return;
    } else if (action === 'REJECT') {
      // For rejection, we actually need a reason, but the current backend endpoint receives 'notes'.
      // We can prompt for reason.
      const reason = window.prompt('Please enter rejection reason:', 'Eligibility criteria not met');
      if (reason === null) return; // Cancelled
      // We will pass reason as notes.
      // But wait, the handleAction call below hardcodes notes. I need to update it.
      setActionLoading(true);
      try {
        await applicationService.submitAction(id!, action, 'admin', reason || 'Rejected by admin');
        alert(`Application ${action.toLowerCase()}d successfully`);
        // Refresh details
        const response = await applicationService.getApplicationDetails(id!);
        setDetails(response.data.data);
      } catch (err: any) {
        alert('Failed to submit action: ' + (err.response?.data?.error || err.message));
      } finally {
        setActionLoading(false);
      }
      return;
    }

    setActionLoading(true);
    try {
      await applicationService.submitAction(id!, action, 'admin', `Application ${action.toLowerCase()}d`);
      alert(`Application ${action.toLowerCase()}d successfully`);
      // Refresh details
      const response = await applicationService.getApplicationDetails(id!);
      setDetails(response.data.data);
    } catch (err: any) {
      alert('Failed to submit action: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
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
  if (!details) return <div style={{ textAlign: 'center', padding: '20px' }}>Application not found</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to={user?.role === 'Admin' ? '/admin/dashboard' : '/'} style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to {user?.role === 'Admin' ? 'Dashboard' : 'Applications'}
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Application Info */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <h2>Application Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <strong>Name:</strong> {details.application.fullName}
            </div>
            <div>
              <strong>Phone:</strong> {details.application.phone}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Address:</strong> {details.application.address}
            </div>
            <div>
              <strong>Submitted:</strong> {new Date(details.application.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <h3>Risk Assessment</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
            <div
              style={{
                padding: '10px 20px',
                borderRadius: '25px',
                color: 'white',
                backgroundColor: getRiskColor(details.riskScore.riskBand),
                fontWeight: 'bold'
              }}
            >
              {details.riskScore.riskBand} RISK
            </div>
            <div style={{ fontSize: '18px' }}>
              Score: {details.riskScore.normalizedScore}/100
            </div>
          </div>

          {details.riskScore.triggeredRules.length > 0 && (
            <div>
              <strong>Triggered Rules:</strong>
              <ul style={{ marginTop: '10px' }}>
                {details.riskScore.triggeredRules.map((rule, index) => (
                  <li key={index} style={{ margin: '5px 0' }}>{rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Duplicate Matches */}
        {details.duplicateMatches.length > 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
            <h3>Duplicate Matches Found</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {details.duplicateMatches.map((match, index) => (
                <div
                  key={index}
                  style={{
                    padding: '15px',
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                    backgroundColor: '#fff3cd'
                  }}
                >
                  <div><strong>Match Type:</strong> {match.matchType.toUpperCase()}</div>
                  <div><strong>Field:</strong> {match.field}</div>
                  <div><strong>Similarity:</strong> {(match.score * 100).toFixed(1)}%</div>
                  <div><strong>Matched With:</strong> {match.matchedApplicationId.fullName} ({match.matchedApplicationId.phone})</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Explanations */}
        {details.explanation?.explanations && (
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
            <h3>AI Explanations</h3>
            <ul style={{ marginTop: '10px' }}>
              {details.explanation.explanations.map((explanation, index) => (
                <li key={index} style={{ margin: '10px 0', lineHeight: '1.5' }}>{explanation}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Admin Actions: Only visible to Admins */}
        {user?.role === 'Admin' && (
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
            <h3>Admin Actions</h3>
            {details.application.status && details.application.status !== 'PENDING' ? (
              <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #ddd' }}>
                <strong>Application is {details.application.status}</strong>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                <button
                  onClick={() => handleAction('APPROVE')}
                  disabled={actionLoading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleAction('REJECT')}
                  disabled={actionLoading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetail;