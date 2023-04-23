const mongoose = require('mongoose');
const express = require("express");
const router = express.Router();
const bcrypt = require('bcryptjs');
require('../db/connection');
const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");


async function authenticate(req,res,next) {
    
    try {
        const token = req.cookies.jwtoken ?? null;
        if(token !== null){
            const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findOne({_id: verifyToken._id},{tokens: 0, password:0});
        console.log(user);
        if(user){
            req.rootUser = user;
            req.userID = verifyToken._id;
            res.jwtoken = token;
        }
        }else{
            console.log('No token provided');
        }
    } catch (error) {
        console.log(error);
    }
    next();
}

module.exports = authenticate;