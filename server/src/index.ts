import express, {Request, Response} from 'express'
import cors from "cors"
import routes from './routers/routes'
import {connectDB} from './model/oracledb'

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json())
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true

}))
connectDB()
    .then(()=> console.log('Successfully connected to the database')
    )
    .catch((error)=> console.log(error))
app.use('/', routes);
app.listen(PORT, ()=>{
    console.log(`The server is running on http://localhost:${PORT}`)
})
