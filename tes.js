const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

// Inisialisasi aplikasi Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Koneksi ke MongoDB
mongoose.connect('mongodb://localhost:27017/realtime_history', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Definisikan schema dan model untuk history
const historySchema = new mongoose.Schema({
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const History = mongoose.model('History', historySchema);

// Middleware untuk parse JSON
app.use(express.json());

// Route untuk mendapatkan semua history
app.get('/history', async (req, res) => {
    const histories = await History.find().sort({ timestamp: -1 });
    res.json(histories);
});

// Route untuk menambahkan entry ke history
app.post('/history', async (req, res) => {
    const newHistory = new History(req.body);
    await newHistory.save();

    // Emit event ke semua klien
    io.emit('new_history', newHistory);
    res.status(201).json(newHistory);
});

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Jalankan server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
