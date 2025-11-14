import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Mongo connected (user-authentication)'))
  .catch(err => console.error('Mongo connection error', err));