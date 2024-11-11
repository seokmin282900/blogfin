const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const methodOverride = require('method-override');
const User = require('./models/user'); // 사용자 모델 추가
const session = require('express-session'); // 세션 관리 추가

const app = express();

// Connect to MongoDB (make sure you have MongoDB installed and running)
mongoose.connect('mongodb+srv://cco10004:ok282900@cluster0.sqiki.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// 세션 설정
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Define the Blog Post model
const Post = mongoose.model('Post', {
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});

// Routes
app.get('/', async (req, res) => {
  const posts = req.session.userId ? await Post.find().sort({ createdAt: 'desc' }) : [];
  res.render('index', { posts, isLoggedIn: !!req.session.userId });
});

app.get('/post/new', (req, res) => {
  res.render('new');
});

app.post('/post/new', async (req, res) => {
  const post = new Post({
    title: req.body.title,
    content: req.body.content
  });
  await post.save();
  res.redirect('/');
});

app.get('/post/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  res.render('post', { post });
});

app.delete('/post/:id', async (req, res) => {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect('/');
});

app.get('/post/:id/edit', async (req, res) => {
    const post = await Post.findById(req.params.id);
    res.render('edit', { post });
});

app.put('/post/:id', async (req, res) => {
    const { title, content } = req.body;
    await Post.findByIdAndUpdate(req.params.id, { title, content });
    res.redirect('/');
});

// 회원가입 페이지
app.get('/register', (req, res) => {
  res.render('register');
});

// 회원가입 처리
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const user = new User({ username, password });
  await user.save();
  res.redirect('/login');
});

// 로그인 페이지
app.get('/login', (req, res) => {
  res.render('login', { session: req.session });
});

// 로그인 처리
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) {
    req.session.userId = user._id; // 세션에 사용자 ID 저장
    res.redirect('/');
  } else {
    req.session.errorMessage = "아이디나 비밀번호를 다시 확인해 주세요."; // 에러 메시지 저장
    res.redirect('/login'); // 로그인 실패 시
  }
});

// 로그아웃 처리
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/'); // 에러 발생 시 메인 화면으로 리다이렉트
        }
        res.redirect('/'); // 로그아웃 후 메인 화면으로 리다이렉트
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});