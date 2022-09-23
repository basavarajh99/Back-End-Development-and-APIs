require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const bodyParser = require('body-parser');

//DB Config
const mongoose = require('mongoose');

let uri = 'mongodb+srv://user1:' + process.env.PW + '@freecodecamp.xgxjbef.mongodb.net/db1?retryWrites=true&w=majority';

mongoose.connect(uri);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

let urlSchema = new mongoose.Schema({
  original: {type: String, required: true},
  short: Number
})

let Url = mongoose.model('Url', urlSchema)

let responseObj = {}
app.post('/api/shorturl', bodyParser.urlencoded({ extended: false }), (req, res) => {
  let input = req.body.url;

  let urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)

  if(!input.match(urlRegex)){
    res.json({error: 'invalid url'})
    return
  }
  
  responseObj['original_url'] = input;

  let inputShort = 1;

  Url.findOne({})
    .sort({short: 'desc'})
    .exec((err, result) => {
      if(!err && result){
        inputShort = result.short + 1;
      }

      if(!err){
        Url.findOneAndUpdate(
          {original: input},
          {original: input, short: inputShort},
          {new: true, upsert: true},
          (err, savedUrl) => {
            if(!err){
              responseObj['short_url'] = savedUrl.short
              res.json(responseObj);
            }
          }
        )
      }
    })
})

app.get('/api/shorturl/:input', (req, res) => {
  let input = req.params.input;

  Url.findOne({short: input}, (err, result) => {
    if(!err && result){
      res.redirect(result.original)
    }
    else {
      res.json('URL not found');
    }
  })
})