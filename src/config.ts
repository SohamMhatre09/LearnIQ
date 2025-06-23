const importedApiUrl = import.meta.env.VITE_API_URL;
export const API_URL: string = importedApiUrl || 'http://localhost:5000';