import axios from "axios";

const api = axios.create({
  baseURL: "http://168.196.132.70:8090",
  headers: {
    "X-Embarcadero-App-Secret": "DE1BA56B-43C5-469D-9BD2-4EB146EB8473",
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token se necessário
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Função para extrair dados do formato FireDAC
export const extractFireDACData = (responseData) => {
  if (responseData && responseData.FDBS && responseData.FDBS.Manager && responseData.FDBS.Manager.TableList) {
    const tables = responseData.FDBS.Manager.TableList;
    if (tables && tables.length > 0 && tables[0].RowList && tables[0].RowList.length > 0) {
      return tables[0].RowList.map(row => row.Original);
    }
  }
  if (Array.isArray(responseData)) {
    return responseData;
  }
  return [];
};

export default api;