const mongoose = require('mongoose');
const express = require("express");
const router = express.Router();
const bcrypt = require('bcryptjs');
require('../db/connection');
const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const Authenticate = require("../auth/authentication");
const Task = require('../models/taskSchema');


function response(req, res, respond) {
    return res.json({response: respond});
}

async function userData(req, res, uid) {
    const data = await Task.aggregate([
        {$match: {_id: uid}},
        {$project : {_id:0 } },
        {$unwind: "$myTasks"},
        {$sort: {"myTasks.date": -1}},
     ]) ?? {response: "error"};
    
    return res.json(data);
}

router.get('/edit-profile', async(req,res) => {
    try {
        const token = req.cookies.jwtoken ?? null;
        const uid = req.query.uid;
        if(!token || !uid){
            response(req, res, 'log-out');
        }else{
            const user = await User.findOne({"tokens.token": token},{name:1, email:1, _id:0});
            if(!user){
                response(req, res, 'error');
            }
            return res.json({name: user.name, email: user.email});
        }
    }catch(error){
        console.log(error);
    }

});


//Change Profile Data in Database such as name, email and password.
router.post('/edit-profile', async (req, res) => {
    const {uid, name, email, currentPassword, newPassword, confirmPassword} = req.body;
    if(!uid || (!name && !email && (!currentPassword || !newPassword || !confirmPassword))){
        response(req, res, 'Invalid request!');
    }else{
        try {
        const token = req.cookies.jwtoken ?? null;
        if(!token){
            response(req, res, 'log-out');
        }else{
            const user = await User.findOne({"tokens.token": token},{tokens:0});
            if(!user){
                response(req, res, 'Invalid request!');
            }
            if(name){
                user.name = name;
            }else if(email){
                const alreadyExists = await User.findOne({email: email},{email:1, _id:0});
                if(alreadyExists){
                    response(req, res, 'Account already exists with this Email address!');
                }else{
                    user.email = email;
                }
            }else if(currentPassword !== newPassword && newPassword === confirmPassword){
                const isMatch = await bcrypt.compare(currentPassword, user.password);
                if(isMatch){
                    user.password = newPassword;
                }else{
                    response(req, res, 'Wrong password!');
                }
            }else{
                response(req, res,"New password and Current password are same OR New password and Confirm password aren't same.");
            }

            const isSuccessful = await user.save();
            if(isSuccessful){
                response(req, res, 'Successful');
            }
            response(req, res, 'error');
           }
        } catch (error) {
            console.log(error);
        }
    }
});



//Logout System - Remove JsonWebToken from Database & clear cookies

router.put('/logout', async function(req, res) {
    try {
        const token = req.cookies.jwtoken ?? null;
        if(token){
            const user = jwt.verify(token, process.env.SECRET_KEY);
            await User.updateOne({_id: user._id}, {$pull: {"tokens":{"token":token}}});
            res.cookie("jwtoken", "none", {
                expires: new Date(Date.now() + 100),
                httpOnly: true
            });
        }
        response(req, res, 'log-out');
    }catch(err) {
        console.log(err);
    }

});


// Login System - Match Credentials & store cookies

router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    if(!email || !password){
        return res.status(400).json({error: "All fields required!"});
    }
    try {
        const user = await User.findOne({email:email});
        if(user){
            const isMatch = await bcrypt.compare(password, user.password);
            if(isMatch){
                const token = await user.generateAuthToken();
                res.cookie("jwtoken", token, {
                    expires:new Date(Date.now()+25892000000),
                    httpOnly: true
                });
                return res.json({userID: user._id.toString(), response: 'Successful'}).status(200);
            }
        }
        return res.status(422).json({response: "Invalid Credentials!"});
    } catch (error) {
        console.log(error);
    }
});



//SignUp function - write data in "User" Collection in Mongodb

router.post('/sign-up', async (req, res) => {
    const {name, email, password} = req.body;
    if(!name || !email || !password){
        return res.status(422).json({response: "All fields required!"});
    }
    try{
        const userExist = await User.findOne({email:email});
        if(userExist){
            return res.status(422).json({response: "Email already exists!"});
        }
        const user = new User({name, email, password});
        const registrationSuccessful = await user.save();
        if(registrationSuccessful){
            return res.status(201).json({response: "Successful"});
        }
        return res.status(500).json({response: "error"});

    }catch(err){
        console.log(err);
    }
});



//Add-task on user db

router.post('/add-task', async (req, res) => {
    const {taskName, taskDescription} = req.body;
    if(!taskName || !taskDescription){
        console.log("unfilled");
        return res.status(422).json({error: "Enter details correctly!"});
    }
    try {
        const token = req.cookies.jwtoken ?? null;
        if(!token){
            console.log('No token provided');
            return res.status(422).json({response: "LOGGED-OUT"});
        }
        const user = await User.findOne({"tokens.token": token},{_id:1});
        if(!user){
            return res.json({response: "error"});
        }
        
        var task = await Task.findOne({_id:user._id});

        if(!task){
            task = new Task({_id: user._id});
        }
        
        await task.addTask(taskName,taskDescription);
        userData(req, res, user._id.toString());

    } catch (error) {
        console.log(error);
    }
});




router.post('/delete-task', async (req, res) => {
    try {
        const token = req.cookies.jwtoken ?? null;
        if(!token){
            console.log('No token provided');
            return res.status(422).json({response: "LOGGED-OUT"});
        }else{
            const user = await User.findOne({"tokens.token": token},{_id:1});
            if(!user){
                return res.json({response: "error"});
            }
            await Task.updateOne({_id:user._id}, {$pull: {"myTasks":{"_id": id}}});
            userData(req, res, user._id.toString());
        }
    }catch(error){
        console.log(error);
    }
});




router.post('/update-task', async (req, res) => {
    const {id, taskName, taskDescription} = req.body;
    if(!id || !taskName || !taskDescription){
        console.log("unfilled");
        return res.status(422).json({response: "error"});
    }
    try {
        const token = req.cookies.jwtoken ?? null;
        if(!token){
            console.log('No token provided');
            return res.status(422).json({response: "LOGGED-OUT"});
        }
        const user = await User.findOne({"tokens.token": token},{_id:1});
        if(!user){
            return res.json({response: "error"});
        }
        
        const task = await Task.findOne({_id:user._id});

        if(!task){
            return res.json({response: "error"});
        }
        await Task.updateOne(
            {"myTasks._id":id}, 
            {$set: {"myTasks.$.task": taskName, "myTasks.$.description": taskDescription}}
        );
        userData(req, res, user._id.toString());

    } catch (error) {
        console.log(error);
    }
});





router.get('/authentication', Authenticate,(req, res) => {
    //console.log(req.rootUser);

    if(req.rootUser){
        res.json({result:"OK", userID:req.userID}).status(200);
    }
    
});


router.get('/get-tasks', async(req, res) => {
    try {
        const token = req.cookies.jwtoken ?? null;
        //const uid = req.query.uid;
        if(!token){
            console.log('No token provided');
            return res.status(422).json({response: "LOGGED-OUT"});
        }else{
            const user = await User.findOne({"tokens.token": token},{_id:1});
            if(!user){
                return res.json({response: "error"});
            }
            userData(req, res, user._id.toString());
        }
    }catch(error){
        console.log(error);
    }
});

module.exports = router;
