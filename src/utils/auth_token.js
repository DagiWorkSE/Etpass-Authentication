const passport = require("passport");
const passportJWT = require("passport-jwt");
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;
const dotenv = require("dotenv");
const { join } = require("path");

const User = require("../models/user.js");

dotenv.config({ path: join(__dirname, "../.env") });

const jwtOptions = {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.ACCESS_TOKEN_SECRET,
};

passport.use(
    new JWTStrategy(jwtOptions, (jwtPayload, done) => {
        User.findOne({ where: { id: jwtPayload.userId } })
            .then(user => {
                if (!user) {
                    return done(null, false);
                }
                return done(null, user);
            })
            .catch(err => {
                return done(err, false);
            });
    })
);


module.exports = passport;
