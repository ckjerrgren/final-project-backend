import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import mongoose from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt-nodejs'

/////////////////////////////////////////////////
///      A U T H E N T I C A T I O N      /////
///////////////////////////////////////////////


const User = mongoose.model('User', {
    name:{
        type: String,
        unique: true,
    },
    password:{
        type: String,
        required: true,
    },
    accessToken:{
        type: String,
        default: () => crypto.randomBytes(128).toString('hex'),
    }
})

const authenticateUser = async ( req, res, next ) => {
    const user = await User.findOne({accessToken: req.header('Authorization')})
    if(user){
        req.user = user
        next()
    } else {
        res.status(401).json({loggedOut: true })
    }
}

/////////////////////////////////////////////////
///      D A T A B A S E     ///////////////////
///////////////////////////////////////////////

// Database for project 
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/finalProject'
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise


//Collection for database. 
const Game = mongoose.model('Game', {
    directions: {
        type: String,
        required: true,
    },
    question: {
        type: String,
        required: true
    },
    hint: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
})

//Port 3000 npm start 
const port = process.env.PORT || 8080
const app = express ()

//middleware to enable cors and json body parsing 
app.use(cors())
app.use(bodyParser.json())

//start defining my routes here: 
app.get('/', (req, res) => {
    res.send("Hello Final project! 😍 ")
})

//PICKS     ONE RANDOM  
app.get('/games', async (req, res) => {
    const games = await Game.find()
    const randomGame = games[Math.floor(Math.random() * games.length)]
    res.json(randomGame)
})

// ALL GAMES
app.get('/gamesarray', (req, res) => {
    Game.find().then(games => {
        res.json(games)
    })
})

//POSTING NEW OBJECTS 
app.post('/gamesarray', async (req, res) => {
    const game = new Game(req.body)

    try{
        const savedGame = await game.save()
        res.status(201).json(savedGame)
    }catch (err) {
        res.status(400).json({ message: "Please fill out all boxes to build the game", error:err.errors})
    }
})
// DELETING OBJECTS 
 app.delete('/games/:id', async (req, res) => {
     try {
         //Try to delete game 
         await Game.deleteOne({ _id: req.params.id })
         
         // Send a successful response 
         res.status(200).json({ success: true })
     } catch (error) {
         console.log(error)

         // Inform client about deletion failure 
         res.status(400).json({success: false })
     }
 })

 app.post('/users', async (req,res) =>{
    try{
      const {name, password} = req.body;
      const user = new User({name, password: bcrypt.hashSync(password)});
      user.save();
      res.status(201).json({id:user._id, accessToken:user.accessToken});
    }catch(err){
      res.status(400).json({message: 'Could not create user', errors: err.errors});
    }
  })

 // Secret endpoint for auth --- Not really being used
 app.get('/secrets', authenticateUser); 
app.get('/secrets', (req, res) => {
  res.json({secret: 'Hello secret message'});
})


// Logging in 
app.post('/sessions', async (req, res) => {
    const user = await User.findOne({name:req.body.name}) 
    if (user && bcrypt.compareSync(req.body.password, user.password)){
        //Success
        res.json({userId: user._id, accessToken: user.accessToken})
    } else {
        //failure: user does not exist or passsword does not match 
        res.json({notFound: true})
    }
})


// Starting the server 
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})







//////////////////////////////////////////////////////
////// D E L E T E  W H E N  F I N I S H E D /////////
//////////////////////////////////////////////////////



// // Created User with one-way encryption 
// const user = new User({name: "MrMittens", password: bcrypt.hashSync("GinTonic") }) 
// user.save()