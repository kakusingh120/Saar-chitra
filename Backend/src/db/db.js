import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        // console.log(connectionInstance)
        // console.log(`✅ Connected to DB \n➡️ DB Host: ${connectionInstance.connection.host}`);
        console.log(`✅Connected to DB`)
    } catch (error) {
        console.error("MONGODB Connection Faild: ", error);
        throw error;
        // process.exit(1);
    }
}

export default connectDB;












// import mongoose from 'mongoose';
// import { DB_NAME } from '../constants.js';


// const connectDB = async () => {
//     try {
//         const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         console.log(`✅ Connected to db \n➡️  DB Host: ${connectionInstance.connection.host}`);
//     } catch (error) {
//         console.log("MONGODB Connection FAILED", error);
//         throw error;
//     }
// }


// export default connectDB;