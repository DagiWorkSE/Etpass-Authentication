module.exports = (req, res, next)=>{
    const {first_name, last_name, email, password, confirm_Password} = req.body;
    function validateEmail(userEmail){
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userEmail);
    }
    if(req.path === "/signup"){
        if(![first_name, last_name, email, password, confirm_Password].every(Boolean)){
            return res.json("Missing Credentials");
        }
        else if (!validateEmail(email)){
            return res.json("Incorrect Email");
        }
    }
    else if(req.path === "/login"){
        if(![email,password].every(Boolean)){
            return res.json("Missing Credentials");
        }
        else if (!validateEmail(email)){
            return res.json("Incorrect Email");
        }
    }
    next();
}