// src/utils/auth.js
export const setAuthToken = (token) => {
  localStorage.setItem('therapyToken', token);
  localStorage.setItem('therapyLogged', 'true');
};

export const removeAuthToken = () => {
  localStorage.removeItem('therapyToken');
  localStorage.removeItem('therapyLogged');
};

export const isAuthenticated = () => {
  return localStorage.getItem('therapyLogged') === 'true' && 
         localStorage.getItem('therapyToken');
};

export const getAuthToken = () => {
  return localStorage.getItem('therapyToken');
};