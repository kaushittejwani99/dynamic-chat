
const user=require("../models/userModel");
const bcrypt=require("bcryptjs");
const chatModel=require("../models/chatModel");
const groupModel=require("../models/groupModel");
const memberModel=require("../models/memberModel");
const groupChatModel=require("../models/groupChatModel");
const mongoose=require('mongoose');
exports.registerLoad=async(req,res)=>{
    try{
      res.render('register')

    }catch(error){
        res.status(400).send(error);
    }
}
exports.register=(async(req,res)=>{
    try{
      const {email,name,password}=req.body;

      const newPassword= await bcrypt.hashSync(password,10)
      const newUser=new user({
        name,
        email,
        password:newPassword,
        image:"images/"+req.file.filename
      })

    await newUser.save()



     res.render('register',{message:"Registration succesfully"})

    }catch(error){
        res.status(400).send(error);
    }
})
exports.loadLogin=async(req,res)=>{
    try{
      res.render('login')

    }catch(error){
        res.status(400).send(error);
    }
}
exports.login=(async(req,res)=>{
    try{
      const {email,password}=req.body;

     const userData=await user.findOne({email:email})

     if(userData){
       const pm= await bcrypt.compare(password,userData.password)
       if(pm){
        req.session.user=userData
        res.cookie('user',JSON.stringify(userData))
        res.redirect("/dashboard")
       }else{
        res.render('login',{message:"email or password is incorrect"})

       }
     }else{
        res.render('login',{message:"email or password is incorrect"})
     }

     


     res.render('register',{message:"Registration succesfully"})

    }catch(error){
        res.status(400).send(error);
    }
})
exports.logout=(async(req,res)=>{
    try{
        req.session.destroy();
        res.clearCookie('user');
        res.redirect("/");

    }catch(error){
        res.status(400).send(error);
    }
})
exports.dashboard=(async(req,res)=>{
    try{
    const users=await user.find({});
    if(users){
        
       const user= users.filter((user)=>{
            return user.name!==req.session.user.name
            
          }) 
            res.render('dashboard',{user:req.session.user,userList:user})
        }else{
            res.render('dashboard',{message:"there is not user"})
        }
      

    

    }catch(error){
        res.status(400).send(error);
    }
})
exports.saveChat = async (req, res) => {
    try {
        let newChat = new chatModel({
            sender_id: req.body.sender_id,
            reciever_id: req.body.reciever_id,
            message: req.body.message
        });

       let newChatSave = await newChat.save();
        res.status(200).json({ success: true, message: newChatSave });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteChat=async(req,res)=>{
try{
    await chatModel.deleteOne({_id:req.body._id})
    res.status(200).send({success:true})
}catch(error){
    res.status(400).send({success:false,message:error.message})
}
}

exports.updateChat = async (req, res) => {
    try {
        const updatedChat = await chatModel.findByIdAndUpdate(
            req.body._id,
            { $set: { message: req.body.message } },
            { new: true } // This option returns the updated document
        );

        if (updatedChat) {
            console.log('Updated data:', updatedChat);
            res.status(200).send({ success: true, message: 'Chat updated successfully', data: updatedChat });
        } else {
            res.status(404).send({ success: false, message: 'Chat not found' });
        }
    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
};

exports.loadgroup=async(req,res)=>{
     try{
      const groupChats= await groupModel.find({creator_id:req.session.user._id});

        res.render('group',{groups:groupChats});

     }catch(error){
      console.log(error.message)
     }
}
exports.createGroup=async(req,res)=>{
    try{

        const group = new groupModel({
            creator_id:req.session.user._id,
            name:req.body.name,
            image:"images/"+req.file.filename,
            limit:req.body.limit
        })
        await group.save()
        const groupChats= await groupModel.find({creator_id:req.session.user._id});
        res.render('group',{message:req.body.name + " Group created successfully",groups:groupChats});
    }catch(error){
    console.log(error.message)
    }
}
exports.getMembers = async (req, res) => {
    console.log("group_id",req.body)

    const groupId =  new mongoose.Types.ObjectId(req.body.group_id);
    console.log("groupId",groupId);
     const userId = new mongoose.Types.ObjectId(req.session.user._id);
    try {
        
        const users = await user.aggregate([
          {
               $lookup: {
                    from: "members",
                    localField: "_id",
                    foreignField: "user_id",
                   pipeline: [
                        {
                           $match: {
                               $expr: {
                                  $and:[
                                     { $eq: ["$group_id", groupId]}

                                    ]

                               }
                           }
                        }
                    ],
                    as: "members"
               }
           },
           {
                $match: {
                    "_id": {
                       $nin: [userId]
               }
                }
            }
         ]);
          res.status(200).send({ success: true ,users:users});
    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
};
exports.addMembers = async (req, res) => {
    try {

      
        console.log(req.body)
           if(!req.body.members){

           res.status(200).send({success:false,msg:"Please select atleast 1 Member "})

           }
           else if(req.body.members.length>parseInt(req.body.limit)){

            res.status(200).send({success:false,msg:"You should only add upto"+req.body.limit+" Members in this group"})
           }
           else{
            await memberModel.deleteMany({group_id:req.body.group_id});
            var data=[]
            const members=req.body.members;
            const groupId=req.body.groupId;
			for(let i=0;i<members.length;i++){
				data.push({
					group_id:groupId,
					user_id:members[i]
				});
			} 
		    await memberModel.insertMany(data); 
            res.status(200).send({ success: true ,msg:"Members added successfully"});
           }
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

exports.updateChatGroup = async (req, res) => {
    try {
      console.log("Function called with data:", req.body);
  
      if (parseInt(req.body.limit) < parseInt(req.body.lastLimited)) {
        await memberModel.deleteMany({ group_id: req.body.id });
      }
  
      const updateObj = req.file
        ? {
            name: req.body.name,
            image: "images/" + req.file.filename,
            limit: req.body.limit,
          }
        : {
            name: req.body.name,
            limit: req.body.limit,
          };
  
      await groupModel.findByIdAndUpdate(req.body.id, { $set: updateObj });
  
      return res.status(200).send({ success: true, msg: "Group updated successfully" });
    } catch (error) {
      console.error("Error updating group:", error);
      return res.status(500).send({ success: false, msg: "Internal server error" });
    }
  };

  exports.deleteGroup=async(req,res)=>{
    try{ 

        let groupId = req.body.id.trim(); // Remove any extra whitespace
        groupId = groupId.replace(/^"+|"+$/g, ""); 
        const objectId = new mongoose.Types.ObjectId(groupId);
        
        await groupModel.deleteOne({_id:objectId});
        await memberModel.deleteMany({group_id:objectId})

      res.status(200).send({success:true,msg:"Group deleted successfully"})
      
    }catch(error){
      console.error("Error updating group:", error);

     res.status(200).send({success:false,message:error.message})
    }
  }

  exports.shareGroup=async(req,res)=>{
    let groupId = req.params.id.trim(); // Remove any extra whitespace
        groupId = groupId.replace(/^"+|"+$/g, ""); 
        const objectId = new mongoose.Types.ObjectId(groupId);
    var groupData=await groupModel.findOne({_id:objectId})
    console.log(groupData);
    if(!groupData){
        res.render('error',{message:"404 not found"})
    }
    else if(req.session.user==undefined){
        
        res.render('error',{message:"You need to login to access the shared url"})

    }else{
        var totalMembers = await memberModel.countDocuments({ group_id: req.params.id });

        var available = groupData.limit-totalMembers;
        var isOwner=groupData.creator_id==req.session.user._id?true:false;
        var isJoined = await memberModel.countDocuments({ 
            group_id: req.params.id, 
            user_id: req.session.user._id 
          });
        res.render('sharelink',{group:groupData,totalMembers:totalMembers,isOwner:isOwner,isJoined:isJoined,available:available})
    }
  }
  exports.joinGroup=async(req,res)=>{
    try{

    const groupId=req.body.id;
     const newMember=   await memberModel.create({group_id:groupId,user_id:req.session.user._id})
     if(newMember){
        res.status(200).send({success:true,message:"group joined successfully "})
     }
        
    }catch(error){
        console.error(error.message)
        res.status(500).send({success:false,msg:error})
    }
  }
  exports.groupchats=async(req,res)=>{
    try{

     const creatorId=new mongoose.Types.ObjectId(req.session.user._id)   
    const myGroups=await groupModel.find({creator_id:creatorId});
     const JoinedGroups= await memberModel.find({user_id:creatorId}).populate('group_id');
     console.log("joinedGroups",JoinedGroups);

    res.render('groupChat',{myGroups:myGroups,JoinedGroups:JoinedGroups})
    }catch(error){
        console.error(error)
        res.render('groupChat',{message:error})

    }
  }
  exports.saveGroupChat = async (req, res) => {
    try {
        const saveGroupChat = await groupChatModel.create({
            sender_id: req.body.sender_id,
            group_id: req.body.groupId,
            message: req.body.message,
        });
        const cChat = await groupChatModel.findOne({ _id: saveGroupChat._id }).populate('sender_id'); // Add 'await' here
        if (saveGroupChat) {
            res.status(200).send({ success: true, msg: "Chat successfully saved", chat: cChat });
        }
    } catch (error) {
        console.error('Error saving chat:', error);
        res.status(500).send({ success: false, msg: "Internal server error" });
    }
};

  exports.loadGroupChat=async(req,res)=>{
    try{
      const groupChats=await groupChatModel.find({group_id:req.body.groupId}).populate('sender_id')
      res.status(200).send({success:true,chats:groupChats})
    }catch(error){
        console.error(error)
        res.status(500).send({success:false,msg:"Internal server error"})

    }
  }
  exports.deleteGroupChat=async(req,res)=>{
    try{
        let groupId = req.body.id;
        const objectId = new mongoose.Types.ObjectId(groupId);
        

    await groupChatModel.deleteOne({_id:objectId});
    res.status(200).send({success:true,msg:"message deleted successfully"})
    }catch(error){
      console.error(error)
      res.status(500).send({success:false,msg:"Internal server error"})

    }
    
  }

  exports.updateGroupChat = async (req, res) => {
    try {
        const updatedChat = await groupChatModel.findByIdAndUpdate(
            req.body._id,
            { $set: { message: req.body.message } },
            { new: true } // This option returns the updated document
        );

        if (updatedChat) {
            console.log('Updated data:', updatedChat);
            res.status(200).send({ success: true, message: 'Chat updated successfully', data: updatedChat });
        } else {
            res.status(404).send({ success: false, message: 'Chat not found' });
        }
    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
};
  
  



