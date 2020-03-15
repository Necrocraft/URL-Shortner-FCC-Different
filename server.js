const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');
require("dotenv/config");
const app = express();

const Url = require('./models/shortUrl');

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + '/public'));

mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true, useUnifiedTopology: true },  () => {
    console.log("Connected to DB");
});

app.get("/api/shorturl/new/:urlToShorten(*)", (req, res) => {
    let {urlToShorten} = req.params;
    let regex = /[-a-zA-z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
    let randomNum = Math.floor(Math.random()* 100000).toString();
    let reCheck = new RegExp("^(https|http)://", 'i');
    if(regex.test(urlToShorten) === true && reCheck.test(urlToShorten) == true) {
        let updatedUrl = urlToShorten.replace(reCheck, '');
        console.log(updatedUrl);
        dns.lookup(updatedUrl, (err, add) => {
            if(err) {
                return res.json({error : 'Invalid Hostname'});
            }
            else {
                console.log(add);
                const value = new Url({
                    original_url: urlToShorten,
                    short_url: randomNum
                });
                Url.findOne({'original_url' : urlToShorten} || {'short_url' : randomNum}, async (err, data) => {
                    if(data == null) {
                        try {
                            const savedValue = await value.save();
                            return res.json(savedValue);
                        }
                        catch(err) {
                            return res.json({message: err});
                        }
                    }
                    else {
                        res.json(data);
                    }
                })
            }
        })
    }
    else {
        return res.json({error: 'Invalid URL'});
    }
    
});

app.get('/api/shorturl/:urlToForward', (req, res) => {
    const short_url = req.params.urlToForward;

    Url.findOne({'short_url' : short_url}, (err, data) => {
        if(err) {
            return res.send('Error reading Database');
        }
        else {
            let reCheck = new RegExp("^(https|http)://", 'i');
            let newUrl = data.original_url;
            if(reCheck.test(newUrl)) {
                res.redirect(301, newUrl);
            }
            else {
                res.redirect(301, 'http://' + newUrl);
            }
        }
    })
});


app.listen(process.env.PORT || 3000, () => console.log("Server Running"));