import express, { Application } from "express";
import cors from "cors";
import globalErrorHandler from "./utils/globalErrorHandler";
import notFound from "./utils/notFound";
import router from "./app/routes";
const app: Application = express();

//middleware
app.use(
  cors({
    credentials: true,
    origin: [
      "*",
    
    ],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// module route
app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
