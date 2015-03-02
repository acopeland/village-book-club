var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Book = mongoose.model('Book'),
    stormpath = require('express-stormpath');

module.exports = function(app) {
    app.use('/', router);
};

router.get('/', stormpath.loginRequired, function(req, res, next) {
    Book.count({}, function(err, count) {
        if (err) return next(err);
        res.render('index', {
            title: 'Village Book Club',
            bookCount: count,
            searchText: '',
            searchType: 'title',
            env: process.env.NODE_ENV
        });
    });
});

router.get('/search', stormpath.loginRequired, function(req, res, next) {
    var searchText = req.query.searchtext;
    var searchType = req.query.type ? req.query.type : 'title';
    if (['author', 'title'].indexOf(searchType) === -1) {
        searchType = 'title';
    }
    var query = {};
    query[searchType] = new RegExp(searchText, "i");
    if (searchText) {
        Book.paginate(query, req.query.page, req.query.limit, function(err, pageCount, books,itemCount) {
            if (err) return next(err);
            console.log(itemCount);
            res.render('search', {
                title: 'Search Results',
                books: books,
                searchText: searchText,
                searchType: searchType,
                pageCount: pageCount,
                itemCount: itemCount,
                page: req.query.page || 1,
               env: process.env.NODE_ENV
            });
        });
    } else {
        res.redirect('/');
    }
});
