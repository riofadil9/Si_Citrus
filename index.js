const express = require("express"); // Mengimpor modul Express.js untuk membuat aplikasi web
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const teachableMachine = require("@sashido/teachablemachine-node"); // Mengimpor modul untuk menggunakan model machine learning dari Teachable Machine
const multer = require('multer'); // Mengimpor modul multer untuk menangani unggahan file
const fs = require('fs'); // Mengimpor modul fs untuk mengakses sistem file
const path = require("path");
const mongoose = require('mongoose');
const Artikel = require('./models/Artikel');
const User = require('./models/user')
const History = require('./models/diagnosa');
const router = express.Router();

// Membuat objek model dari kelas teachableMachine dengan model URL yang diberikan
const model = new teachableMachine({
    modelUrl: "https://teachablemachine.withgoogle.com/models/3IPtlX6kC/",
});

// koneksi mongoDB
mongoose.connect('mongodb://127.0.0.1:27017/SiCitrus',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Terhubung ke MongoDB'))
    .catch(err => console.error('Gagal terhubung ke MongoDB', err));


// Membuat aplikasi Express
const app = express();
const port = process.env.PORT || 5000;
app.set('view engine','ejs')
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Ubah ke true jika Anda menggunakan HTTPS
}));
app.use('/', router);
// Membuat objek upload dari multer dengan direktori penyimpanan file sementara 'uploads/'
const Upload = multer.diskStorage({
    destination: './upload/img',
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  });
  
  // Instance multer dengan pengaturan penyimpanan khusus
const upload = multer({ storage: Upload });
  

const customStorage = multer.diskStorage({
destination: './uploads/img',
filename: function (req, file, cb) {
    cb(null, file.originalname);
}
});

// Instance multer dengan pengaturan penyimpanan khusus
const customUpload = multer({ storage: customStorage });
  

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Menyediakan akses publik untuk direktori 'uploads/'
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'form')));
// Menangani permintaan GET pada akar URL, menampilkan form unggah gambar

// app.get("/", async (req, res) => {
//     try {
//         const userData = req.cookies.username;
//         // if (!userData) {
//         //     return res.redirect("/login");
//         // }

//         // // Parse data pengguna dari cookie
//         // const { username, email, akses, gambar } = JSON.parse(userData);

//         // Misalnya, ambil semua artikel dari database
//         // const artikel = await Artikel.find();
//         // res.render('beranda', { artikel });
//         res.send("test")
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Terjadi kesalahan beranda');
//     }
// });
app.get("/", async (req, res) => {
    try {
      const userData = req.cookies.userData;
      if (!userData) {
        return res.redirect("/login");
      }
  
      const { username, email, akses, gambar } = JSON.parse(userData);
  
      const artikel = await Artikel.find();
      res.render("beranda", { 
        artikel: artikel,
        username: username, 
        email: email, 
        akses: akses, 
        gambar: gambar 
        });
    } catch (err) {
      console.error(err);
      res.status(500).send(`Error: ${err.message}`);
    }
  });
app.get("/login", async (req, res) => {
    try {
        const akun = await User.find();
        res.render('login', { akun });
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan');
    }
});

app.get("/artikel/:namaArtikel", async (req, res) => {
    try {
      const artikel = await Artikel.findOne({ namaArtikel: req.params.namaArtikel }); // Mencari artikel berdasarkan namaArtikel
      if (!artikel) {
        return res.status(404).send("Artikel tidak ditemukan");
      }
      res.render("detail_artikel", { artikel }); // Merender halaman detail artikel dengan data artikel yang ditemukan
    } catch (err) {
      console.error(err);
      res.status(500).send("Terjadi kesalahan");
    }
  });

app.get("/akun", async (req, res) => {
try {
    const userData = req.cookies.userData;
    if (!userData) {
    return res.redirect("/login");
    }

    const { username, email, akses, gambar } = JSON.parse(userData);

    // const artikel = await Artikel.find();
    res.render("akun", {
    username: username, 
    email: email, 
    akses: akses, 
    gambar: gambar,
    userData: JSON.parse(userData)
    });
} catch (err) {
    console.error(err);
    res.status(500).send(`Error: ${err.message}`);
}
});

