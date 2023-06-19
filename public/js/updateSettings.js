import axios from 'axios';
import { showAlert } from './alerts.js';

export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/update-my-password'
        : 'http://127.0.0.1:3000/api/v1/users/update-me';

    const res = await axios.patch(url, data, {
      new: true,
      runValidators: true,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
      location.assign('/myAccount');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
