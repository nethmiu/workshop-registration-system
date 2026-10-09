import axios from 'axios';

// Create base Axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for global error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on the login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: async (email, password) => {
    const response = await API.post('/users/login', { email, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await API.post('/users/register', userData);
    return response.data;
  },
  getProfile: async () => {
    const response = await API.get('/users/me');
    return response.data;
  },
  getAllUsers: async () => {
    const response = await API.get('/users');
    return response.data;
  }
};

// Workshop Service
export const workshopService = {
  getWorkshops: async (params = {}) => {
    const response = await API.get('/workshops', { params });
    return response.data;
  },
  getWorkshopById: async (id) => {
    const response = await API.get(`/workshops/${id}`);
    return response.data;
  },
  createWorkshop: async (workshopData) => {
    const response = await API.post('/workshops', workshopData);
    return response.data;
  },
  updateWorkshop: async (id, workshopData) => {
    const response = await API.put(`/workshops/${id}`, workshopData);
    return response.data;
  },
  cancelWorkshop: async (id, reason = '') => {
    const response = await API.delete(`/workshops/${id}`, { data: { reason } });
    return response.data;
  }
};

// Registration Service
export const registrationService = {
  getRegistrations: async (params = {}) => {
    const response = await API.get('/registrations', { params });
    return response.data;
  },
  getRegistrationById: async (id) => {
    const response = await API.get(`/registrations/${id}`);
    return response.data;
  },
  registerAttendee: async (registrationData) => {
    const response = await API.post('/registrations', registrationData);
    return response.data;
  },
  cancelRegistration: async (id, reason = '') => {
    const response = await API.patch(`/registrations/${id}/cancel`, { reason });
    return response.data;
  }
};

export default API;