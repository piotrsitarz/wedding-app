const _ = require('lodash');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const nodemailer = require('nodemailer');
const moment = require('moment');

const {mongoose} = require('./server/db/mongoose');
const {User} = require('./server/models/user');
const {GuestsList} = require('./server/models/guests_list');
const {DateOfWedding} = require('./server/models/date_of_wedding');
const {WeddingVenue} = require('./server/models/wedding_venue');
const {WeddingPartyVenue} = require('./server/models/wedding_party_venue');
const {authenticate} = require('./server/middleware/authenticate');

const app = express();
const port = process.env.PORT || 3004;

app.use(bodyParser.json());
app.use(express.static(__dirname));

app.use(cookieParser());

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

app.get('/main',(req, res) => {
    if (req.cookies.auth !== undefined) {
      res.sendFile('index.html', { root: __dirname });
    }else {
        res.redirect(`https://${req.header('host')}`);
    }
});

app.get('/lista',(req, res) => {
    if (req.cookies.auth !== undefined) {
      res.sendFile('index.html', { root: __dirname });
    }else {
      res.redirect(`https://${req.header('host')}`);
    }
});

app.get('/rozmieszczenie',(req, res) => {
    if (req.cookies.auth !== undefined) {
      res.sendFile('index.html', { root: __dirname });
    }else {
      res.redirect(`https://${req.header('host')}`);
    }
});

app.get('/bud%C5%BCet',(req, res) => {
    if (req.cookies.auth !== undefined) {
      res.sendFile('index.html', { root: __dirname });
    }else {
      res.redirect(`https://${req.header('host')}`);
    }
});

app.get('/kalendarz',(req, res) => {
    if (req.cookies.auth !== undefined) {
      res.sendFile('index.html', { root: __dirname });
    }else {
      res.redirect(`https://${req.header('host')}`);
    }
});

app.get('/logout', (req, res) => {
    res.redirect(`https://${req.header('host')}`);
});

app.get('/get_date_of_wedding', authenticate, (req,res) => {
  req.body._creator =  req.user._id;
  DateOfWedding.find({
    _creator: req.user._id
  }).then((date) => {
    if (date.length === 0) {
      let timeUtc = moment.utc().format('YYYY-MM-DD HH');
      let localTime  = moment.utc(timeUtc).toDate();
      localTime = moment(localTime).format('YYYY-MM-DD HH:[00]');
      req.body.date = localTime;
      let date = new DateOfWedding(req.body);
      date.save().then(() => {
          res.send('dataNotSet');
      })
    } else {
      let now = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      res.send({date,now});
    }
  },(e) => {
    res.status(400).send(e);
  })
});

app.post('/update_date_of_wedding', authenticate, (req,res) => {
  req.body._creator =  req.user._id;
  DateOfWedding.findOneAndUpdate({_creator:req.body._creator}, {$set:req.body}, {new:true}).then((date) => {
  if (!date) {
    return res.status(404).send;
  }
    let now = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    res.send({date,now});
  }).catch((e) => {
    res.status(400).send;
  })
});

app.get('/get_wedding_venue', authenticate, (req,res) => {
  req.body._creator =  req.user._id;
  WeddingVenue.find({
    _creator: req.user._id
  }).then((place) => {
    if (place.length === 0) {
      req.body.place = 'New York City';
      let place = new WeddingVenue(req.body);
      place.save().then(() => {
        res.send({place});
      })
    } else {
      res.send({place});
    }
  },(e) => {
    res.status(400).send(e);
  })
});

app.post('/update_wedding_venue', authenticate, (req,res) => {
  req.body._creator =  req.user._id;
  WeddingVenue.findOneAndUpdate({_creator:req.body._creator}, {$set:req.body}, {new:true}).then((place) => {
  if (!place) {
    return res.status(404).send;
  }
    res.send({place});
  }).catch((e) => {
    res.status(400).send;
  })
});

app.get('/get_wedding_party_venue', authenticate, (req,res) => {
  req.body._creator =  req.user._id;
  WeddingPartyVenue.find({
    _creator: req.user._id
  }).then((place) => {
    if (place.length === 0) {
      req.body.place = 'Plac Św. Piotra';
      let place = new WeddingPartyVenue(req.body);
      place.save().then(() => {
        res.send({place});
      })
    } else {
      res.send({place});
    }
  },(e) => {
    res.status(400).send(e);
  })
});

app.post('/update_wedding_party_venue', authenticate, (req,res) => {
  req.body._creator =  req.user._id;
  WeddingPartyVenue.findOneAndUpdate({_creator:req.body._creator}, {$set:req.body}, {new:true}).then((place) => {
  if (!place) {
    return res.status(404).send;
  }
    res.send({place});
  }).catch((e) => {
    res.status(400).send;
  })
});

app.post('/guests_list_add', authenticate, (req,res) => {
  req.body._creator =  req.user._id;
  var guest = new GuestsList(req.body);
  guest.save().then(() => {
      res.send('guest added');
  }).catch((e) => {
    res.send('exist');
  })
});

app.post('/guests_list_edit', authenticate, (req,res) => {
  GuestsList.findOneAndUpdate({_id:req.body._id, _creator:req.body._creator}, {$set:req.body}, {new:true}).then((guest) => {
  if (!guest) {
    return res.status(404).send;
  }
    res.send({guest});
  }).catch((e) => {
    res.status(400).send;
  })
});

app.get('/guests_list', authenticate, (req,res) => {
  GuestsList.find({
    _creator: req.user._id
  }).then((guests) => {
    res.send({
      guests
    })
  },(e) => {
    res.status(400).send(e);
  })
});

app.post('/signUp', (req, res) => {
  var body = _.pick(req.body, ['email','password']);
  var user = new User(body);
  user.save().then(() => {
    return user.generateConfirmationLink();
  }).then((confirmationLink) => {
    res.send('registered');
    const url  = `https://${req.headers.host}/confirmation/${confirmationLink}`;
    // const url  = `http://${req.headers.host}/confirmation/${confirmationLink}`;
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: '7testing7weddingapp7@gmail.com',
            pass: 'weddingapp123'
        }
    });

    let mailOptions = {
        from: '"weddingApp 👻" <foo@example.com>',
        to: user.email,
        subject: 'Hello ✔',
        text: 'Welcome in weddingApp.',
        html: `Please click this link to confirm your email: <a href = "${url}">${url}</a>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        return console.log('User singed up');
    });

  }).catch((e) => {
    res.send(e);
  })
});

app.get('/confirmation/:emailToken', (req, res) => {
  User.findOneAndUpdate({confirmation: req.params.emailToken}, {$set:{confirmed:true}}, {new: true}, function(err, user){
    if(err){
     console.log('Something wrong when updating data!');
     }
  });
  res.redirect(`https://${req.header('host')}`);
  // res.redirect(`http://${req.header('host')}`);
});

app.post('/login', (req,res) => {
  let credential = {};
  credential.account = 'doesNotExist';
  credential.token = false;
  User.findByCredentials(req.body.email, req.body.password).then((user)=>{
    if (user.confirmed) {
      return user.generateAuthToken().then((token)=>{
        credential.account = 'confirmed';
        credential.token = token;
        res.send(credential);
      });
    }else  {
      credential.account = 'confirmEmail';
      res.send(credential);
    }
  }).catch((e)=>{
    res.send(credential);
  });
});

app.get('*', function(req, res) {
  res.redirect(`https://${req.header('host')}`);
});

app.listen(port, ()=> {
   console.log(`Starting application on ${port}`);
});
