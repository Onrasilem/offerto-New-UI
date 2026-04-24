import Toast from 'react-native-toast-message';

/**
 * Display a toast notification
 * @param {string} type - Type of toast: 'success', 'error', 'info'
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export const showToast = (type, message, duration = 3000) => {
  Toast.show({
    type,
    text1: message,
    duration,
    position: 'top',
    topOffset: 50,
  });
};

/**
 * Show a success toast notification
 * @param {string} message - Success message to display
 */
export const showSuccessToast = (message) => {
  showToast('success', message);
};

/**
 * Show an error toast notification
 * @param {string} message - Error message to display
 */
export const showErrorToast = (message) => {
  showToast('error', message);
};

/**
 * Show a warning toast notification
 * @param {string} message - Warning message to display
 */
export const showWarningToast = (message) => {
  showToast('warning', message);
};

export const showInfoToast = (message) => {
  showToast('info', message);
};
