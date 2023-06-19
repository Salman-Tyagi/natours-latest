import axios from 'axios';
import { showAlert } from './alerts.js';

export const login = async (email, password) => {
  try {
    const res = await axios.post('/api/v1/users/login', {
      email,
      password,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async (req, res) => {
  try {
    const res = await axios.get('/api/v1/users/logout');
    if (res.data.status === 'success') location.assign('/');
  } catch (err) {
    showAlert('error', 'Error in logging out! Try again later.');
  }
};
