// require('dotenv').config({ path: './.env' });
import connectDB from './db/db.js';
import dotenv from 'dotenv';
import { app } from "./app.js";


dotenv.config({ path: "./.env" });

const port = process.env.PORT || 3000;



connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Error: ", error)
            throw error;
        })

        app.listen(port, () => {
            console.log(`Server is listening on port http://localhost:${port}`)
        })
    })
    .catch((error) => {
        console.log("MONGODB Connection Failed: ", error);
        process.exit(1);
    })


app.get('/', (req, res) => {
    res.send("hello world")
})














/*
import express from 'express';
const app = express();
const port = process.env.PORT || 8000;
const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error;
        });

        app.listen(port, () => {
            console.log(`Server is listening on port http://localhost:${port}`);
        })
    } catch (error) {
        console.log('ERROR: ', error);
        process.exit(1);
    }
}

*/
