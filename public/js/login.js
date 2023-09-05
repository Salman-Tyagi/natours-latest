import axios from 'axios';
import { showAlert } from './alerts.js';

export const login = async (email, password) => {
  try {
    const res = await axios.post('/api/v1/users/login', {
      email,
      password,
    });

    if (res.data.status === 'success') {
      setTimeout(() => showAlert('success', 'Logged in successfully!'), 500);
      setTimeout(() => location.assign('/'), 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async (req, res) => {
  try {
    const res = await axios.get('/api/v1/users/logout');
    if (res.data.status === 'success') {
      showAlert('success', `You're logging out...`);
      setTimeout(() => location.assign('/'), 1000);
    }
  } catch (err) {
    showAlert('error', 'Error in logging out! Try again later.');
  }
};