router.get('/artikel/:namaArtikel/update', async (req, res) => {
    try {
        const artikel = await Artikel.findOne({ namaArtikel: req.params.namaArtikel });
        if (!artikel) {
        return res.status(404).send();
        }
        res.render('updateArtikel', { artikel });
    } catch (error) {
        res.status(500).send(error);
    }
  });

// Endpoint untuk login
app.post('/login', async (req, res) => {
    const { username, pass } = req.body;
    try {
        // Cari user di database berdasarkan username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).send('Username tidak ditemukan');
        }
        
        // Pastikan 'pass' ada di 'user' sebelum mencoba untuk mencocokkan password
        if (!user.pass || !user.pass.includes(pass)) {
            return res.status(401).send('Password salah');
        }

        // Set cookie dengan nama username
        res.cookie('userData', JSON.stringify({
            username: user.username,
            email: user.email,
            akses: user.akses,
            gambar: user.gambar
        }));
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


router.post('/artikel/:namaArtikel/update', async (req, res) => {
    try {
        // Pisahkan nilai 'ciri' menjadi array jika ada
        if (req.body.ciri) {
            req.body.ciri = req.body.ciri.split(',').map(c => c.trim());
        }
        if (req.body.langkahPenanganan) {
            req.body.langkahPenanganan = req.body.langkahPenanganan.split(',').map(c => c.trim());
        }
        const artikel = await Artikel.findOneAndUpdate(
            { namaArtikel: req.params.namaArtikel },
            req.body,
            { new: true, runValidators: true }
        );

        if (!artikel) {
            return res.status(404).send();
        }

        res.redirect(`/artikel/${req.params.namaArtikel}`);
    } catch (error) {
        res.status(400).send(error);
    }
});


router.post('/artikel/:namaArtikel', async (req, res) => {
    try {
        const artikel = await Artikel.findOneAndDelete({ namaArtikel: req.params.namaArtikel });
        if (!artikel) {
        return res.status(404).send("Artikel tidak ditemukan");
        }
        res.redirect("/");
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/search', async (req, res) => {
    try {
        const keyword = req.body.keyword;
        // Membuat ekspresi reguler dari kata kunci
        const regex = new RegExp(keyword, 'i'); // 'i' berarti tidak case sensitive

        // Mencari artikel yang mengandung keyword dalam namaArtikel
        const artikel = await Artikel.find({ namaArtikel: { $regex: regex } });

        res.render('beranda', { artikel });
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/artikel/:namaArtikel/update-gambar',customUpload.single('gambar'), function(req, res) {
    // Render view (template EJS) dengan data artikel jika diperlukan
    res.render('updateArtikel', { artikel: { namaArtikel: req.params.namaArtikel } });
    });
    app.post('/artikel/:namaArtikel/update-gambar', upload.single('gambar'), async function(req, res) {
        try {
          // Simpan URL gambar baru di variabel
          const gambarBaru = req.file.filename; // Ubah ke URL penyimpanan cloud jika diperlukan
      
          // Dapatkan nama artikel dari parameter URL
          const namaArtikel = req.params.namaArtikel;
      
          // Perbarui gambar artikel dalam MongoDB
          const artikel = await Artikel.findOneAndUpdate(
            { namaArtikel: namaArtikel },
            { gambar: gambarBaru }
          );
      
          // Jika artikel ditemukan dan gambar berhasil diperbarui
          if (artikel) {
            const artikel = await Artikel.findOne({ namaArtikel: req.params.namaArtikel });
            // res.send('Gambar artikel berhasil diperbarui');
            res.render('updateArtikel', { artikel });
          } else {
            res.status(404).send('Artikel tidak ditemukan');
          }
        } catch (err) {
          console.error('Error:', err);
          res.status(500).send('Terjadi kesalahan dalam memperbarui gambar artikel');
        }
      });
app.get("/diagnosa", (req, res) => {
    res.render('diagnosa');
});

app.get('/createArtikel', (req, res) => {
    res.render('createArtikel');
  });
  
// app.post('/artikel', async (req, res) => {
// try {
//     const artikel = new Artikel(req.body);
//     await artikel.save();
//     res.redirect('/');
// } catch (err) {
//     console.error(err);
//     res.status(500).send('Terjadi kesalahan');
// }
// });
app.post('/artikel', customUpload.single('gambar'), async (req, res) => {
    const { namaArtikel, penyebab, ciri, langkahPenanganan } = req.body;
    const gambar = req.file.filename;
    const article = new Artikel({ namaArtikel, penyebab, ciri, langkahPenanganan, gambar });
    await article.save();
    res.redirect('/');
  });
  
// Menangani permintaan POST untuk mengklasifikasikan gambar yang diunggah
// app.post("/image/clasify", upload.single('imageFile'), async (req, res) => {
//     // Jika tidak ada file yang diunggah, kirim respons 400 Bad Request
//     if (!req.file) {
//         return res.status(400).send('No file uploaded.');
//     }

//     // Path dari file yang diunggah
//     const imagePath = req.file.path;

//     // Mengubah nama dan memindahkan file ke direktori 'uploads/' dengan nama asli
//     const newImagePath = `uploads/${req.file.originalname}`;
//     fs.renameSync(imagePath, newImagePath);

//     // URL dari gambar yang diunggah
//     const imageUrl = `http://localhost:${port}/${newImagePath}`;

//     // Mengklasifikasikan gambar menggunakan model machine learning
//     return model
//         .classify({
//             imageUrl: imageUrl, // Gunakan URL file lokal sebagai URL gambar
//         })
//         .then((predictions) => {
//             let responseMessage = ''; // Inisialisasi pesan respons
//             const topPrediction = predictions.reduce((prev, current) => (prev.score > current.score) ? prev : current);
        
//             // Menyiapkan pesan respons berdasarkan prediksi
//             if (topPrediction.class === "blackspot") {
//                 responseMessage = `Kemungkinan tanaman ini terjangkit penyakit ${topPrediction.class} sebesar ${Math.round(topPrediction.score * 100)}%<br><br>Penanganan penyakit hitam pada tanaman jeruk meliputi tindakan sebelum dan setelah panen. Penyakit ini disebabkan oleh jamur Guignardia citricarpa dan gejalanya termasuk bintik hitam di daun yang berkembang menjadi lingkaran kuning, diikuti oleh kuning dan rontoknya daun.<br>Pada tahap pasca-panen, pengendalian dapat dilakukan dengan menggunakan fungisida seperti pyrimethanil, imazalil, fludioxonil, dan thiabendazole. Penggunaannya bisa melalui penyemprotan, penyaputan batang, atau pengumpulan buah yang terinfeksi. Alternatifnya, penggunaan bakteri endofitik Nodulisporium spp. atau aditif makanan yang mengandung sulfur juga bisa dipertimbangkan.<br>Pengendalian penyakit hitam juga melibatkan sanitasi tanaman, seperti pengumpulan dan pembaran daun yang gugur dari pohon sakit, pemangkasan, dan pengumpulan buah yang terinfeksi. Ini membantu mengurangi penyebaran infeksi dan meminimalkan kerusakan tanaman.`;
//             } else if (topPrediction.class === "Canker") {
//                 responseMessage = `Kemungkinan tanaman ini terjangkit penyakit ${topPrediction.class} sebesar ${Math.round(topPrediction.score * 100)}%<br><br>Penanganan kanker pada tanaman jeruk setelah panen dapat dilakukan dengan penggunaan fungisida seperti pyrimethanil, imazalil, fludioxonil, dan thiabendazole. Gejala kanker yang disebabkan oleh jamur Penicillium digitatum meliputi lesi merah muda kebiru-biruan yang berkembang menjadi lesi yang lebih besar dan berwarna merah hingga kehitaman. Metode pengendalian lain termasuk sanitasi tanaman seperti pengumpulan dan pembuangan daun yang gugur, pemangkasan, dan pengambilan buah yang terinfeksi. Selain itu, insektisida seperti Metidation, Abamektin, Dimetoathe, Diazinon, Sipermetrin, dan Imidakloprid juga dapat digunakan melalui penyemprotan atau penyaputan batang.<br><br>Sebagai alternatif, pengendalian kanker pada tanaman jeruk juga dapat dilakukan dengan menggunakan bakteri endofitik Nodulisporium spp. atau aditif makanan yang mengandung sulfur. Praktik-praktik ini, bersama dengan penggunaan fungisida dan tindakan sanitasi lainnya seperti pemangkasan dan pengumpulan buah terinfeksi, dapat membantu mencegah dan mengurangi penyebaran kanker setelah panen.`;
//             } else {
//                 responseMessage = `Tanaman Anda sehat`;
//             }
        
//             // Mengirimkan pesan respons JSON
//             res.json(responseMessage);
//         })        
//         .catch((e) => {
//             // Menangani kesalahan dan mengirim respons 500 Internal Server Error
//             console.error(e);
//             res.status(500).send(`Something went wrong!`);
//         });
// });const Diagnosa = require('./path/to/diagnosaModel'); // Sesuaikan dengan path file model Diagnosa

// app.post("/image/clasify", upload.single('imageFile'), async (req, res) => {
//     // Jika tidak ada file yang diunggah, kirim respons 400 Bad Request
//     if (!req.file) {
//         return res.status(400).send('No file uploaded.');
//     }

//     // Path dari file yang diunggah
//     const imagePath = req.file.path;

//     // Mengubah nama dan memindahkan file ke direktori 'uploads/' dengan nama asli
//     const newImagePath = `uploads/${req.file.originalname}`;
//     fs.renameSync(imagePath, newImagePath);

//     // URL dari gambar yang diunggah
//     const imageUrl = `http://localhost:${port}/${newImagePath}`;

//     // Mengklasifikasikan gambar menggunakan model machine learning
//     return model
//         .classify({
//             imageUrl: imageUrl, // Gunakan URL file lokal sebagai URL gambar
//         })
//         .then(async (predictions) => {
//             let responseMessage = ''; // Inisialisasi pesan respons
//             const topPrediction = predictions.reduce((prev, current) => (prev.score > current.score) ? prev : current);
        
//             // Menyiapkan pesan respons berdasarkan prediksi
//             if (topPrediction.class === "blackspot") {
//                 responseMessage = `blackspot`;
//             } else if (topPrediction.class === "Canker") {
//                 responseMessage = `Canker`;
//             } else {
//                 responseMessage = `Tanaman Anda sehat`;
//             }

//             // Ambil informasi pengguna dari cookie
//             const userData = JSON.parse(req.cookies.userData || '{}');
//             const username = userData.username;

//             // Simpan data diagnosa ke dalam database
//             const diagnosa = new History({
//                 username: username, // Ambil username dari cookie
//                 gambar: imageUrl,
//                 hasil: responseMessage
//             });

//             await diagnosa.save(); // Simpan data diagnosa

//             // Mengirimkan pesan respons JSON
//             res.json(responseMessage);
//         })        
//         .catch((e) => {
//             // Menangani kesalahan dan mengirim respons 500 Internal Server Error
//             console.error(e);
//             res.status(500).send(`Something went wrong!`);
//         });
// });

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
        .then(async (predictions) => {
            // Ambil prediksi teratas
            const topPrediction = predictions.reduce((prev, current) => (prev.score > current.score) ? prev : current);

            // Ambil informasi pengguna dari cookie
            const userData = JSON.parse(req.cookies.userData || '{}');
            const username = userData.username;

            if (!username) {
                return res.status(400).send('Username not found in cookie.');
            }

            // Simpan data diagnosa ke dalam database
            const diagnosa = new History({
                username: username, // Ambil username dari cookie
                gambar: req.file.originalname,
                hasil: topPrediction.class
            });

            await diagnosa.save(); // Simpan data diagnosa

            // Render halaman EJS dengan data yang diperlukan
            res.render('result', { gambar: req.file.originalname, topPrediction: topPrediction });
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
