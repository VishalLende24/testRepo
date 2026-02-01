import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const applicationService = {
  // Get all applications
  getApplications: (status?: string) => api.get('/applications', { params: { status } }),
  
  // Get application details
  getApplicationDetails: (id: string) => api.get(`/applications/${id}`),
  
  // Submit new application
  submitApplication: (data: any) => {
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.post('/applications', data, config);
  },
  
  // Officer action
  submitAction: (id: string, action: string, officerId: string, notes?: string) =>
    api.post(`/applications/${id}/action`, { action, officerId, notes }),
};

export const ruleService = {
  // Get all rules
  getRules: () => api.get('/rules'),
  
  // Create rule
  createRule: (data: any) => api.post('/rules', data),
  
  // Update rule
  updateRule: (id: string, data: any) => api.put(`/rules/${id}`, data),
  
  // Delete rule
  deleteRule: (id: string) => api.delete(`/rules/${id}`),
  
  // Test rule evaluation
  testRules: (testData: any) => api.post('/rules/test', { testData }),
};

export default api;