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
            let responseMessage = ''; // Inisialisasi pesan respons
            const topPrediction = predictions.reduce((prev, current) => (prev.score > current.score) ? prev : current);
        
            // Menyiapkan pesan respons berdasarkan prediksi
            if (topPrediction.class === "blackspot") {
                responseMessage = `Kemungkinan tanaman ini terjangkit penyakit ${topPrediction.class} sebesar ${Math.round(topPrediction.score * 100)}%<br><br>Penanganan penyakit hitam pada tanaman jeruk meliputi tindakan sebelum dan setelah panen. Penyakit ini disebabkan oleh jamur Guignardia citricarpa dan gejalanya termasuk bintik hitam di daun yang berkembang menjadi lingkaran kuning, diikuti oleh kuning dan rontoknya daun.<br>Pada tahap pasca-panen, pengendalian dapat dilakukan dengan menggunakan fungisida seperti pyrimethanil, imazalil, fludioxonil, dan thiabendazole. Penggunaannya bisa melalui penyemprotan, penyaputan batang, atau pengumpulan buah yang terinfeksi. Alternatifnya, penggunaan bakteri endofitik Nodulisporium spp. atau aditif makanan yang mengandung sulfur juga bisa dipertimbangkan.<br>Pengendalian penyakit hitam juga melibatkan sanitasi tanaman, seperti pengumpulan dan pembaran daun yang gugur dari pohon sakit, pemangkasan, dan pengumpulan buah yang terinfeksi. Ini membantu mengurangi penyebaran infeksi dan meminimalkan kerusakan tanaman.`;
            } else if (topPrediction.class === "Canker") {
                responseMessage = `Kemungkinan tanaman ini terjangkit penyakit ${topPrediction.class} sebesar ${Math.round(topPrediction.score * 100)}%<br><br>Penanganan kanker pada tanaman jeruk setelah panen dapat dilakukan dengan penggunaan fungisida seperti pyrimethanil, imazalil, fludioxonil, dan thiabendazole. Gejala kanker yang disebabkan oleh jamur Penicillium digitatum meliputi lesi merah muda kebiru-biruan yang berkembang menjadi lesi yang lebih besar dan berwarna merah hingga kehitaman. Metode pengendalian lain termasuk sanitasi tanaman seperti pengumpulan dan pembuangan daun yang gugur, pemangkasan, dan pengambilan buah yang terinfeksi. Selain itu, insektisida seperti Metidation, Abamektin, Dimetoathe, Diazinon, Sipermetrin, dan Imidakloprid juga dapat digunakan melalui penyemprotan atau penyaputan batang.<br><br>Sebagai alternatif, pengendalian kanker pada tanaman jeruk juga dapat dilakukan dengan menggunakan bakteri endofitik Nodulisporium spp. atau aditif makanan yang mengandung sulfur. Praktik-praktik ini, bersama dengan penggunaan fungisida dan tindakan sanitasi lainnya seperti pemangkasan dan pengumpulan buah terinfeksi, dapat membantu mencegah dan mengurangi penyebaran kanker setelah panen.`;
            } else {
                responseMessage = `Tanaman Anda sehat`;
            }
        
            // Mengirimkan pesan respons JSON
            res.json(responseMessage);
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
