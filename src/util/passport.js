import passport from 'passport';
import {Strategy, ExtractJwt} from 'passport-jwt';
import LocalStrategy from 'passport-local';

const localOptions = {
  usernameField: 'username'
};
const localLogin = new LocalStrategy(localOptions, (username, password, done) => {
  //Find username from database
  //if username not found return done(null, false)
  //  Check if password is a match
  //  if password is not a match return done(null, false)
  //  else return done(null, user)
});

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: "SECRET"
};

const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
  //Check if you can find payload.sub user from db
  //If found, then:
  if (user) {
    return done(null, user);
  } else {
    return done(null, false);
  }
});

passport.use(jwtLogin);
passport.use(localLogin);
