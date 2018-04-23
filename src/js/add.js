const electron = require('electron')
const path = require('path')
const remote = electron.remote
const { Pool, Client } = require('pg')
const { ipcRenderer } = require('electron')

const pool = new Pool ({
  host: 'localhost',
  database: 'sample_db',
  port: 5432
})

// Did not work when attempting to edit a deck.
function add_to_db(values) {
  var text = "INSERT INTO presets (id, name, url, application) VALUES ($1, $2, $3, $4)"
  console.log(values)
  pool.query(text, values, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      ipcRenderer.send('refresh')
      var window = remote.getCurrentWindow();
      window.close();
    }
  })
}

function setup_data(data) {
  var id = data[0]
  var name = data[1].value
  var tabs = data[2]
  var apps = data[3]
  var values = []
  // Loop iterates through all the data, storing it in database.
  for (i = 0; (i < tabs.length || i < apps.length); i++) {
    if (tabs[i] === undefined) {
      values = [id, name, tabs[i], apps[i].value]
      add_to_db(values)
    } else {
      // Next step is to write add_to_db(values), and set up values array if 
      // tabs[i] exists.
      if (apps[i] === undefined) {
        values = [id, name, tabs[i].value, apps[i]]
      } else {
        values = [id, name, tabs[i].value, apps[i].value]
      }    

      add_to_db(values)
    }

  }

}

function get_new_id(data) {
  pool.query('SELECT max(id) FROM presets', (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      data[0] = res.rows[0].max + 1
      setup_data(data)
    }
  })
}

const submit = document.getElementById('submit')
submit.addEventListener('click', function (event) {
  var deck_name = document.getElementById("dname")
  var tabs = document.getElementsByClassName("tab")
  var apps = document.getElementsByClassName("app")
  var data = [0, deck_name, tabs, apps] 
  var text = 'SELECT * FROM presets WHERE name = ($1)'
  var values = [deck_name.value] 


  pool.query(text, values, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      if (res.rowCount === 0) {
        get_new_id(data)
      } else {
        data[0] = res.rows[0].id
        insert_data(data)
      }
    }
  })
})

function add_tab() {
  // Creating a new input field.
  var new_input = document.createElement("input")
  new_input.type = "text"
  new_input.classList.add("tab")
  new_input.name = "tab"
  new_input.placeholder = "Tab(s) to open"

  document.getElementById('tabs2open').appendChild(new_input)
}

function add_app() {
  // Creating a new input field.
  var new_input = document.createElement("input")
  new_input.type = "text"
  new_input.classList.add("app")
  new_input.name = "app"
  new_input.placeholder = "Application(s) to open"

  document.getElementById('apps2open').appendChild(new_input)
}

