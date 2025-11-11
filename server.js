const express = require('express')
const bodyParser = require('body-parser')
const nedb = require("@seald-io/nedb")
const multer = require('muslter')
const app = express();

app.use(express.static('public'))
// adding middleware to be able to parse body data from the fetch requests
app.use(bodyParser.json())

const uploadProcessor = multer({dest: 'assets/upload/'})
const encodedParser = bodyParser.urlencoded({extended: true})
app.use(encodedParser);


// setting view engiine
app.set('view engine', 'ejs')

// set up the database file
const database = new nedb({
    filename: "database.txt",
    autoload: true
})

app.get('/add', (req, res)=>{

    let query = {} // give us everything in db
    database.find(query).exec( (err, dataInDB)=>{
        if(err){
            res.render('form.ejs', {})
        }
        res.render('form.ejs',{ posts: dataInDB})
    })

})

app.post('/post', uploadProcessor.single('image'), (req,res)=> {
    let currentTime = new Date()

    let postToBeAddedToDB = {
        date: currentTime.toLocaleString(),
        text: req.body.text,
        timstamp: currentTime.getDate()
    }

    // insert the data into the db
    database.insert(postToBeAddedToDB, (err, dataThatHasBeenAdded)=>{
        if(err){
            console.log(err)
            res.redirect('/add')
        } else {
            console.log(dataThatHasBeenAdded)
            res.redirect('/add')
        }
    })
})

app.get('/all-posts', (req,res)=>{t
    // let allPosts = [
    //     {text: "post 1"},
    //     {text: "post 2"},
    //     {text: "post 3"}
    // ]

    let query = {} // this is empty because we don't want to get any specific things

    database.find(query).exec((err, data) => {
        //send data back as json
        res.json({posts: data})
    })
})

app.listen(7001, ()=>{
    console.log('server running on http:127.0.0.1:7001')
})