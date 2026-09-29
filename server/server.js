import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = Number(process.env.PORT) || 5000;

connectDB()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`QuoteFlow API listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
