const express = require('express')
const parser = require('body-parser')
const encodedParser = parser.urlencoded({ extended: true })
const multer = require('multer')
const path = require('path')
const uploadProcessor = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'upload')),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      const base = path.basename(file.originalname, ext).replace(/\s+/g, '_')
      cb(null, `${Date.now()}_${base}${ext}`)
    }
  })
})
const app = express()

app.use(express.static('public'))
app.use(encodedParser)
app.set('view engine', 'ejs')

let posts = [
  { title: "hi", author: "demo", description: "example", imgSrc: "/existing/img.png", time: "date" }
]

app.get('/', (request, response) => {
  const data = { message: "hello", paths: ["path1", "path2", "path3"], visible: true }
  response.render('index.ejs', data)
})

app.get('/post', (request, response) => {
  response.render('post.ejs')
})

app.get('/explore', (request, response) => {
  response.render('explore.ejs', { allPosts: posts })
})

app.post('/upload', uploadProcessor.single('theImage'), (request, response) => {
  const singlePost = {
    title: request.body['proj-name'] || 'Untitled Project',
    author: request.body['author-name'] || 'Anonymous',
    description: request.body['description'] || '',
    time: new Date().toLocaleString()
  }
  if (request.file) {
    singlePost.imgSrc = `/upload/${request.file.filename}`
  }
  posts.unshift(singlePost)
  response.redirect('/explore')
})

app.get('/hall-of-fame', (request, response) => {
    response.render('hall-of-fame.ejs', { allPosts: posts })
  })

app.listen(5001, () => {
  console.log('server started on http://localhost:5001')
})
