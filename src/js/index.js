const electron = require("electron")
const {shell} = require("electron")
const path = require("path")
const BrowserWindow = electron.remote.BrowserWindow
const { Pool, Client } = require('pg')
const { ipcRenderer } = require('electron')
const {remote} = require('electron')
const { Menu } = remote

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

function create_add_window() {
  const modalPath = path.join('file://', __dirname, 'add.html')
  let win = new BrowserWindow({ width: 400, height: 300})
  win.on('close', function() { win = null })
  win.loadURL(modalPath)
  //win.webContents.openDevTools()
  win.show()
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

function clear_decks()
{
  var deck_bin = document.getElementById('deck-holder')
  while (deck_bin.firstChild) {
    deck_bin.removeChild(deck_bin.firstChild)
  }
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
    } 
  })
}

const content = document.getElementById('content-toggler')
content.addEventListener('click', function(event) {
  var card = document.getElementsByClassName('card')
  var title = document.getElementsByClassName('deck-title')

  for (i = 0; i < card.length; i++) {
    if (card[i].style.display === "none") {
      card[i].style.display = "block"
    } else {
      card[i].style.display = "none"
    }
  }

  for (i = 0; i < title.length; i++) {
    if (title[i].style.display === "none") {
      title[i].style.display = "block"
    } else {
      title[i].style.display = "none"
    }
  }
 
  var decks = document.getElementsByClassName('deck')
  for (i = 0; i < decks.length; i++) {
    if (decks[i].style.height === "auto") {
      decks[i].style.height = "255px"
      decks[i].style.width = "150px"
    } else {
      decks[i].style.height = "auto"
      decks[i].style.width = "auto"
    }
  }
})

const add_deck = document.getElementById('add-deck')
// add an event listener that opens the add.html window
// just like the little plus button I have going on
add_deck.addEventListener('click', function () {
  create_add_window()
})

const night = document.querySelector('input[type="checkbox"]')

night.addEventListener('change', function(event) {
  var title = document.getElementsByClassName('app-name')
  var sidenav = document.getElementById('mySidenav');
  var options = document.getElementsByClassName('option');
  
  if (night.checked) {
    document.body.style.backgroundColor = "#4f4f4f"
    title[0].style.color = "#ffffff"
    sidenav.style.backgroundColor = "#6f6f6f";
    document.documentElement.style.setProperty('--shadow-color','#333');
    for (i = 0; i < options.length; i++) {
      options[i].style.color = "#000";
    }
  } else {
    document.body.style.backgroundColor = "initial"
    title[0].style.color = "initial"
    sidenav.style.backgroundColor = "#bcbcbc";
    document.documentElement.style.setProperty('--shadow-color','#888888');
    for (i = 0; i < options.length; i++) {
      options[i].style.color = "#303030"; 
    }  
  }
})

function hide_contents() 
{
  var card = document.getElementsByClassName('card')
  var title = document.getElementsByClassName('deck-title')

  for (i = 0; i < card.length; i++)
  {
    card[i].style.display = "none"
  }  

  for (i = 0; i < title.length; i++)
  {
    title[i].style.display = "none"
  }
}

// I need this function to run when window has loaded *IMPORTANT*
// With an array of all entries of an id, it creates the deck
function render_preset(data, preset_num)
{
  var curr_text = ''
  var inner_text = "<h2>" + data[0].name  + "</><h4 class='deck-title'>Tabs:</h4>"
  var div = document.createElement("div")
  div.className = 'deck'

  for (i = 0; i < data.length; i++) {
    if (data[i].url != null) {
      curr_text = "<div class='card tab" + preset_num + "'>" + data[i].url + "</div>"
      inner_text += curr_text
    }
  }

  inner_text += "<h4 class='deck-title'>Applications:</h4>"
  for (i = 0; i < data.length; i++) {
    if (data[i].application != null) {
      curr_text = "<div class='card app" + preset_num + "'>" + data[i].application + "</div>"
      inner_text += curr_text
    }
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

  hide_contents()  
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
        create_database()
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

ipcRenderer.on('refresh', function(event) {
  clear_decks()
  populate_decks()
}) 

const addBtn = document.getElementById('addBtn')

addBtn.addEventListener('click', function(event) {
  create_add_window()
})

function delete_deck(name) {
  var text = "DELETE FROM presets WHERE name = '" + name + "'"
  pool.query(text, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      clear_decks()
      populate_decks()
    }
  }) 
}

const deleter = document.getElementById('deleter')

deleter.addEventListener('click', function(event) {
  var input = document.createElement("input")
  input.type = "text"
  input.id = "inputd"
  input.name = "deck"
  input.placeholder = "Deck name, and press enter."
  document.getElementById("mySidenav").appendChild(input)
  input.onkeypress = function(e) {
    if (!e) { 
      e = window.event
    }
    var keycode = e.keycode || e.which
    if (keycode == '13') {
      delete_deck(input.value)
      input.parentNode.removeChild(input)
    }
  }
})
