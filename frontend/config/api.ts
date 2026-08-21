// config/api.ts
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://127.0.0.1:8000'   // Lokales Testen ohne SSL
  : 'https://api.deinedomain.com'; // Produktion (NUR HTTPS!)

export default BASE_URL;