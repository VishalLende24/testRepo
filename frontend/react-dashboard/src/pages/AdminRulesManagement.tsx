import React, { useState, useEffect } from 'react';
import { ruleService } from '../services/api';

interface Condition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex' | 'in_range';
  value: any;
  weight: number;
}

interface Rule {
  _id?: string;
  ruleId: string;
  name: string;
  description: string;
  conditions: Condition[];
  logic: 'AND' | 'OR';
  score: number;
  priority: number;
  isActive: boolean;
  version?: number;
  createdBy?: string;
  createdAt?: string;
}

const AdminRulesManagement: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [testData, setTestData] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const defaultRule: Rule = {
    ruleId: '',
    name: '',
    description: '',
    conditions: [{ field: '', operator: 'equals', value: '', weight: 1 }],
    logic: 'AND',
    score: 0,
    priority: 1,
    isActive: true
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await ruleService.getRules();
      setRules(response.data.data);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const handleSaveRule = async (rule: Rule) => {
    try {
      // Validate required fields
      if (!rule.ruleId || !rule.name || !rule.description) {
        alert('Please fill in all required fields');
        return;
      }
      
      // Validate conditions
      const validConditions = rule.conditions?.filter(c => c.field && c.value) || [];
      if (validConditions.length === 0) {
        alert('Please add at least one valid condition');
        return;
      }
      
      const ruleToSave = {
        ...rule,
        conditions: validConditions
      };
      
      console.log('Saving rule:', ruleToSave);
      
      if (rule._id) {
        const response = await ruleService.updateRule(rule._id, ruleToSave);
        console.log('Update response:', response);
      } else {
        const response = await ruleService.createRule(ruleToSave);
        console.log('Create response:', response);
      }
      fetchRules();
      setShowForm(false);
      setEditingRule(null);
    } catch (error: any) {
      console.error('Error saving rule:', error);
      console.error('Error details:', error.response?.data);
      alert(`Error saving rule: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await ruleService.deleteRule(id);
        fetchRules();
      } catch (error) {
        console.error('Error deleting rule:', error);
      }
    }
  };

  const handleTestRules = async () => {
    try {
      const data = JSON.parse(testData);
      const response = await ruleService.testRules(data);
      setTestResult(response.data.data);
    } catch (error) {
      console.error('Error testing rules:', error);
      setTestResult({ error: 'Invalid JSON or test failed' });
    }
  };

  const RuleForm: React.FC<{ rule: Rule; onSave: (rule: Rule) => void; onCancel: () => void }> = ({ rule, onSave, onCancel }) => {
    const [formRule, setFormRule] = useState<Rule>(rule);

    const addCondition = () => {
      setFormRule({
        ...formRule,
        conditions: [...(formRule.conditions || []), { field: '', operator: 'equals', value: '', weight: 1 }]
      });
    };

    const updateCondition = (index: number, condition: Condition) => {
      const newConditions = [...(formRule.conditions || [])];
      newConditions[index] = condition;
      setFormRule({ ...formRule, conditions: newConditions });
    };

    const removeCondition = (index: number) => {
      setFormRule({
        ...formRule,
        conditions: (formRule.conditions || []).filter((_, i) => i !== index)
      });
    };

    return (
      <div className="rule-form">
        <h3>{rule._id ? 'Edit Rule' : 'Create New Rule'}</h3>
        
        <div className="form-group">
          <label>Rule ID:</label>
          <input
            type="text"
            value={formRule.ruleId}
            onChange={(e) => setFormRule({ ...formRule, ruleId: e.target.value })}
            placeholder="RULE_001"
          />
        </div>

        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            value={formRule.name}
            onChange={(e) => setFormRule({ ...formRule, name: e.target.value })}
            placeholder="High Amount Alert"
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={formRule.description}
            onChange={(e) => setFormRule({ ...formRule, description: e.target.value })}
            placeholder="Flag applications with unusually high amount"
          />
        </div>

        <div className="form-group">
          <label>Logic:</label>
          <select
            value={formRule.logic}
            onChange={(e) => setFormRule({ ...formRule, logic: e.target.value as 'AND' | 'OR' })}
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </div>

        <div className="form-group">
          <label>Score (0-100):</label>
          <input
            type="number"
            min="0"
            max="100"
            value={formRule.score}
            onChange={(e) => setFormRule({ ...formRule, score: parseInt(e.target.value) })}
          />
        </div>

        <div className="form-group">
          <label>Priority:</label>
          <input
            type="number"
            min="1"
            value={formRule.priority}
            onChange={(e) => setFormRule({ ...formRule, priority: parseInt(e.target.value) })}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formRule.isActive}
              onChange={(e) => setFormRule({ ...formRule, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>

        <div className="conditions-section">
          <h4>Conditions</h4>
          {formRule.conditions?.map((condition, index) => (
            <div key={index} className="condition-row">
              <select
                value={condition.field}
                onChange={(e) => updateCondition(index, { ...condition, field: e.target.value })}
              >
                <option value="">Select Field</option>
                <option value="fullName">Full Name</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="address">Address</option>
                <option value="exactMatches.length">Exact Matches Count</option>
                <option value="fuzzyMatches.length">Fuzzy Matches Count</option>
              </select>

              <select
                value={condition.operator}
                onChange={(e) => updateCondition(index, { ...condition, operator: e.target.value as any })}
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="contains">Contains</option>
                <option value="regex">Regex</option>
                <option value="in_range">In Range</option>
              </select>

              <input
                type="text"
                value={condition.value}
                onChange={(e) => updateCondition(index, { ...condition, value: e.target.value })}
                placeholder="Value"
              />

              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={condition.weight}
                onChange={(e) => updateCondition(index, { ...condition, weight: parseFloat(e.target.value) })}
                placeholder="Weight"
              />

              <button type="button" onClick={() => removeCondition(index)}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={addCondition}>Add Condition</button>
        </div>

        <div className="form-actions">
          <button onClick={() => onSave(formRule)}>Save Rule</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-rules-management">
      <div className="header">
        <h2>Fraud Detection Rules Management</h2>
        <button onClick={() => { setEditingRule(defaultRule); setShowForm(true); }}>
          Create New Rule
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <RuleForm
              rule={editingRule || defaultRule}
              onSave={handleSaveRule}
              onCancel={() => { setShowForm(false); setEditingRule(null); }}
            />
          </div>
        </div>
      )}

      <div className="rules-list">
        <h3>Active Rules ({rules?.filter(r => r.isActive).length || 0})</h3>
        <table>
          <thead>
            <tr>
              <th>Rule ID</th>
              <th>Name</th>
              <th>Score</th>
              <th>Priority</th>
              <th>Conditions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules?.map((rule) => (
              <tr key={rule._id} className={!rule.isActive ? 'inactive' : ''}>
                <td>{rule.ruleId}</td>
                <td>{rule.name}</td>
                <td>{rule.score}</td>
                <td>{rule.priority}</td>
                <td>{rule.conditions?.length || 0} condition(s)</td>
                <td>
                  <span className={`status ${rule.isActive ? 'active' : 'inactive'}`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button onClick={() => { setEditingRule(rule); setShowForm(true); }}>
                    Edit
                  </button>
                  <button onClick={() => rule._id && handleDeleteRule(rule._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="test-section">
        <h3>Test Rules</h3>
        <textarea
          value={testData}
          onChange={(e) => setTestData(e.target.value)}
          placeholder='{"fullName": "John Doe", "phone": "1234567890", "exactMatches": []}'
          rows={4}
        />
        <button onClick={handleTestRules}>Test Rules</button>
        
        {testResult && (
          <div className="test-result">
            <h4>Test Result:</h4>
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        )}
      </div>

      <style>{`
        .admin-rules-management {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          width: 90%;
        }

        .rule-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group label {
          font-weight: bold;
        }

        .form-group input, .form-group select, .form-group textarea {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .conditions-section {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 4px;
        }

        .condition-row {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
          align-items: center;
        }

        .condition-row select, .condition-row input {
          flex: 1;
          padding: 5px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .rules-list table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }

        .rules-list th, .rules-list td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .rules-list th {
          background-color: #f5f5f5;
          font-weight: bold;
        }

        .rules-list tr.inactive {
          opacity: 0.6;
        }

        .status.active {
          color: green;
          font-weight: bold;
        }

        .status.inactive {
          color: red;
          font-weight: bold;
        }

        .test-section {
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }

        .test-section textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: monospace;
          margin-bottom: 10px;
        }

        .test-result {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          margin-top: 15px;
        }

        .test-result pre {
          margin: 0;
          white-space: pre-wrap;
        }

        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        button:hover {
          opacity: 0.8;
        }

        .header button {
          background: #007bff;
          color: white;
        }

        .form-actions button:first-child {
          background: #28a745;
          color: white;
        }

        .form-actions button:last-child {
          background: #6c757d;
          color: white;
        }

        .rules-list button {
          margin-right: 5px;
          padding: 4px 8px;
          font-size: 12px;
        }

        .rules-list button:first-child {
          background: #ffc107;
          color: black;
        }

        .rules-list button:last-child {
          background: #dc3545;
          color: white;
        }

        .test-section button {
          background: #17a2b8;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default AdminRulesManagement;