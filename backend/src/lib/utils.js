import jwt from "jsonwebtoken"

//a func that generates a token and sends to user in a cookie(httpOnly cookie)
export const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "30d"
    })

    res.cookie("jwt", token, {
        maxAge: 30 * 24 * 60 * 1000, //30days in miliseconds
        httpOnly: true, //prevents XSS (cross-site scripting) attacks
        sameSite: "strict", //prevents CSRF (cross-site request forgrey) attacks
        secure: process.env.NODE_ENV !== "development",
    })

    return token;
}