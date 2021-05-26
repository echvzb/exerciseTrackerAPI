const express = require("express"),
  bodyParser = require("body-parser"),
  connectDB = require("./connectDB"),
  Models = require("./models.js");

const cors = require("cors");

const app = express();

connectDB();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const checkUser = (req, res, next) => {
  console.log("IP: ", req.ip, "\nPATH: ", req.path, "\nMETHOD: ", req.method);
  next();
};
app.use(checkUser);

app.use(express.static("public"));

const parseDate = date => date.toString().slice(0, 15);

function filterLog(log, query, functions) {
  let min,
    max,
    customInfo = {};

  if (query.min) {
    min = new Date(query.min);
    customInfo.from = parseDate(min);
  }
  if (query.max) {
    max = new Date(query.max);
    customInfo.to = parseDate(max);
  }
  let tempLog = [];

  const check = d => functions.less(d, min) && functions.greater(d, max);

  log.forEach(obj => {
    if (query.limit <= 0) {
      return;
    }
    let d = new Date(obj.date);
    if (check(d)) {
      obj.date = parseDate(d);
      tempLog.push(obj);
      query.limit--;
    }
  });
  return { tempLog, customInfo };
}
function checkUserQuery(user, query) {
  let functions = {};
  let { userId, username, log, count } = user;

  if (!query.max) {
    functions.greater = d => true;
  } else {
    functions.greater = (d, max) => d <= max;
  }
  if (!query.min) {
    functions.less = d => true;
  } else {
    functions.less = (d, min) => d >= min;
  }
  if (!query.limit && query.limit != 0) {
    query.limit = log.length;
  }
  const { tempLog, customInfo } = filterLog(user.log, query, functions);

  let tempObj = { userId, username };
  for (let key in customInfo) {
    tempObj[key] = customInfo[key];
  }

  return Object.assign({}, tempObj, { count, log: tempLog });
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/exercise/users", (req, res) => {
  Models.User.find({}, "_id username", (err, users) => {
    if (err) {
      console.error(err);
    } else {
      res.json(users);
    }
  });
});

app.post("/api/exercise/add", (req, res) => {
  let { userId, description, duration, date } = req.body;
  Models.User.findOne({ _id: userId }, (err, user) => {
    if (err) {
      console.error(err);
      res.send(err + "");
    } else {
      const { username, log, count } = user;
      if (!date) {
        date = new Date();
      } else {
        date = new Date(date);
        if (date == "Invalid Date") {
          res.send(date + "");
        }
      }
      const e = {
        description,
        duration: +duration,
        date
      };
      Models.User.updateOne(
        { username },
        { log: [...log, e], count: count + 1 },
        (err, docs) => {
          if (err) {
            console.error(err);
            res.send(err + "");
          } else {
            console.log("Updated Docs: ", docs);
          }
        }
      );
      res.json({
        _id: user["_id"],
        username,
        date: parseDate(date),
        duration: +duration,
        description
      });
    }
  });
});

app.post("/api/exercise/new-user", (req, res) => {
  const username = req.body.username,
    count = 0,
    log = [];

  Models.User.findOne({ username }, (err, user) => {
    if (err) {
      console.error(err);
      res.send(err + "");
    } else if (!user) {
      const u = new Models.User({ username, count, log });
      u.save(err => {
        if (err) console.error(err);
      });
      res.json({ username, _id: u["_id"] });
    } else {
      res.send("Username already taken");
    }
  });
});

app.get("/api/exercise/log", (req, res) => {
  const { userId } = req.query;
  if (userId) {
    Models.User.findOne({ _id: userId }, (err, user) => {
      if (err) {
        console.error(err);
        res.send(err + "");
      } else {
        let { username, count, log } = user;
        let customUser = { userId, username, count, log };

        let max = req.query.to;
        let min = req.query.from;
        let limit = req.query.limit;

        const JSON = checkUserQuery(customUser, { max, min, limit });
        res.json(JSON);
      }
    });
  } else {
    res.send("Unknown userId");
  }
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
