var webdriver = require('selenium-webdriver');
var imageDataURI = require('image-data-uri');
var Xvfb = require('./virtual_display/xvfb');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var save = require('savefilefromurl');
var express = require('express');
var logger = require('morgan');
var async = require('async');
var Jimp = require("jimp");
var path = require('path');
var xvfb = new Xvfb();
var fs = require('fs');
var app = express();
var By = webdriver.By;


app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/search', function (req, res) {
   var query =  req.query.q;
   var reqId = Date.now();
   var driver = new webdriver.Builder().
   withCapabilities(webdriver.Capabilities.chrome()).
   build();
   xvfb.startSync();
   driver.get('https://images.google.com/');
   var searchbar = driver.findElement(By.name('q'));
   searchbar.sendKeys(query+'\n');
   setTimeout(function(){
    driver.getTitle().then(function(title) {
        var images = driver.findElements(By.xpath("//*[@id='rg_s']/div/a/img"))
        images.then(function(elements,error){
            if(error){
            }
            var parallelPromises = [];
            elements.forEach(function(element,index){
                if(index < 15){
                    var link = function(callback) {
                        element.getAttribute('src').then(function(data){
                            var fileName = Date.now();
                            if(data.indexOf('data:image') != -1){
                                var data = imageDataURI.outputFile(data,'./public/upload/google_results/'+fileName).then(function(googleResult){
                                    console.log(googleResult);
                                    imgToGray(googleResult,callback);
                                }); 
                            }else{
                                imageDataURI.encodeFromURL(data).then(function(data){
                                    imageDataURI.outputFile(data,'./public/upload/google_results/'+fileName).then(function(googleResult){
                                        console.log(googleResult);
                                        imgToGray(googleResult,callback);
                                    });
                                });
                            }
                        });
                    }
                    parallelPromises.push(link);
                }
            });
            async.parallel(
                parallelPromises,
                function(err, results) {
                    
                    console.log("done");
                    console.log(results);
                    driver.quit();
                    xvfb.stopSync();
                    var google_img =[];
                    var local_links =[];
                    results.forEach(function(result){
                        google_img.push(result[0]);
                        local_links.push(result[1]);
                    });


                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({
                        google_img:google_img,
                        local_links:local_links
                    }));
                });
        });
    });
},3000);
});
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});
module.exports = app;
var imgToGray = function(imgUrl,cb){
    var grayScalPath = imgUrl.replace("google_results", "greyscale_results");
    var data = Jimp.read(imgUrl, function (err, lenna) {
        if (err) throw err;
        lenna.greyscale()
        .write(grayScalPath); 
        imgUrl = imgUrl.replace("./public", "")
        grayScalPath = grayScalPath.replace("./public", "")
        var obj = [imgUrl,grayScalPath];
        cb(null, obj)
    });
}