const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
import {sendQuery} from '../model/oracledb'
dotenv.config()
interface QueryResult {
    rows: any; // You can be more specific if you know the row structure
  }
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure:false,
    auth:{
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
    }, 
    debug:true}
)

export const sendVerificationEmail= async (toEmail: String, verificationCode: Number)=>{
    const mailOptions ={
        from: process.env.EMAIL_USER, 
        to: toEmail, 
        subject: 'Your Verification Code', 
        text: `<p>Your Verification code is: <strong> ${verificationCode}</strong></p>`,
        html:`Your Verification code is:  ${verificationCode}`,
    }
    try{
        const info  = await transporter.sendMail(mailOptions)
            console.log('Email sent successfully', info.response)

        }
    catch(err){
        console.log('Error sending email: ', err)
        return;
    }
}

export const generateAndSend =async (email:String)=>{
    const verificationCode = Math.floor(1000000+ Math.random() *900000); //6 digits code
    try{
        await sendVerificationEmail(email, verificationCode);
        console.log('Verification email sent');}
    catch(err){
        console.log(err)
    }
    const currentDate = new Date();
   try{
        const checkQuery = 'SELECT COUNT(*) as count FROM codes WHERE email = :email';
            await sendQuery(checkQuery,{email})
            const result= await sendQuery(checkQuery, {email}) as QueryResult;
        console.log("searching..")
        console.log(result.rows[0])
        if(!result  || !result.rows || !result.rows[0]){
            console.log("error")
            return;
        }
        if( result.rows[0].COUNT> 0){
            const deleteQuery = 'DELETE FROM codes WHERE email = :email ';
            console.log("deleting...")
            await sendQuery(deleteQuery,{email})
        }
        const query = 'INSERT INTO codes(email, code, createdAt) VALUES(:email, :verificationCode, :currentDate)'
       await sendQuery(query, {email, verificationCode, currentDate});
       console.log("successfully inserted")
    }
    catch(err){
        console.log(err);
        throw new Error('Failed to insert a verification code into database')
    }
}
export default generateAndSend;