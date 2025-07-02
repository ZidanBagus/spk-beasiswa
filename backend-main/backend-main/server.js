// server.js
const app = require('./app.js'); // Mengimpor instance Express dari app.js

const PORT = process.env.PORT || 5001; // Mengambil port dari .env atau default ke 5001

app.listen(PORT, () => {
  console.log(`Server backend SPK Beasiswa berjalan di http://localhost:${PORT}`);
});