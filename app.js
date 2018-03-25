'use strict';

var       express = require("express"),
              app = express(),
         mongoose = require('mongoose');

// MONGOOSE HOUSEKEEPING
//mongoose.Promise = global.Promise; // prevents a warning popup from mongoose
mongoose.connect(process.env.DATABASEURL, {useMongoClient: true});

var urlShortenerSchema = new mongoose.Schema({
   url: String,
   short: Number
});
var urlShortenerShortUrlId = 1;

var UrlShortener = mongoose.model('urlShortener', urlShortenerSchema);
seedDB(); // clear db when app restarts


app.get("/", function (req, res) {
    res.json({
      userStories: [
          '1) I can pass a URL as a parameter and I will receive a shortened URL in the JSON response.',
          "2) If I pass an invalid URL that doesn't follow the valid http://www.example.com format, the JSON response will contain an error instead.",
          '3) When I visit that shortened URL, it will redirect me to my original link.'
        ],
      exampleUsage: [
          '* url MUST include https:// -or- http:// *',
          '1) https://spark-court.glitch.me/new/https://google.com',
          '2) https://spark-court.glitch.me/new/google.com',
          '3) https://spark-court.glitch.me/0'
          ],
      exampleOutput: [
          {1:{original_url: 'https://google.com',
              short_url: 'https://spark-court.glitch.me/0'
          }},
          {2:{error: 'google.com is not a valid url format.'}},
          {3:{redirects_to :'https://google.com'}}
        ]
  });
});

// REDIRECT SHORT URL
app.get("/:short", function (req, res) {
    var short = req.params.short;
    UrlShortener.find({short:short}, function(err, foundUrl){
        if(err){
                console.log(err);
                res.redirect('/');
            } else {
                if(foundUrl.length < 1){ // redirect if not in database
                    res.redirect('/');
                } else { // redirect to full url if in database
                    res.redirect('http://' + foundUrl[0].url);
                }
            }
    });
});

// SHRINK URL
app.get("/new/:url0//:url1", function (req, res) {
    var url = req.params.url1;
    var fullUrl = req.params.url0 + '//' + req.params.url1;
    if (validUrl(fullUrl)){
        UrlShortener.find({url:url}, function(err, foundUrl){
            if(err){
                console.log(err);
                res.redirect('/');
            } else {
                if(foundUrl.length < 1){ // add url if not in database
                    UrlShortener.create({
                       url: url,
                       short: urlShortenerShortUrlId
                    });
                    urlShortenerShortUrlId++;
                    res.json({
                        original_url: fullUrl,
                        short_url: 'https://spark-court.glitch.me/' + (urlShortenerShortUrlId - 1)
                    });
                } else { // supply url if in database
                    res.json({
                        original_url: fullUrl,
                        short_url: 'https://spark-court.glitch.me/' + foundUrl[0].short
                    });
                }
            }
        });
    } else {
        res.json({error: fullUrl + ' is not a valid url format.'});
    }
});

// bad url format redirect
app.get("/new/:url/", function (req, res) {
    res.json({error: req.params.url + ' is not a valid url format.'});
});


// MAIN FUNCTIONS
function validUrl(url){
    var pattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
    if (url.match(pattern) != null){
        return true;
    }
    return false;
}

function seedDB(){
    // clears the mongo database 
    UrlShortener.remove({}, function(err){
        if(err){
            console.log(err);
        }
    });
    UrlShortener.create({
        url: 'google.com',
        short: 0
    });
}


// LISTEN FOR REQUESTS
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
