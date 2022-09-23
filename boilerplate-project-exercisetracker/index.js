const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

let uri = 'mongodb+srv://user1:' + process.env.PW + '@freecodecamp.xgxjbef.mongodb.net/db1?retryWrites=true&w=majority';

mongoose.connect(uri);

app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


let exerciseSessionSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String
})

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSessionSchema]
})

let Session = mongoose.model('Session', exerciseSessionSchema);
let User = mongoose.model('User', userSchema);

app.post('/api/users', bodyParser.urlencoded({ extended: false }), (req, res) => {
  let newUser = new User({username: req.body.username})
  newUser.save((err, savedUser) => {
    if(err) return console.error(err);
    let responseObj = {}
    responseObj['username'] = savedUser.username
    responseObj['_id'] = savedUser.id
    res.json(responseObj)
  })
})

app.get('/api/users', (req, res) => {
  User.find({}, (err, allUsers) => {
    if(!err){
      res.json(allUsers);
    }
  })
})

app.post('/api/users/:_id/exercises', bodyParser.urlencoded({ extended: false }), (req, res) => {
  let newSession = new Session({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
  })

  if(newSession.date === '' || newSession.date === undefined){
    newSession.date = new Date().toDateString();
  }

  User.findByIdAndUpdate(
    req.params._id,
    {$push: {log: newSession}},
    {new: true},
    (err, updatedUser) => {
     if(!err){
       let responseObj = {}
       responseObj['_id'] = updatedUser.id
       responseObj['username'] = updatedUser.username
       responseObj['date'] = new Date(newSession.date).toDateString()
       responseObj['description'] = newSession.description
       responseObj['duration'] = newSession.duration
       res.json(responseObj)
     } 
    }
  )
})

app.get('/api/users/:_id/logs', (req, res) => {
  User.findById(req.params._id, (err, result) => {
      if(!err){
      let responseObj = result;
      console.log(responseObj);
      if(req.query.from || req.query.to){
        let fromDate = new Date(0);
        let toDate = new Date();

        if(req.query.from){
          fromDate = new Date(req.query.from)
        }

        if(req.query.to){
          toDate = new Date(req.query.to)
        }

        fromDate = fromDate.getTime()
        toDate = toDate.getTime()

        responseObj.log = responseObj.log.filter((session) => {
          let sessionDate = new Date(session.date).getTime()

          return sessionDate >= fromDate && sessionDate <= toDate
        })
      }

      if(req.query.limit){
        responseObj.log = responseObj.log.slice(0, req.query.limit)
      }

      responseObj = responseObj.toJSON()
      responseObj['count'] = result.log.length
      res.json(responseObj);
    }
  })
})