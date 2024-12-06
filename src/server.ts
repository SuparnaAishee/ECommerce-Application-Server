import app from "./app";
import config from "./app/config";

const main = () => {
  try {
    app.listen(config.port, () => {
      console.log(`E-Commerce App is running on port ${config.port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

main();
