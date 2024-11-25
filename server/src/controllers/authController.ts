import { Request, Response } from "express";
import { sendQuery } from '../model/oracledb';
import { generateToken } from '../controllers/generateToken';
import * as bcrypt from 'bcrypt'
import generateAndSend from "../middleware/sendEmail";

interface User{
    FIRSTNAME: string,
    PWD : string,
    EMAIL: string,
    CODE: number, 
    CREATEDAT: Date


}
export const register = async ( req: Request, res: Response):Promise<void> => {
    const { firstName, lastName, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO ALIASHYNSKA.usr (firstname, lastname, email, pwd)
      VALUES (:firstName, :lastName, :email, :hashedPassword)`;
  
    try {
      await sendQuery(query, { firstName, lastName, email, hashedPassword });
      const {accessToken, refreshToken} = generateToken( email);
      console.log(`refresh token ${refreshToken}`)
      res.cookie('refreshToken', refreshToken, 
        {httpOnly:true, 
         sameSite: 'strict',
         maxAge: 60*60*1000*24
       }
     )      
     res.status(200).json({accessToken})
    } 
    catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  };

export const login = async( req: Request, res: Response) :Promise<void> =>{
    const {email, password} = req.body;
    try{
      const query = `SELECT * FROM ALIASHYNSKA.usr WHERE email= :email`; 
      const result = await sendQuery(query, {email});
      if(!result || !result.rows  || result.rows.length === 0){
        res.status(401).json({error: 'Invalid credentials'})
        return;
    }
      console.log(result.rows)
      const user = result.rows[0] as User; 
      const userPassword = user.PWD; //password
      const userEmail = user.EMAIL;
      const userName = user.FIRSTNAME;

      console.log(userEmail)
      console.log(userPassword)
      if(!userEmail){
         res.status(401).json({error: 'Invalid email'});
         return;
      }
      const passwordMatch = await bcrypt.compare(password, userPassword) 
      if(!passwordMatch){
         res.status(401).json({error: 'Invalid password'}); 
         return;
      }
      const {accessToken, refreshToken} = generateToken(email);
      console.log(`refreshToken ${refreshToken}`)
      res.cookie('refreshToken', refreshToken, 
        {
          httpOnly:false, 
          secure: false,
          sameSite:'lax',
          domain: 'localhost',
          path: '/',
          maxAge: 10*60*1000*24
       }
    )      
    console.log('logged in..')
    res.status(200).json({accessToken, userName})
    }
    catch(error){
      console.log(error)
      res.status(500).json({error: "Login failed"})
      }
    };

export const logout  = async(req: Request, res: Response): Promise<void> =>{
    res.clearCookie('refreshToken', {
      path: '/', 
      domain: 'localhost', 
      sameSite: 'lax', 
      secure: false //need to change later
    })
    res.sendStatus(200);
}
export const resetPassword = async(req: Request, res: Response)=>{
  const email = req.body.email;
  if(!email){
    res.status(400).json('Email is required.');
    return;
  }
  try{
      await generateAndSend(email);
      res.sendStatus(200)
      console.log("sendind status 200..")}

  catch(err){
    res.status(500).json('An error occured while sending the verification code.');
  }


}
export const verifyCode = async(req: Request, res: Response)=>{

  const code = req.body.code;
  const email  =req.body.email;

  if(!email)
    res.sendStatus(400);

  const query = 'SELECT code, createdAt FROM codes WHERE email = :email';
  console.log(email)
  console.log(code);

  try{ 
    const response = await sendQuery(query, {email: req.body.email});
    if(!response || !response.rows ||response.rows.length<0){
      res.sendStatus(400);
      return;
      
    }
    const user = response.rows[0] as User;
      console.log(user.CODE)
      console.log(code)
      if(code===user.CODE){
        const expiryTime = 10*60*1000;
        const currentTime = new Date().getTime();
        const codeAge = currentTime - new Date(user.CREATEDAT).getTime();
        if(codeAge<=expiryTime){
          res.sendStatus(200);
        }else{
          res.sendStatus(400);
        }
      }
      else{
        res.sendStatus(400)
        console.log("No code provided in the request")
      }

    
  }
  catch(err){
    res.sendStatus(500)
  }

}
export const setNewPassword = async(req: Request, res: Response)=>{
    if(!req.body.password || !req.body.email){
      res.sendStatus(400);
      console.log(" no req body info ")
      return;
    }
    console.log("attempting to set a new password..")
  const email  = req.body.email;
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const query = 'UPDATE USR SET pwd = :hashedPassword WHERE email= :email';
  try{
    await sendQuery(query, {hashedPassword, email});
    console.log("successfully ecexuted the query")
    const {accessToken, refreshToken} = generateToken( email);
      console.log(`refresh token ${refreshToken}`)
      res.cookie('refreshToken', refreshToken, 
        {httpOnly:true, 
         sameSite: 'strict',
         maxAge: 60*60*1000*24
       }
     )      
     res.status(201).json({accessToken})

  }catch(err){
    res.sendStatus(500);
  }

}
export default {register, login, logout, verifyCode, setNewPassword};
