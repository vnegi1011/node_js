const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


const TaskSchema = mongoose.Schema;
const taskSchema = new TaskSchema({
    _id: {
        type: String,
        required: true
    },
    myTasks: [
        {
            task: {
                type: String,
                required: true
                },
            description: String,
            completed: Boolean,
            date: {
                type: Date,
                default: Date.now,
            },
        }
    ],
});

taskSchema.methods.addTask = async function(name, description){
    try {
        this.myTasks = this.myTasks.concat({task:name, description:description, completed:false});
        await this.save();
    } catch (error) {
        console.log(error);
    }
}

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;