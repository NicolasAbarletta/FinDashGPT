import server from './server';
import './cron';

const port = process.env.PORT || 3001;
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`FinDash backend listening on port ${port}`);
});