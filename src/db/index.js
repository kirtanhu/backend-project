import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB = async ()=>{
    try {
        const ConnectInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n MONGDB CONNECTED !! DB HOST: ${ConnectInstance.connection.host}`)
    }catch(error){
        console.log("MONGODB Connection error", error)
        process.exit(1)
    }
}

export default connectDB