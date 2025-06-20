import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


///routes import
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.route.js"
import tweetRouter from "./routes/tweet.route.js"
import subscriptionRouter from "./routes/subscription.route.js"
import videoRouter from "./routes/video.route.js"
import commentRouter from "./routes/comment.route.js"
import likeRouter from "./routes/like.route.js"
import playlistRouter from "./routes/playlist.route.js"
import dashboardRouter from "./routes/dashboard.route.js"
import watchlaterRouter from "./routes/watchlater.route.js"
import aiRouter from "./routes/ai.route.js"
import moderationRouter from "./routes/moderation.route.js"
import summarizeRoutes from "./routes/summarize.route.js"


const app = express();

// middleware setup
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    optionsSuccessStatus: true,
    credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({
    extended: true,
    limit: '16kb'
}));
app.use(express.static('public'));
app.use(cookieParser());







//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)    // ye as a prefix work krta hai => loaclhost:3000/api/v1/users/register
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/watchlater", watchlaterRouter)
app.use("/api/v1/ai", aiRouter)
app.use("/api/v1/moderation", moderationRouter)
app.use("/api/v1/summarize", summarizeRoutes);





export { app };