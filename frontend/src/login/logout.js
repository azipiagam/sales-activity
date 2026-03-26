import { logout as clearAuthData } from '../utils/auth';

export const performLogout = ({ navigate, replace = true } = {}) => {
  clearAuthData();

  if (typeof navigate === 'function') {
    navigate('/login', { replace });
  }
};

export default performLogout;
