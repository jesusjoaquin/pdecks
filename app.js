console.log("In app.js")
const signUpBtn = document.getElementById('signUpBtn')

signUpBtn.addEventListener('click', function(event) {
        console.log("In signUpBtn function")
        const modalPath = path.join('file://', __dirname, 'add.html')
        let signUpWindow = new BrowserWindow({ width: 400, height: 200})
        win.on('close', function() { win = null })
        win.loadURL(modalPath)
        win.show()
})
