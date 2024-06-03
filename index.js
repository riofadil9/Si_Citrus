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
        const { username, email, password, password1 } = req.body;
        const akses = "2";
        const gambar = "profile.jpeg";
        // Create new user instance and save to database
        const newUser = new User({ username: username, email: email, pass: password, akses: akses, gambar: gambar });
        newUser.save();
        // res.redirect('/login');
        res.cookie('userData', JSON.stringify({
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            pass: newUser.pass,
            akses: newUser.akses,
            gambar: newUser.gambar
        }));
        res.redirect('/');
    } catch(err){
        res.render('alert', { message: 'Error saving user to database.' })
    }
});

app.get("/artikel/:namaArtikel", async (req, res) => {
    try {
      const artikel = await Artikel.findOne({ namaArtikel: req.params.namaArtikel }); // Mencari artikel berdasarkan namaArtikel
      if (!artikel) {
        return res.status(404).send("Artikel tidak ditemukan");
      }
      const userData = req.cookies.userData;
      if (!userData) {
        return res.redirect("/login");
      }
      const { id, username, email, akses, gambar } = JSON.parse(userData);
      let detail_artikel;
      if (akses == "1") {
          detail_artikel = "detail_artikel_admin";
        } else {
          detail_artikel = "detail_artikel";
        }
    //   res.render(detail_artikel, { artikel });
      res.render(detail_artikel, { 
        id:id,
        artikel: artikel,
        username: username, 
        email: email, 
        akses: akses, 
        gambar: gambar 
      }); // Merender halaman detail artikel dengan data artikel yang ditemukan
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
        res.render('alert', { message: 'Artikel tidak ditemukan' })
        }
    } catch (err) {
        console.error('Error:', err);
        res.render('alert', { message: 'Terjadi kesalahan dalam memperbarui gambaar artikel' })
    }
    });

router.get('/artikel/:namaArtikel/update', async (req, res) => {
    try {
        const artikel = await Artikel.findOne({ namaArtikel: req.params.namaArtikel });
        if (!artikel) {
        return res.status(404).send();
        }
        const userData = req.cookies.userData;
        if (!userData) {
            return res.redirect("/login");
        }
        const { id, username, email, akses, gambar } = JSON.parse(userData);
        res.render('updateArtikel', { 
            id:id,
            artikel: artikel,
            username: username, 
            email: email, 
            akses: akses, 
            gambar: gambar 
          });
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
            return res.render('alert', { message: 'Username tidak ditemukan' })
        }
        
        // Pastikan 'pass' ada di 'user' sebelum mencoba untuk mencocokkan password
        if (user.pass !== pass) {
            return res.render('alert', { message: 'Password salah' })
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
        res.render('alert', { message: 'server error' })
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
    const { username, email, password} = req.body;
  
    try {
      const user = await User.findOne({ username, email });
  
      if (!user) {
        return res.render('alert', { message: 'User not found' });
      }
  
      user.pass = password;
      await user.save();
  
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
      res.status(500).render('alert', { message: 'Server error' });
    }
});

app.post('/ubah-akun', async (req, res) => {
    
    
    try {
      const { id, username, email, password } = req.body;
      // Cari dan update pengguna berdasarkan ID
      const user = await User.findByIdAndUpdate(id, { username, email, pass: password }, { new: true, runValidators: true });
  
      if (!user) {
        res.render('alert', { message: 'User not found' })
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
      res.render('alert', { message: 'server error' })
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
            req.body.ciri = req.body.ciri.split(';').map(c => c.trim());
        }
        if (req.body.langkahPenanganan) {
            req.body.langkahPenanganan = req.body.langkahPenanganan.split(';').map(c => c.trim());
        }
        const artikel = await Artikel.findOneAndUpdate(
            { namaArtikel: req.params.namaArtikel },
            req.body,
            { new: true, runValidators: true }
        );

        if (!artikel) {
            return res.render('alert', { message: 'No artikel' })
        }

        res.redirect(`/artikel/${req.params.namaArtikel}`);
    } catch (error) {
        res.render('alert', { message: error})
    }
});


router.post('/artikel/:namaArtikel', async (req, res) => {
    try {
        const artikel = await Artikel.findOneAndDelete({ namaArtikel: req.params.namaArtikel });
        if (!artikel) {
        return res.render('alert', { message: 'Artikel tidak ditemukan' })
        }
        res.redirect("/");
    } catch (error) {
        res.render('alert', { message: error })
    }
});

router.post('/search', async (req, res) => {
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
        const keyword = req.body.keyword;
        // Membuat ekspresi reguler dari kata kunci
        const regex = new RegExp(keyword, 'i'); // 'i' berarti tidak case sensitive

        // Mencari artikel yang mengandung keyword dalam namaArtikel
        const artikel = await Artikel.find({ namaArtikel: { $regex: regex } });

        res.render(beranda, { 
            artikel: artikel,
            id: id,
            username: username, 
            email: email, 
            akses: akses, 
            gambar: gambar 
          });
    } catch (error) {
        res.render('alert', { message: error })
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
    res.render('alert', { message: 'Artikel tidak ditemukan' });
    }
} catch (err) {
    console.error('Error:', err);
    res.render('alert', { message: 'Terjadi kesalahan dalam memperbarui gambar artikel' });
}
});
app.get("/diagnosa", async (req, res) => {
    // Ambil username dari cookie userData
    const userData = req.cookies.userData;
    if (!userData) {
        return res.redirect("/login");
    }

    const { id, username, email, akses, gambar } = JSON.parse(userData);

    try {
        // Cari history diagnosa berdasarkan username
        // const history = await History.find({ username: username }).exec();
        const history = await History.find({ username: username });
        // Kirim history sebagai respons
        res.render('diagnosa', { 
            history: history, 
            id: id,
            username: username, 
            email: email, 
            akses: akses, 
            gambar: gambar  
        });
    } catch (error) {
        console.error(error);
        res.render('alert', { message: error });
    }
});

