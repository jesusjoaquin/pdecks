const electron = require('electron');
const {shell, ipcRenderer, remote } = require('electron');
const path = require('path');
const BrowserWindow = electron.remote.BrowserWindow


// Below enables the function 'verifyValue' in add.js.
addjsDebugger();

ipcRenderer.send("mainWindow");

/*
window.onload = function () {
  populate_decks()
}
*/

function openNav() {
  document.getElementById("mySidenav").style.width = "250px"
  document.getElementById("main").style.marginLeft = "250px"
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0"
  document.getElementById("main").style.marginLeft = "0"
}

function createAddWindow() {
  const modalPath = path.join('file://', __dirname, 'add.html')
  var win = new BrowserWindow({ width: 400, height: 300})
  win.on('close', function() { win = null })
  win.loadURL(modalPath)
  win.webContents.openDevTools()
  win.show()
}

function clearDecks()
{
  var deck_bin = document.getElementById('deck-holder')
  while (deck_bin.firstChild) {
    deck_bin.removeChild(deck_bin.firstChild)
  }
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
add_deck.addEventListener('click', function () {
  createAddWindow();
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

// Will hide all of the information about the tabs/apps a particular
// deck opens.
function hideContents()
{
  var card = document.getElementsByClassName('card')
  var title = document.getElementsByClassName('deck-title')

  for (i = 0; i < card.length; i++) {
    card[i].style.display = "none";
  }

  for (i = 0; i < title.length; i++) {
    title[i].style.display = "none";
  }
}

// I need this function to run when window has loaded *IMPORTANT*
// With an array of all entries of an id, it creates the deck
function renderPreset(data, startIndex, numItems)
{
  var curr_text = ''
  var inner_text = "<h2>" + data[startIndex].name  + "</><h4 class='deck-title'>Tabs:</h4>"
  var div = document.createElement("div")
  div.className = 'deck'

  for (i = startIndex; i < numItems; i++) {
    if (data[i].url != null) {
      curr_text = "<div class='card tab" + data[i].id + "'>" + data[i].url + "</div>";
      inner_text += curr_text;
    }
  }

  inner_text += "<h4 class='deck-title'>Applications:</h4>"
  for (i = startIndex; i < numItems; i++) {
    if (data[i].application != null) {
      curr_text = "<div class='card app" + data[i].id + "'>" + data[i].application + "</div>"
      inner_text += curr_text
    }
  }

  div.innerHTML = inner_text
  div.addEventListener('click', function(event) {
    var links = document.getElementsByClassName('tab' + data[i].id)
    var apps = document.getElementsByClassName('app' + data[i].id)

    for (i = 0; i < links.length; i++) {
      shell.openExternal(links[i].innerHTML);
    }

    for (i = 0; i < apps.length; i++) {
      shell.openItem('/Applications/' + apps[i].innerHTML + '.app');
    }
  })

  document.getElementById('deck-holder').appendChild(div);

  hideContents();
}

// Creates an array containing only unique values and returns the length.
function countDecks(data) {
  // Compare the id of each entry and search for a duplicate id.
  var uniques = data.filter( (value, index, self) =>
    index === self.findIndex((v) => (
      v.id === value.id
    ))
  );
  return uniques.length;
}

// Must process groups of rows at a time.
function processData(data)
{
  var sortedData, numDecks, itemIndex, numItems;
  sortedData = data.sort(function (a, b) { return a.id - b.id });

  console.log(sortedData);

  // Must figure out the number of decks ignoring the duplicate id's.
  numDecks = countDecks(data);
  console.log("The number of decks are:");
  console.log(numDecks);
  itemIndex = 0;
  numItems = 0;

  if (numDecks == 1) {
    renderPreset(sortedData, 0, sortedData.length);
  } else {
    for (var i = 0; i < numDecks; ++i)
    {
      var startIndex, currNum;
      startIndex = itemIndex;
      currNum = sortedData[itemIndex].id;

      // Find the amount of entires that belong to the current deck.
      while (currNum == sortedData[itemIndex].id) {
        itemIndex++;
        numItems++;
        if (numItems == sortedData.length) {
          break;
        }
      }
      renderPreset(sortedData, startIndex, numItems);
    }
  }
}

const addBtn = document.getElementById('addBtn')

addBtn.addEventListener('click', function(event) {
  createAddWindow();
})

function delete_deck(name) {
  var text = "DELETE FROM presets WHERE name = '" + name + "'"
  pool.query(text, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      clearDecks()
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
});

function addToDatabase(entry) {
  ipcRenderer.send('update', entry);
  //ipcRenderer.send('refresh');
}

// Iterates through all the user given data, and set up an
// entry for each pair of tab + app, or solo tab/app.
function setupData(data) {
  var id = data[0];
  var name = data[1];
  var tabs = data[2];
  var apps = data[3];
  var entry = [];

  // Loop iterates through all the data, storing it in database.
  for (i = 0; (i < tabs.length || i < apps.length); i++) {
    var tab = tabs[i];
    var app = apps[i];

    // This ensures that at least a single tab or app was entered.
    if (tab === "" && app === "") {
      console.log("INVALID INPUT.")
      break;
    }

    // The following prepares the value array to be stored depending on app/tab
    // availability.
    if (tab === undefined || tab === "") {
      console.log("Tabs was undefined.");
      entry = [id, name, tab, app];
    } else {
      if (app === undefined || app === "") {
        console.log("Apps was undefined.");
        entry = [id, name, tab, app]
      } else {
        console.log("We all gucci!")
        entry = [id, name, tab, app]
      }
    }

    addToDatabase(entry);
  }
}

// This fuction is responsible for checking if the current data has an ID.
// If not, the database is queried, and an id is assigned.
function getNewId(data) {
    ipcRenderer.send('max');

    ipcRenderer.on('maxVal', (err, maxVal) => {
      //console.log("The current max value in the database is:");
      //console.log(maxVal);
      if (maxVal == null) {
        data[0] = 1;
      } else {
        data[0] = maxVal + 1;
      }
      console.log("Entry ID:");
      console.log(data[0]);

      setupData(data);
    });
}

// The data is retrieved with this ipc, and actualy doing something with the
// data will begin after a id is assigned.
ipcRenderer.on('name-verified', (err, data) => {
  // The id is finally assigned.
  if (data[0] == null) {
    data[0] = getNewId(data);
  } else {
    console.log("Entry ID:");
    console.log(data[0]);
    setupData(data);
  }
});

// NOTE: Must reload decks, needs to be sent updated decks.
// ipcRenderer.on('refresh', function(event) {
//   clearDecks();
// });

ipcRenderer.on('resultMail', function(event, result) {
  console.log("The following is the data:");
  console.log(result);
  clearDecks();
  processData(result);
  ipcRenderer.send('closeAddWindow');
});


// To console.log() a given value from and.js.
function addjsDebugger() {
  ipcRenderer.on('addjs-channel', (err, value) => {
    console.log('====and.js====');
    console.log(value);
    console.log('==============');
  });
}
