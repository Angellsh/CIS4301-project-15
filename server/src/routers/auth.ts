import OracleDB from "oracledb";
import {query} from "../model/oracledb";
import bcrypt from "bcrypt"
import { Request, Response } from "express";


export const register  = async (req: Request, res: Response): Promise<void> => {
    const email = req.body.email;
    const password = req.body.password;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    if(!email || !password){
        res.sendStatus(500);
        return;
    }
    try{
        console.log(firstname)
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO usr (firstname, lastname, email, pwd) VALUES (:firstname, :lastname, :email, :password)`;
        console.log("got a request to register a new user")
        const result = await query(sql,{firstname, lastname, email, password: hashedPassword});
        if(result){
                res.sendStatus(201);
                console.log("successfully registered")
                }
        else{
            res.sendStatus(500);
        }
    }catch(error){
        console.log("could not write new user to the database");
        res.sendStatus(500);
    }
}
export default register;