module.exports = (mongoose) => {
  if (mongoose.models.User) {
    return mongoose.models.User;
  }

  const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

  return mongoose.model('User', userSchema);
};
