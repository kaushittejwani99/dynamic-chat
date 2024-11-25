const mongoose=require('mongoose');
const groupChatSchema=mongoose.Schema({
   sender_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
   },
   group_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"group"
   },
   message:{
    type:String,
    required:true
   }
},{timestamps:true});

module.exports=mongoose.model('groupChat',groupChatSchema);