const AuthDal=require("../dal/auth-memory-accessor");
const userDal = require("../dal/user-memory-accessor");
const bcrypt= require('bcrypt')
const initiatorDal = require("../dal/initiator-memory-accessor");
const jwt= require('jsonwebtoken')


class AuthController{

    register = async (req, res) => {
        const {name, userName, email, password, role } = req.body
        if ( !userName || !password) {// Confirm data
            return res.status(400).json({ message: 'All fields are required' })
            }

        const duplicate=await AuthDal.getUserByUserName(userName); 
        if(duplicate){
            return res.status(409).json({message:"Duplicate username"})
            }
        
        //
        const {hp,phone,address,tama38,pinuyBinuy,description,logo,company_name}=req.body;
        if(role=='initiator') {
            if( !hp || !tama38 || !pinuyBinuy || !name){
                console.log(`${hp},${tama38},${pinuyBinuy},${name}`)
                return res.status(400).json({message:"required fields for initiator"});
            };
            }  
            
        const hashedPwd = await bcrypt.hash(password, 10);    
        const userObject = {name,email,userName,password:hashedPwd}        
        const user=await AuthDal.register(userObject);
            if(!user)
                return res.status(400).json({ message: 'Invalid user data'});

        if(role=='initiator'){       
        const id= user.toJSON().Id;
        const initiatorData={id,hp,phone,address,tama38,pinuyBinuy,description,logo,name,company_name};

            const initiator=await initiatorDal.addInitiator(initiatorData); 
            if(!initiator)
            {
                await userDal.deleteUserById(id)
                return res.status(400).json({ message: 'Invalid initiator data'});
            }

        }
        return res.status(201).json({ message: `New  ${role||'user'} created` })
    }
    login = async (req, res) => {
        const { userName, password } = req.body
        if (!userName || !password) {
            return res.status(400).json({ message: 'All fields are required'
            })
            }

            var foundUser = await AuthDal.getUserByUserName(userName);
                if (!foundUser || !foundUser.active) {
                    console.log('here');
                return res.status(401).json({ message: 'Unauthorized' })
                }
                foundUser=foundUser.toJSON();
            const match = await bcrypt.compare(password, foundUser.password);
            if (!match) 
                return res.status(401).json({ message: 'Unauthorized after bcrypt' });
            const userInfo= {id:foundUser.id,name:foundUser.name,role:foundUser.role, userName:foundUser.userName}
            console.log(userInfo);

            const accessToken = jwt.sign(userInfo,process.env.ACCESS_TOKEN_SECRET);
            res.json({accessToken:accessToken})
            // res.send("Logged In")          
    //await AuthDal.login();

    }
}
const authController = new AuthController();
module.exports = authController;





//?????????? ???? ???????? name ??????????