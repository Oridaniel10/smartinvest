import apiClient from './api';

const BASE_TRANSACTION_URL = '/transaction';

export const buyStock = (tradeData) => {
  return apiClient.post(`${BASE_TRANSACTION_URL}/buy`, tradeData);
};

export const sellStock = (tradeData) => {
  return apiClient.post(`${BASE_TRANSACTION_URL}/sell`, tradeData);
};

export const getHistory = () => {
  return apiClient.get(`${BASE_TRANSACTION_URL}/history`);
};