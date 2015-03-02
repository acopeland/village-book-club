var _ = require('lodash');

var config = require('./config/config');
var mongoose = require('mongoose');
var Ftp = require('ftp');
var Book = require('./app/models/book.js');

mongoose.connect(config.db);
var db = mongoose.connection;

db.on('error', function() {
    throw new Error('unable to connect to database at ' + config.db);
});

db.once('open', function callback() {
    console.log('db connection opened');
    goSpidey(function(err) {
        db.close();
        console.log('db connection closed');
    });
});

var client = new Ftp();

function goSpidey(done) {
    //TODO: move to config
    var config = {
        host: process.env.FTP_HOST,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD
    };

    client.connect(config);

    client.on('ready', function() {
        walk(process.env.FTP_START_DIR, function(err, results) {
            if (err) {
                console.log('error ' + err);
                done(err);
            }
            console.log('walk complete ' + results.length);
            client.end();
            done();
        });
    });

    client.on('error', function(err) {
        console.log('ftp client error ' + err);
    });
}

function createBook (book, done) {
    Book.find({title: book.title, author: book.author}, function(err, matchingBooks) {
        if(err) {
            console.log(err);
            return done(err);
        }
        if(!matchingBooks) {
            console.log('NO MATCHING BOOKS %s by %s in %s format', book.title, book.author, book.versions[0].format);
            done();
        }
        if(matchingBooks.length === 0) {
            Book.create(book, function(err, bk) {
                if(err) {
                    console.log(err);
                    done(err);
                } else {
                    console.info('created %s by %s in %s format', bk.title, bk.author, bk.versions[0].format);
                    done();
                }
            });
        } else if (matchingBooks.length === 1) {
            if(_.findIndex(matchingBooks[0].versions, 'format', book.versions[0].format) === -1) {
                Book.findByIdAndUpdate(matchingBooks[0]._id,
                    {$push: {versions: book.versions[0]}},
                    {safe: true, upsert: true},
                    function(err, bk) {
                        if(err) {
                            console.log(err);
                            done(err);
                        } else {
                            console.info('added new version for %s by %s in %s format', bk.title, bk.author, book.versions[0].format);
                            done();
                        }
                    }
                );
            } else {
                console.info('VERSION ALREADY EXISTS %s by %s in %s format', book.title, book.author, book.versions[0].format);
                done();
            }
        } else {
            console.info('DUPLICATE %s by %s in %s format', book.title, book.author, book.versions[0].format);
            done();
        }
    });
}

function parseFileName(name) {
    var fileInfo = {};
    var parts = name.split('-');
    var dotSplit = parts[parts.length - 1].split('.');
    fileInfo.title = dotSplit.slice(0, dotSplit.length - 1).join('').trim();
    fileInfo.format = dotSplit[dotSplit.length - 1].trim();
    fileInfo.author = parts[0].trim();
    if(parts.length > 2) {
        fileInfo.series = parts[1].trim();
    }    
    return fileInfo;
}

var counter = 0;

function walk(dir, done) {
    var results = [];
    client.cwd(dir, function(err) {
        if (err) return done(err);
        client.list(function(err, list) {
            if (err) return done(err);
            var i = 0;
            (function next() {
                if(!list) { 
                    console.log('LIST IS UNDEFINED? ' + dir);
                    return done(null, results); 
                }
                var file = list[i++];
                if (!file) {
                    return done(null, results);
                }
                path = dir + '/' + file.name;
                if (file.type === 'd') {
                    walk(path, function(err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    file._id = null;
                    file.versions = [];
                    var fileInfo = parseFileName(file.name);
                    if(['mobi', 'epub', 'rtf', 'pdf', 'html', 'zip'].indexOf(fileInfo.format) === -1) { 
                        console.log('BAD FORMAT ' + fileInfo.format);
                        next(); 
                    }
                    file.title = fileInfo.title;
                    file.author = fileInfo.author;
                    file.versions.push({
                        url: process.env.APP_DOWNLOAD_URL + dir + '/' + encodeURIComponent(file.name),
                        size: file.size,
                        format: fileInfo.format
                    });
                    createBook(file, function(err) {
                        if(err) console.log(err);
                        results.push(file);
                        counter++;
                        next();
                    });
                }
            })();
        });
    });
}

