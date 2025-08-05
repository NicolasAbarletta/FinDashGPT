import app from './server';

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`FinDash backend listening on port ${PORT}`);
});
