import axios from 'axios';
import { showAlert } from './alerts.js';

export const bookTour = async tourId => {
  try {
    // Get the checkout session on client side
    const session = await axios.get(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    // Create checkoutform and charge the credit card
    if (session.data.status === 'success') {
      showAlert(
        'success',
        `Redirecting to the payment gateway page! Please don't go back or refresh the page`
      );
      window.setTimeout(() => location.assign(session.data.session.url), 2000);
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err.message);
  }
};
