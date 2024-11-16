
import * as jwt from 'jsonwebtoken';
import * as dotenv from "dotenv"; 
import * as bcrypt from 'bcrypt'

dotenv.config();

export const generateToken  = ( email : String)=>{
    const accessToken = jwt.sign({email},
        process.env.JWT_SECRET as string, {'expiresIn': '5m'} );
    const refreshToken = jwt.sign({email}, 
        process.env.JWT_SECRET as string, {'expiresIn': '1d'});
    return {accessToken, refreshToken}
}
export default {generateToken}