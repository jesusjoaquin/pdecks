const electron = require('electron')
const path = require('path')
const remote = electron.remote

const submit = document.getElementById('submit')
submit.addEventListener('click', function (event) {
  console.log("Clicked the submit button")
})

function add_tab() {
  var input = document.getElementById('')
  console.log("add_tab()")
}

function add_app() {
  console.log("add_app()")
}

