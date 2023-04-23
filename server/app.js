const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const dotenv = require("dotenv");
dotenv.config({path:"./config.env"});
require('./db/connection');
app.use(express.json());
app.use(require('./router/routes'));



app.listen(process.env.PORT, () => {
    console.log('Server is running at Port '+process.env.PORT);
});