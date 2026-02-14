import { create_app } from './app';

const PORT = process.env.PORT || 3000;

const app = create_app();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
