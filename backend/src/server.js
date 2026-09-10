import app from './app.js';
import config from './config/env.js';
import { initializeDB } from './config/db.js';
//test can start the server without a database connection
try {
  await initializeDB();

  app.listen(config.port, () => {
    console.log('Backend running on port ' + config.port);
  });
} catch (error) {
  console.error('Failed to initialise the database:', error);
  process.exitCode = 1;
}
