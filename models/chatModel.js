const mongoose=require('mongoose');
const chatSchema=mongoose.Schema({
   sender_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
   },
   reciever_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
   },
   message:{
    type:String,
    required:true
   }
},{timestamps:true});

module.exports=mongoose.model('chat',chatSchema);