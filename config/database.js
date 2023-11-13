const mongoose = require('mongoose');
require('dotenv').config();

console.log("MONGODB_URI: ", process.env.MONGODB_URI)

exports.dbConnect = () => {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {console.log("Database Connection: SUCCESS")})
    .catch((err) => {
        console.log("Database Connection: ERROR");
        console.error(err);
        process.exit(1);
    });
}