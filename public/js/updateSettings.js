import axios from 'axios';
import { showAlert } from './alerts.js';

export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/update-my-password'
        : '/api/v1/users/update-me';

    const res = await axios.patch(url, data, {
      new: true,
      runValidators: true,
    });

    if (res.data.status === 'success') {
      showAlert(
        'success',
        `${type.at(0).toUpperCase() + type.slice(1)} updated successfully!`
      );
      setTimeout(() => location.assign('/myAccount'), 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
