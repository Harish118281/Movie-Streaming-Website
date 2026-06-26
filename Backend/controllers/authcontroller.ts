import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db";

export const signup = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      username,
      email,
      password,
    } = req.body;

    const existingUser =
      await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

    if (
      existingUser.rows.length > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This email is already registered.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const result =
      await pool.query(
        `
        INSERT INTO users
        (username,email,password)
        VALUES ($1,$2,$3)
        RETURNING id,username,email,created_at
        `,
        [
          username,
          email,
          hashedPassword,
        ]
      );

    const user =
      result.rows[0];

    const token =
      jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        process.env.JWT_SECRET as string,
        {
          expiresIn: "7d",
        }
      );

    res.status(201).json({
      success: true,
      message:
        "Account created successfully",
      token,
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Signup failed",
    });
  }
};

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const result =
      await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Email not registered.",
      });
    }

    const user =
      result.rows[0];

    const validPassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message:
          "Incorrect password.",
      });
    }

    const token =
      jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        process.env.JWT_SECRET as string,
        {
          expiresIn: "7d",
        }
      );

    res.json({
      success: true,
      message:
        "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Login failed",
    });
  }
};
