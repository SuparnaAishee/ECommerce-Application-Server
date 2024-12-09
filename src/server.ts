import app from "./app";
import config from "./app/config";
import seedAdmin from "./app/DB";

const main = () => {
  try {
    app.listen(config.port, () => {
      console.log(`E-Commerce App is running on port ${config.port}`);
      seedAdmin();
    });
  } catch (error) {
    console.log(error);
  }
};

main();
