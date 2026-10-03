const express = require('express');
const puppeteer = require('puppeteer-extra');
const stealthplugin = require('puppeteer-extra-plugin-stealth');
const app = express();
app.use(express.json());
puppeteer.use(stealthplugin());
let browser = undefined;
let page = undefined;
app.get('/screenshot', async function(req, res) {
    if (page) {
        let screenshot = await page.screenshot({ encoding : "base64", timeout : 0 });
        return res.status(200).send("data:image/jpeg;base64," + screenshot);
    } else {
        return res.status(500).send("Browser has not been loaded");
    }
});
app.post('/click', async function(req, res) {
    let { x, y } = req.body;
    if (page) {
        await page.mouse.click(x, y);
        return res.status(200).send('Succesfully clicked!');
    } else {
        return res.status(500).send('Browser has not been loaded.');
    }
});
app.post('/scroll', async function(req, res) {
    if (page) {
        if (req.body.go === "up") {
            await page.evaluate(function() {
                window.scrollBy(0, -5);
            });
            return res.status(200).send("Scrolled");
        } else if (req.body.go === "down") {
            await page.evaluate(function() {
                window.scrollBy(0, 5);
            });
            return res.status(200).send("Scrolled");
        }
    } else {
        return res.status(500).send("Browser has not loaded.");
    }
});
app.post('/press', async function(req, res) {
    if (page) {
        await page.keyboard.press(req.body.key);
        return res.status(200).send("Key has been pressed.");
    } else {
        return res.status(500).send("Browser has not loaded.");
    }
});
app.post('/fitScreen', async function(req, res) {
    let { width, height } = req.body;
    if (page) {
        await page.setViewport({
            width : Number(width),
            height: Number(height)
        });
        return res.status(200).send("Fitted screen!");
    } else {
        return res.status(500).send("Browser has not loaded.");
    }
});
app.get('/', function(req, res) {
    res.send(`<html>
    <head>
        <title>Roblox</title>
        <style>
            html, body {
                background-color: #000;
                margin: 0px;
                overflow: hidden;
            }
            #frame {
                width: 100vw;
                height: 100vh;
                object-fit: fill;
            }
        </style>
    </head>
    <body>
        <img id="frame"></img>
        <script>
            let frame = document.getElementById('frame');
            (async function() {
                let response = await fetch("/fitScreen", {
                    method : "POST",
                    headers : {
                        "Content-Type" : "application/json"
                    },
                    body : JSON.stringify({
                        width : window.innerWidth,
                        height : window.innerHeight
                    })
                });
            })();
            window.addEventListener("click", async function(e) {
                await fetch("/click", {
                    method : "POST",
                    headers : {
                        "Content-Type" : "application/json"
                    },
                    body : JSON.stringify({
                        x : e.clientX,
                        y : e.clientY
                    })
                });
            });
            window.addEventListener("keydown", async function(e) {
                await fetch("/press", {
                    method : "POST",
                    headers : {
                        "Content-Type" : "application/json"
                    },
                    body : JSON.stringify({
                        key : e.key
                    })
                });
            });
            setInterval(async function() {
                let response = await fetch("/screenshot", {
                    method : "GET"
                });
                frame.src = await response.text();
            }, 500);
        </script>
    </body>
</html>`);
});
app.listen(3000, '::', async function() {
    browser = await puppeteer.launch({});
    page = await browser.newPage();
    await page.goto("https://roblox.com");
    console.log("Loaded browser.")
});
