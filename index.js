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

app.get("/", async (req, res) => {
    try {
      const userData = req.cookies.userData;
      if (!userData) {
        return res.redirect("/login");
      }
  
      const { id, username, email, akses, gambar } = JSON.parse(userData);
      let beranda;
      if (akses == "1") {
          beranda = "beranda_admin";
        } else {
            beranda = "beranda";
        }
  
      const artikel = await Artikel.find();
      res.render(beranda, { 
        artikel: artikel,
        id: id,
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
app.get("/signup", async (req, res) => {
    try {
        res.render('signup');
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan');
    }
});

app.post('/signup', (req, res) => {
    try{
        const { username, email, password } = req.body;
        const akses = "2";
        const gambar = "profile.jpeg";
        // Create new user instance and save to database
        const newUser = new User({ username, email, password, akses, gambar });
        newUser.save();
        res.redirect('/login');
    } catch(err){
        res.status(500).send('Error saving user to database.');
    }
});

app.get("/artikel/:namaArtikel", async (req, res) => {
    try {
      const artikel = await Artikel.findOne({ namaArtikel: req.params.namaArtikel }); // Mencari artikel berdasarkan namaArtikel
      if (!artikel) {
        return res.status(404).send("Artikel tidak ditemukan");
      }
      const userData = req.cookies.userData;
      const { id, username, email, akses, gambar } = JSON.parse(userData);
      let detail_artikel;
      if (akses == "1") {
          detail_artikel = "detail_artikel_admin";
        } else {
          detail_artikel = "detail_artikel";
        }
      res.render(detail_artikel, { artikel }); // Merender halaman detail artikel dengan data artikel yang ditemukan
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

    const { id, username, email,pass, akses, gambar } = JSON.parse(userData);

    // const artikel = await Artikel.find();
    res.render("akun", {
    id: id,
    username: username, 
    email: email, 
    pass: userData.pass,
    akses: akses, 
    gambar: gambar,
    userData: JSON.parse(userData)
    });
} catch (err) {
    console.error(err);
    res.status(500).send(`Error: ${err.message}`);
}
});

app.get("/ubah-akun", async (req, res) => {
    try {
        const userData = req.cookies.userData;
        if (!userData) {
        return res.redirect("/login");
        }
    
        const { id, username, email,pass, akses, gambar } = JSON.parse(userData);
    
        // const artikel = await Artikel.find();
        res.render("ubah_akun", {
        id: id,
        username: username, 
        email: email, 
        pass: userData.pass,
        akses: akses, 
        gambar: gambar,
        userData: JSON.parse(userData)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(`Error: ${err.message}`);
    }
    });
    
app.get("/riwayat-user", async (req, res) => {
    try {
      const userData = req.cookies.userData;
      if (!userData) {
        return res.redirect("/login");
      }
  
      const { id, username, email, akses, gambar } = JSON.parse(userData);
      let beranda;
      if (akses == "1") {
          beranda = "riwayat_user";
        } else {
          beranda = "beranda";
        }
  
      const artikel = await User.find();
      res.render(beranda, { 
        id:id,
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

app.post('/akun/update-gambar', customUpload.single('gambar'), async function(req, res) {
    try {
        // Simpan URL gambar baru di variabel
        const gambarBaru = req.file.filename; // Ubah ke URL penyimpanan cloud jika diperlukan
        const userData = req.cookies.userData;
        const { id, username, email, akses, gambar } = JSON.parse(userData);
        // Dapatkan nama artikel dari parameter URL
        const namaArtikel = req.params.namaArtikel;
    
        // Perbarui gambar artikel dalam MongoDB
        const artikel = await User.findOneAndUpdate(
        { username: username },
        { gambar: gambarBaru }
        );
    
        // Jika artikel ditemukan dan gambar berhasil diperbarui
        if (artikel) {
        // const artikel = await User.findOne({ username: username });
        res.clearCookie('userData');
        res.cookie('userData', JSON.stringify({
            username: artikel.username,
            id: artikel._id,
            email: artikel.email,
            pass: artikel.pass,
            akses: artikel.akses,
            gambar: gambarBaru
        }));
        // res.send('Gambar artikel berhasil diperbarui');
        res.redirect("/akun")
        } else {
        res.status(404).send('Artikel tidak ditemukan');
        }
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Terjadi kesalahan dalam memperbarui gambar artikel');
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
            id: user._id,
            username: user.username,
            email: user.email,
            pass: user.pass,
            akses: user.akses,
            gambar: user.gambar
        }));
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/lupa-pass', (req, res) => {
    res.render('lupa');
  });

app.post('/lupa-pass', async(req,res)=>{
    const { username, email } = req.body;
    try {
        const user = await User.findOne({ username, email });
        if (!user) {
          return res.render('alert', { message: 'User not found' });
        }
    
        // Generate token and send email logic here...
    
        res.render('pass',{username, email});
    } catch (err) {
        res.status(500).render('alert', { message: 'Server error' });
    }
})
app.post('/ubah-pass', async (req, res) => {
    const { username, email, password, password1 } = req.body;
  
    try {
      const user = await User.findOne({ username, email });
  
      if (!user) {
        return res.render('alert', { message: 'User not found' });
      }
  
      user.pass = password;
      await user.save();
  
      res.render('alert', { message: 'Password has been updated' });
    } catch (err) {
      res.status(500).render('alert', { message: 'Server error' });
    }
});

app.post('/ubah-akun', async (req, res) => {
    
    const { id, username, email, password } = req.body;
  
    try {
      // Cari dan update pengguna berdasarkan ID
      const user = await User.findByIdAndUpdate(id, { username, email, pass: password }, { new: true, runValidators: true });
  
      if (!user) {
        return res.status(404).send('User not found');
      }
      res.clearCookie('userData');
      res.cookie('userData', JSON.stringify({
        id: user._id,
        username: user.username,
        email: user.email,
        pass: user.pass,
        akses: user.akses,
        gambar: user.gambar
        }));
  
      console.log('User updated successfully:', user);
      res.redirect('/akun');
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).send('Server error');
    }
  });
app.get('/logout', (req, res) => {
    // Menghapus cookie bernama 'token'
    res.clearCookie('userData');
    res.redirect("/");
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
app.get("/diagnosa", async (req, res) => {
    // Ambil username dari cookie userData
    const userData = JSON.parse(req.cookies.userData || '{}');
    const username = userData.username;

    if (!username) {
        return res.status(400).send('Username not found in cookie.');
    }

    try {
        // Cari history diagnosa berdasarkan username
        // const history = await History.find({ username: username }).exec();
        const history = await History.find({ username: username });
        // Kirim history sebagai respons
        res.render('diagnosa', { history: history, gambar: "Logo.png" , topPrediction: {class: "isi terlebih dahulu", score: 0} });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/history', async (req, res) => {
    try {
        const id = req.body.id; // Ekstrak id dari body permintaan
        console.log(`Received request for history with ID: ${id}`);
        
        const diagnosa = await History.findOne({ _id: id }); // Query model History menggunakan id
        const penyakit = await Artikel.findOne({namaArtikel: diagnosa.hasil.class});
        if (diagnosa) {
            console.log('History found:', diagnosa);
            res.render('result', { item: diagnosa, penyakit: penyakit }); // Render halaman hasil dengan data yang diperoleh
        } else {
            console.log('History not found for ID:', id);
            res.status(404).send('History not found');
        }
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/createArtikel', (req, res) => {
    res.render('createArtikel');
  });
  

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
//             // Ambil prediksi teratas
//             const topPrediction = predictions.reduce((prev, current) => (prev.score > current.score) ? prev : current);

//             // Ambil informasi pengguna dari cookie
//             const userData = JSON.parse(req.cookies.userData || '{}');
//             const username = userData.username;

//             if (!username) {
//                 return res.status(400).send('Username not found in cookie.');
//             }

//             // Simpan data diagnosa ke dalam database
//             const diagnosa = new History({
//                 username: username, // Ambil username dari cookie
//                 gambar: req.file.originalname,
//                 hasil: topPrediction,
//             });

//             await diagnosa.save(); // Simpan data diagnosa

//             // Render halaman EJS dengan data yang diperlukan
//             res.render('result', { item: diagnosa });
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
                hasil: topPrediction,
            });

            await diagnosa.save(); // Simpan data diagnosa

            // Render halaman EJS dengan data yang diperlukan
            res.render('result', { item: diagnosa });
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
