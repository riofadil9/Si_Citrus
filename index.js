const express = require("express"); // Mengimpor modul Express.js untuk membuat aplikasi web
const teachableMachine = require("@sashido/teachablemachine-node"); // Mengimpor modul untuk menggunakan model machine learning dari Teachable Machine
const multer = require('multer'); // Mengimpor modul multer untuk menangani unggahan file
const fs = require('fs'); // Mengimpor modul fs untuk mengakses sistem file
const path = require("path");

// Membuat objek model dari kelas teachableMachine dengan model URL yang diberikan
const model = new teachableMachine({
    modelUrl: "https://teachablemachine.withgoogle.com/models/3IPtlX6kC/",
});

// Membuat aplikasi Express
const app = express();
// Menentukan port yang akan digunakan, jika tidak ada di environment variable, maka gunakan port 5000
const port = process.env.PORT || 5000;
app.set('view engine','ejs')
// Menggunakan middleware untuk mengurai body permintaan yang masuk sebagai JSON
app.use(express.json());
// Menggunakan middleware untuk mengurai body permintaan yang masuk sebagai URL-encoded data
app.use(express.urlencoded({extended: false}));

// Membuat objek upload dari multer dengan direktori penyimpanan file sementara 'uploads/'
const upload = multer({ dest: 'uploads/' });
// Menyediakan akses publik untuk direktori 'uploads/'
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'form')));
// Menangani permintaan GET pada akar URL, menampilkan form unggah gambar
app.get("/", (req, res) => {
    res.render('beranda');
});
app.get("/diagnosa", (req, res) => {
    res.render('diagnosa');
});

// Menangani permintaan POST untuk mengklasifikasikan gambar yang diunggah
app.post("/image/clasify", upload.single('imageFile'), async (req, res) => {
    // Jika tidak ada file yang diunggah, kirim respons 400 Bad Request
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // Path dari file yang diunggah
    const imagePath = req.file.path;

    // Mengubah nama dan memindahkan file ke direktori 'uploads/' dengan nama asli
    const newImagePath = `uploads/${req.file.originalname}`;
    fs.renameSync(imagePath, newImagePath);

    // URL dari gambar yang diunggah
    const imageUrl = `http://localhost:${port}/${newImagePath}`;

    // Mengklasifikasikan gambar menggunakan model machine learning
    return model
        .classify({
            imageUrl: imageUrl, // Gunakan URL file lokal sebagai URL gambar
        })
        .then((predictions) => {
            const topPrediction = predictions.reduce((prev, current) => (prev.score > current.score) ? prev : current)
            // Mengirim hasil prediksi sebagai respons JSON
            res.json( `Kemungkinan tanaman ini terjangkit penyakit ${topPrediction.class} sebesar ${Math.round(topPrediction.score * 100)}%`);
        })
        .catch((e) => {
            // Menangani kesalahan dan mengirim respons 500 Internal Server Error
            console.error(e);
            res.status(500).send(`Something went wrong!`);
        });
});

// Mendengarkan permintaan pada port yang telah ditentukan
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
