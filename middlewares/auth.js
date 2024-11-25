const isLogin=async(req,res,next)=>{
    try{
       if(req.session.user){
       }
       else{
        res.render("/")
       }
       next()
    }catch(error){
        console.log(error.message);
    }
}
const isLogout=async(req,res,next)=>{
    try{
       if(req.session.user){
        res.render("dashboard")
       }
       next()
    }catch(error){
        console.log(error.message)
    }
}

module.exports={isLogin,isLogout}