app.post('/history', async (req, res) => {
    try {
        const id = req.body.id; // Extract id from request body
        console.log(`Received request for history with ID: ${id}`);
        
        const diagnosa = await History.findOne({ _id: id }); // Query the History model using the id
        if (!diagnosa) {
            console.log('History not found for ID:', id);
            return res.render('alert', { message: 'History not found' });
        }

        const penyakit = await Artikel.findOne({ namaArtikel: diagnosa.hasil.class });
        if (!penyakit) {
            console.log('No article found for the disease class:', diagnosa.hasil.class);
            return res.render('alert', { message: 'Article not found for the diagnosed disease class' });
        }

        console.log('History found:', diagnosa);
        let result;
        if(diagnosa.hasil.class=="healthy"){
            result = 'result_healthy';
        }else{
            result = 'result';
        }
        res.render(result, { item: diagnosa, penyakit: penyakit }); // Render the result page with the data obtained
    } catch (error) {
        console.error('Error fetching history:', error);
        res.render('alert', { message: error });
    }
});


app.get('/createArtikel', (req, res) => {
    // res.render('createArtikel');
    try {
        const userData = req.cookies.userData;
        if (!userData) {
          return res.redirect("/login");
        }
    
        const { id, username, email, akses, gambar } = JSON.parse(userData);
        let createArtikel;
        if (akses == "1") {
            createArtikel = "createArtikel";
          } else {
              createArtikel = "beranda";
          }
        res.render(createArtikel, { 
          id: id,
          username: username, 
          email: email, 
          akses: akses, 
          gambar: gambar 
        });
      } catch (err) {
        console.error(err);
        res.render('alert', { message: err.message });
      }
  });
  

app.post('/artikel', customUpload.single('gambar'), async (req, res) => {
    try{

        const { namaArtikel, penyebab, ciri, langkahPenanganan } = req.body;
        const gambar = req.file.filename;
        const article = new Artikel({ namaArtikel, penyebab, ciri, langkahPenanganan, gambar });
        await article.save();
        res.redirect('/');
    } catch(e) {
        res.redirect('/');
    }
  });

app.post("/image/clasify", upload.single('imageFile'), async (req, res) => {
    // Jika tidak ada file yang diunggah, kirim respons 400 Bad Request
    if (!req.file) {
        return res.render('alert', { message: "no file uploaded" });
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
            const penyakit = await Artikel.findOne({namaArtikel: diagnosa.hasil.class});
            // Render halaman EJS dengan data yang diperlukan
            let result;
            if(diagnosa.hasil.class=="healthy"){
                result = 'result_healthy';
            }else{
                result = 'result';
            }
            res.render(result, { item: diagnosa, penyakit: penyakit });
        })        
        .catch((e) => {
            // Menangani kesalahan dan mengirim respons 500 Internal Server Error
            console.error(e);
            res.render('alert', { message: e });
        });
});
// Mendengarkan permintaan pada port yang telah ditentukan
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
