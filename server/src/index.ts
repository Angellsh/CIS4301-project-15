import express, {Request, Response} from 'express'
import cors from "cors"
import {register} from './routers/auth'
import {connectDB, query} from './model/oracledb'

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json())
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true

}))
connectDB()
    .then(()=> console.log('Successfully connected to the database')
    )
    .catch((error)=> console.log(error))
app.use('/', register);
app.listen(PORT, ()=>{
    console.log(`The server is running on http://localhost:${PORT}`)
})
