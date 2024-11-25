const mongoose=require('mongoose');
const memberSchema=mongoose.Schema({
   group_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"group"
   },
  user_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  }
},{timestamps:true});

module.exports=mongoose.model('Members',memberSchema);