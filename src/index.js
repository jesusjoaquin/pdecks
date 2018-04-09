const electron = require("electron")
const path = require("path")
const BrowserWindow = electron.remote.BrowserWindow
const { Pool, Client } = require('pg')

const pool = new Pool ({ 
  host: 'localhost',
  database: 'sample_db',
  port: 5432,
})

// This function creates the database if it does not exist. 
function create_database()
{
  pool.query('CREATE TABLE presets ( id INTEGER, url varchar(255) )', (err, res) => {
    if (err) {
      console.log(err.stack)
    }
  })
}

// Adds my name to the max database 
function insert_name()
{
  var text = 'INSERT INTO max_task VALUES ($1)'
  var values = ['Jesus Garcia']
  pool.query(text, values, (err, res) => {
    if (err) {
      console.log(err.stack)
    }
  })
  console.log("Name has been added!")
}

// Gets my name from the max database
function retieve_name() {
  pool.query('SELECT * FROM max_task', (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log(res.rows[0])
    }
  })
}

// Returns the highest id in the databse
function count_presets()
{
  console.log("In largest value.")
  pool.query('SELECT max(id) FROM presets', (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      return res.rows[0].max
    }
  })
}

function save_url()
{
  var text = 'INSERT INTO presets (id, url) VALUES ($1, $2)'
  var values = [1, 'www.pdecks.com']
  pool.query(text, values, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log('URL added!')
    }
  })
}

function create_presets(data)
{
  console.log("Generating Presets. . .")
  var num_presets = count_presets()
  console.log(num_presets)
  for (i = 0; i < num_presets; i++)
  {
    console.log("In the for loop. . .")
  }
}

function process_data(data)
{
  console.log("Processing Data. . .")
  console.log(data)
  if (data.length != 0) {
    create_presets(data)
  }
}

function populate_decks() 
{	
  var brand_new = false  

  pool.query('SELECT * FROM presets', (err, res) => {  
    if (err) {
      if (res == undefined) {
        // These console.log's will stay, until they don't.
        console.log("Yeap, undefined.")
        create_database()
        console.log("Created a new databese, ready to go!!!")
        brand_new = true
      }
    } else {
      process_data(res.rows)
    }
  })
  
  if (brand_new == true) {
    populate_decks()
    console.log("populate_decks has been called a second time.");
  }
}

const addBtn = document.getElementById('addBtn')

addBtn.addEventListener('click', function(event) {
  const modalPath = path.join('file://', __dirname, 'add.html')
  let win = new BrowserWindow({ width: 400, height: 200})
  win.on('close', function() { win = null })
  win.loadURL(modalPath)
  populate_decks()
  save_url()
  win.show()
})
