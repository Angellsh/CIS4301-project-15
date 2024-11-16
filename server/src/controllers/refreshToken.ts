import * as jwt from 'jsonwebtoken'
import * as dotenv from "dotenv"; 
import {Request, Response} from 'express'
dotenv.config()

export const refreshToken = async (req : Request , res: Response): Promise<void> =>{
    const {refreshToken}  = req.cookies;
    if(! refreshToken) {
      console.log("No refresh token provided")
       res.status(401);
       return;
    }
    try{
      const user = jwt.verify(req.cookies.refreshToken, process.env.JWT_SECRET as string);
      if(!user) {
        res.status(401).json({error: "Invalid refresh token"});
        return;
      }
      const accessToken = jwt.sign({email: user}, process.env.JWT_SECRET as string, {'expiresIn': '5m'});
      console.log(`New token has been generated ${accessToken}`)
      res.json({token: accessToken})
    }
    catch(error){
      console.log("Generating a refresh token failed.")
      console.log(error);
      res.status(500).json({ error: "Login failed." });
    }
  };

export default {refreshToken}