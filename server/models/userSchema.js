const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


const UserSchema = mongoose.Schema;
const userSchema = new UserSchema({
    name: {
        type: String,
        required: true
    },
    email: {
    type: String,
    required: true
    },
    password: {
    type: String,
    required: true
    },
    tokens:[
        {
            token: {
                type: String,
                required: true
            }
        }
    ]
});

userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});


userSchema.methods.generateAuthToken = async function(){
    try {
        let token = jwt.sign({_id: this._id},process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token: token});
        await this.save();
        return token;
    } catch (error) {
        console.log(error);
    }
}


userSchema.methods.addTask = async function(){
    try {
        console.log("name");
        //eturn token;
    } catch (error) {
        console.log(error);
    }
}

const User = mongoose.model('user',userSchema);
module.exports = User;