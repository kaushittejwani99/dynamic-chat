const express = require('express');
const user_route = express();
const path = require("path");
const multer = require('multer');
const userController = require('../controllers/userController');
const bodyParser = require("body-parser");
const session=require("express-session")
user_route.use(session({secret:process.env.SESSION_SECRET}))
const cookieParser=require('cookie-parser');
user_route.use(cookieParser());
const auth=require("../middlewares/auth");

user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));
user_route.set('view engine', 'ejs');
user_route.set('views', './views');

user_route.use(express.static('public'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/images"));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const upload = multer({ storage: storage });  // Move this line up

user_route.get("/register",auth.isLogout, userController.registerLoad);
user_route.post("/register", upload.single('image'), userController.register);
user_route.get("/",auth.isLogout,userController.loadLogin),
user_route.post("/",userController.login)
user_route.get("/logout",auth.isLogin,userController.logout);
user_route.get("/dashboard",auth.isLogin,userController.dashboard)
user_route.post("/savechat",auth.isLogin,userController.saveChat)
user_route.post("/deletechat",auth.isLogin,userController.deleteChat)
user_route.post("/updatechat",auth.isLogin,userController.updateChat)
user_route.get("/group",auth.isLogin,userController.loadgroup)
user_route.post("/group",upload.single('groupImage'),auth.isLogin,userController.createGroup)
user_route.post("/getMembers",auth.isLogin,userController.getMembers)
user_route.post("/addMembers",auth.isLogin,userController.addMembers)
user_route.post("/updateGroup",upload.single('updategroupImage'),auth.isLogin,userController.updateChatGroup)
user_route.post("/deleteGroup",auth.isLogin,userController.deleteGroup)
user_route.get("/share-group/:id",userController.shareGroup)
user_route.post("/joinGroup",auth.isLogin,userController.joinGroup)
user_route.get("/group-chat",auth.isLogin,userController.groupchats)
user_route.post("/savegroupchat",auth.isLogin,userController.saveGroupChat),
user_route.post("/deleteGroupChat",auth.isLogin,userController.deleteGroupChat)
user_route.post("/updateGroupchat",auth.isLogin,userController.updateGroupChat)



user_route.post("/load-group-chats",auth.isLogin,userController.loadGroupChat)








user_route.get("*",function(req,res){
  res.redirect("/login")
})



module.exports = user_route;
 