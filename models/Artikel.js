const mongoose = require('mongoose');

const artikelSchema = new mongoose.Schema({
    namaArtikel: {
        type: String,
        required: true
    },
    penyebab: {
        type: String,
        required: true
    },
    ciri: [{
        type: String,
        required: true
    }],
    langkahPenanganan: [{
        type: String,
        required: true
    }],
    gambar: {
        type: String,
        required: true
    }
});
module.exports = mongoose.model('Artikel', artikelSchema);
