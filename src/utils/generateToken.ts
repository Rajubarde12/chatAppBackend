import jwt from "jsonwebtoken";

const generateToken = (id: string) => {
  return jwt.sign({ id },"f2f7f0b1a4c9e8d0e0f9b8c6d2f3a7b1a8d6f0e9c1d5b7f3e6a2c8f4b9d7a1e2" as string, {
    expiresIn: "30d",
  });
};

export default generateToken;
