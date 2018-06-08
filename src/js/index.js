const electron = require('electron');
const {shell, ipcRenderer, remote } = require('electron');
const path = require('path');
const BrowserWindow = electron.remote.BrowserWindow


// Below enables the function 'verifyValue' in add.js.
addjsDebugger();



ipcRenderer.send("mainWindow");

ipcRenderer.on('maxVal', (err, maxVal) => {
  console.log(maxVal);
  if (maxVal == null) {
    console.log(1);
  }
});

/*
window.onload = function () {
  populate_decks()
}
*/

ipcRenderer.on('id-status', (err, idStatus) => {
  console.log("Recieved idStatus:")
  console.log(idStatus)
});

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
  win.webContents.openDevTools()
  win.show()
}

function clear_decks()
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
function render_preset(data, startIndex, numItems)
{
  var curr_text = ''
  var inner_text = "<h2>" + data[0].name  + "</><h4 class='deck-title'>Tabs:</h4>"
  var div = document.createElement("div")
  div.className = 'deck'

  for (i = startIndex; i < numItems; i++) {
    if (data[i].url != null) {
      curr_text = "<div class='card tab" + data[i].id + "'>" + data[i].url + "</div>"
      inner_text += curr_text
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

// Creates an array containing only unique values and returns the length.
function countDecks(data) {
  // Compare the id of each entry and search for a duplicate id.
  let uniques = data.filter( (value, index, self) =>
    index === self.findIndex((v) => (
      v.id === value.id
    ))
  );
  return uniques.length;
}

// Must process groups of rows at a time.
function process_data(data)
{
  let sortedData, numDecks, itemIndex, numItems;
  sortedData = data.sort(function (a, b) { return a.id - b.id });

  // Must figure out the number of decks ignoring the duplicate id's.
  numDecks = countDecks(data);
  itemIndex = 0;
  numItems = 0;

  if (numDecks == 1) {
    render_preset(sortedData, 0, sortedData.length);
  } else {
    for (let i = 0; i < numDecks; ++i)
    {
      let startIndex, currNum;
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
      render_preset(sortedData, startIndex, numItems);
    }
  }

}

// NOTE: Must reload decks, needs to be sent updated decks.
ipcRenderer.on('refresh', function(event) {
  clear_decks()
  //populate_decks()
});

ipcRenderer.on('resultMail', function(event, result) {
  console.log(result);
  process_data(result);
});

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

// To console.log() a given value from and.js.
function addjsDebugger() {
  ipcRenderer.on('addjs-channel', (err, value) => {
    console.log('====and.js====');
    console.log(value);
    console.log('==============');
  });
}
