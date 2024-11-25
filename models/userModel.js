const { TimestampStyles } = require('discord.js');
const mongoose=require('mongoose');
const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        requiree:true
    },
    image:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_online:{
        type:Number,
        default:0
    }
},{timestamps:true});

module.exports=mongoose.model('user',userSchema);