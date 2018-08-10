const electron = require('electron')
const path = require('path')
const remote = electron.remote
const { Pool, Client } = require('pg')
const { ipcRenderer } = require('electron')

ipcWatcherAdd();

// Did not work when attempting to edit a deck.
// function add_to_db(values) {
//   ipcRenderer.send('update', values);
//
//   // I do not think I need this ipc.
//   ipcRenderer.send('refresh');
//   var window = remote.getCurrentWindow();
//   window.close();
// }

function convertTabAppObjectsToArray(data) {
  var tabArray = new Array();
  var appArray = new Array();

  var tabs = data[2];
  var apps = data[3];

  for (var i = 0; tabs[i] != undefined; i++) {
    tabArray.push(tabs[i].value);
  }

  for (var i = 0; apps[i] != undefined; i++) {
    appArray.push(apps[i].value);
  }

  data[2] = tabArray;
  data[3] = appArray;

  return data;
}

const submit = document.getElementById('submit');

submit.addEventListener('click', function (event) {
  // The following retrieves the name the user entered for the deck.
  // Could potentially be a deck that already exists.
  var deck_name = document.getElementById("dname").value;

  // The following two lines retrieve an object w/ as many fields as
  // the user specifies.
  // Can be accessed through zero-based indexing.
  var tabs = document.getElementsByClassName("tab");
  var apps = document.getElementsByClassName("app");
  var data = [0, deck_name, tabs, apps]

  // Just to make life easier, this turns the above objects into arrays,
  // removing any extra information and just containing the tab/app strings.
  data = convertTabAppObjectsToArray(data);

  verifyValue(data);

  ipcRenderer.send('verify-name', data);
})

function addTab() {
  // Creating a new input field.
  var new_input = document.createElement("input")
  new_input.type = "text"
  new_input.classList.add("tab")
  new_input.name = "tab"
  new_input.placeholder = "Tab(s) to open"

  document.getElementById('tabs2open').appendChild(new_input)
}

function addApp() {
  // Creating a new input field.
  var new_input = document.createElement("input")
  new_input.type = "text"
  new_input.classList.add("app")
  new_input.name = "app"
  new_input.placeholder = "Application(s) to open"

  document.getElementById('apps2open').appendChild(new_input)
}

// This function is used to make a value appear in main console.
function verifyValue(value) {
  ipcRenderer.send('addjs-redirect', value);
}

function ipcWatcherAdd() {
  ipcRenderer.on('send-relay', (err, data) => {
    verifyValue("Mission Success.");
  });

  // ipcRenderer.on('closeAddWindow', (err) => {
  //   verifyValue("Attempting to close add window");
  //   var window = remote.getCurrentWindow();
  //   window.close();
  // });
}
