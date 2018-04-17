const electron = require("electron")
const {shell} = require("electron")
const path = require("path")
const BrowserWindow = electron.remote.BrowserWindow
const { Pool, Client } = require('pg')

const pool = new Pool ({ 
  host: 'localhost',
  database: 'sample_db',
  port: 5432,
})

window.onload = function () {
  populate_decks()
}

function openNav() {
  document.getElementById("mySidenav").style.width = "250px"
  document.getElementById("main").style.marginLeft = "250px"
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0"
  document.getElementById("main").style.marginLeft = "0"
}

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

// This will save a specific preset with the given id and url
function save_url(id, url)
{
  var text = 'INSERT INTO presets (id, url) VALUES ($1, $2)'
  var values = [id, url]
  pool.query(text, values, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log('URL added!')
    }
  })
}


// I need this function to run when window has loaded *IMPORTANT*
// With an array of all entries of an id, it creates the deck
function render_preset(data, preset_num)
{
  console.log(data)

  var curr_text = ''
  var inner_text = "<h2>" + data[0].name  + "</><h4 class='deck-title'>Tabs:</h4>"
  var div = document.createElement("div")
  div.className = 'deck'

  for (i = 0; i < data.length; i++)
  {
    curr_text = "<div class='card tab" + preset_num + "'>" + data[i].url + "</div>"
    console.log(curr_text)
    inner_text += curr_text
  }

  inner_text += "<h4 class='deck-title'>Applications:</h4>"
  for (i = 0; i < data.length; i++)
  {
    curr_text = "<div class='card app" + preset_num + "'>" + data[i].application + "</div>"
    inner_text += curr_text
  } 

  div.innerHTML = inner_text
  
  div.addEventListener('click', function(event) {
    var links = document.getElementsByClassName('tab' + preset_num)
    var apps = document.getElementsByClassName('app' + preset_num)
    
    for (i = 0; i < links.length; i++)
    { 
      shell.openExternal(links[i].innerHTML)
    }

    for (i = 0; i < apps.length; i++)
    {
      shell.openItem('/Applications/' + apps[i].innerHTML + '.app')
    }
  }) 
 
  document.getElementById('deck-holder').appendChild(div);

}

// Gets all the entries of the specified preset_num
// NOTE: currently out of order, I assume it's due to asynchronousness.
function retrieve_preset(preset_num)
{
    var text = 'SELECT * FROM presets WHERE id = $1'
    var values = [preset_num]
    pool.query(text, values, (err, res) => {
      if (err) {
        console.log("ERROR: cannot get elements of specified id: " + values[0])
      } else {
        render_preset(res.rows, preset_num)
      }
    })
}

// Given the data from the database, create the presets.
function create_presets(num_presets)
{
  console.log("Generating Presets. . .")
  console.log("Number of presets: " + num_presets)
  var presets = new Array(num_presets)  
  for (i = 0; i < num_presets; i++)
  {
    retrieve_preset(i + 1)
  }
}


// Returns the highest id in the databse
function begin_creation(fn)
{
  // The purpose of this query is to find the number of presets.
  pool.query('SELECT max(id) FROM presets', (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      var max = res.rows[0].max
      fn(max)
    }
  })
}

function process_data(data)
{
  console.log("Processing Data. . .")
  if (data.length != 0) {
    begin_creation(create_presets)
  }
}

// Retieve all of the saved decks from the data base and create presets
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
  }
}

const addBtn = document.getElementById('addBtn')

addBtn.addEventListener('click', function(event) {
  const modalPath = path.join('file://', __dirname, 'add.html')
  let win = new BrowserWindow({ width: 400, height: 200})
  win.on('close', function() { win = null })
  win.loadURL(modalPath)
  win.show()
})

