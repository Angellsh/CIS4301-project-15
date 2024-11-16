import * as jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
import { Request, Response, NextFunction } from 'express';

dotenv.config()
export const authToken = (req: Request, res: Response, next: NextFunction)=>{

    const authHeader = req.headers['authorization']

    if(!authHeader){
        res.sendStatus(403);
        return;
    }
    const token = authHeader.split(" ")[1];

    if(!token){        
       res.sendStatus(403);
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, user)=>{
        if(err){
            console.log("status code 403")
            res.sendStatus(403);
            return; 
        }
        (req as any).user = user;
        next();
    });


}
export default authToken;