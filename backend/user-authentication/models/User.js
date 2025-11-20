/**
 * Model: User.js
 * ---------------------------------------------------------
 * Purpose:
 *   Defines the User schema and model for MongoDB using Mongoose.
 *   Each user has:
 *     - email: unique identifier for login, normalized to lowercase.
 *     - passwordHash: securely hashed password.
 *
 * Dependencies:
 *   - mongoose: ODM for MongoDB, used to define schemas and models.
 *
 * Exports:
 *   - Default Mongoose model for the "User" collection.
 * ---------------------------------------------------------
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);