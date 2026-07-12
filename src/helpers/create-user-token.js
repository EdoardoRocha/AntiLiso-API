import jwt from "jsonwebtoken";

export const createUserToken = async (user) => {
  //create token
  const token = jwt.sign(
    {
      name: user.name,
      id: user._id,
    },
    process.env.AUTH_SECRET,
    {
      expiresIn: "7d",
    },
  );

  return token;
};
