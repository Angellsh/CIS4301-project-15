
import dotenv from 'dotenv'
import oracleDB from 'oracledb'

dotenv.config()

export const connectDB = async ()=>{
    try{
        await oracleDB.createPool({
            user: process.env.ORACLE_USER,
            password : process.env.PASSWORD, 
            connectionString: process.env.CONNECT_STRING
        });
        console.log("Oracle DB connection pool initialized.")
    }
    catch(error){
        console.log(`Error initializing Oracle DB. ${error}`)
    }
    
}

export const sendQuery = async(sql: string, params: any) => { //first is the sql string, second is the parameters to pass to the query
    let connection;
    try{
        connection = await oracleDB.getConnection();
        const result = await connection.execute(sql, params, {
            outFormat: oracleDB.OUT_FORMAT_OBJECT
        });
        await connection.commit();
        return result;
    }
    catch(error){
        console.log(error);
    
    }
    finally{
        if(connection){
            try{
                await connection.close();
            }catch(error){
                console.log(error);

            }
        }
    }
}

export default {connectDB, sendQuery};