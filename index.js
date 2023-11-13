const express = require('express');
const app = express();

const userRoutes = require('./routes/User');
const profileRoutes = require('./routes/Profile');
const courseRoutes = require('./routes/Course');
const paymentRoutes = require('./routes/Payments');
const contactUsRoutes = require('./routes/ContactUs');

require('dotenv').config();
const database = require('./config/database');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {cloudnairyConnect} = require('./config/cloudinary');
const fileUpload = require('express-fileupload');

const PORT = process.env.PORT || 8000;
database.dbConnect();

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: [process.env.FRONTEND_URL, 'https://kwikskill-by-kkv.vercel.app/'],
        credentials: true,
    })
);
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: '/tmp',
    })
);

cloudnairyConnect();

app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/course', courseRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/', contactUsRoutes);

app.get('/', (req, res) => {
    return res.json({
        success: true,
        message: "Server Is Running....",
    })
});

app.listen(PORT, () => {
    console.log(`Server Started at Port: ${PORT}`);
});

