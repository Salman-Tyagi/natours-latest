import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tour from '../../models/tourModel.js';
import User from '../../models/userModel.js';
import Review from '../../models/reviewModel.js';

dotenv.config({ path: 'config.env' });

const tours = JSON.parse(fs.readFileSync('./dev-data/data/tours.json'));
const users = JSON.parse(fs.readFileSync('./dev-data/data/users.json'));
const reviews = JSON.parse(fs.readFileSync('./dev-data/data/reviews.json'));

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);

await mongoose
  .connect(DB)
  .then(() => console.log('DB connected successfully!'));

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data imported successfully!');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data delete successfully!');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === '--delete') {
  deleteData();
} else if (process.argv[2] === '--import') {
  importData();
}
