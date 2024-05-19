const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    pass: {
        type: String,
        required: true
    },
    akses: {
        type: String,
        required: true
    },
    gambar: {
        type: String,
        required: true
    }
});
module.exports = mongoose.model('Akun', userSchema);
