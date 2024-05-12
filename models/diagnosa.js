const mongoose = require('mongoose');

const diagnosaSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    gambar: {
        type: String,
        required: true
    },
    hasil: {
        type: String,
        required: true
        
    },
    waktu: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Diagnosa', diagnosaSchema);
