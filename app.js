const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const indexRouter = require("./routes/index");

require("dotenv").config();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const mongoURI = process.env.MONGODB_URI_PROD;
const PORT = process.env.PORT || 5000;

mongoose
    .connect(mongoURI)
    .then(() => console.log("mongoose connected"))
    .catch((error) => console.log("DB connection failed", error));

app.use("/api", indexRouter);

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
