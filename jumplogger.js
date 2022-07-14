const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./src/routes');
const dir = require('./dir');

const port = 3000
const app = express()
const http = require('http').createServer(app)

app.use(cors({ origin: '*' }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({ type: 'application/json' }))
app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }))
app.use(express.static(dir.dir + '/builds'))
app.use(express.static(dir.dir + '/builds/dashboard'))
app.use(express.static(dir.dir + '/builds/config'))
app.use(express.static(dir.dir + '/builds/bootstrap'))
app.use(express.static(dir.dir + '/builds/GM_Utils'))
app.use('/api', routes)
app.get('*', (req, res) => res.sendFile(dir.dir + '/builds/index.html'))

http.listen(port, ()=>{
    console.log('server listening on:', port)
})
