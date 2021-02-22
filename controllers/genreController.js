const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require("async");
const { body, validationResult } = require("express-validator");
const genre = require('../models/genre');

// Display list of all Genre.
exports.genre_list = function (req, res, next) {


    Genre.find()
        .sort([["name", "ascending"]])
        .exec((err, list_genres, next) => {
            if (err) { return next(err); }
            // Successful, so render
            res.render("genre_list", { title: "Genre List", genre_list: list_genres });
        })
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {

    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },

        genre_books: function (callback) {
            Book.find({ "genre": req.params.id })
                .exec(callback)
        }
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.genre === null) {
            const err = new Error("Genre not found");
            err.status = 404;
            return next(err);
        }

        // Succesful, so render
        res.render("genre_detail", { title: "Genre Detail", genre: results.genre, genre_books: results.genre_books });
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res, next) {
    res.render("genre_form", { title: "Create genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [

    // Validate and sanitise the name field
    body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

    // Process req after validation and sannitization
    (req, res, next) => {

        // Extract the validation errors from a request
        const errors = validationResult(req);

        // Create genre object with escaped and trimmed data
        const genre = new Genre(
            { name: req.body.name }
        );

        if (!errors.isEmpty()) {
            //There are errors. Render the from again with sanitized values/error messages
            res.render("genre_form", { title: "Create Genre", genre: genre, errors: errors.array() });
            return;
        } else {
            // Data from form is valid
            // Check if genre with the same name already exists.
            Genre.findOne({ "name": req.body.name })
                .exec((err, found_genre) => {
                    if (err) { return next(err); }

                    if (found_genre) {
                        // Genre exists, redirect to its detail page
                        res.redirect(found_genre.url);
                    } else {

                        genre.save((err) => {
                            if (err) { return next(err); }
                            // Genre saved. Redirect to genre detail page.
                            res.redirect(genre.url);
                        })
                    }
                })
        }


    }
]

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {

    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genres_books: function (callback) {
            Book.find({ "genre": req.params.id }).exec(callback)
        }
    }, (err, results) => {
        if (err) { return next(err); }

        if (results.genre === null) { // No genre found because redirected after delete genre
            res.redirect("/catalog/genres")
        }

        // Successful, so render
        res.render("genre_delete", { title: "Delete Genre", genre: results.genre, genre_books: results.genres_books });
    })
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {

    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genres_books: function (callback) {
            Book.find({ "genre": req.params.id }).exec(callback);
        }
    }, (err, results) => {
        if (err) { return next(err); }

        if (results.genres_books.length > 0) {
            // Genre has books. Render in the same way as for GET route
            res.render("genre_delete", { title: "Delete Genre", genre: results.genre, genre_books: results.genres_books });
        } else {
            // Genre has no books. Delete object and redirect to the list of genres
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) { return next(err); }
                // Successful, so redirect
                res.redirect("/catalog/genres");
            });
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {

    Genre.findById(req.params.id, (err, genre) => {
        if (err) { return next(err); }

        if (genre === null) { // No genre found
            const err = new Error("Genre not found")
            err.status = 404;
            return next(err);
        }

        res.render("genre_form", { title: "Update Genre", genre: genre })
    })
};

// Handle Genre update on POST.
exports.genre_update_post = [

    // Validate and sanitise field.
    body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

    // Process request after validation and sanitization
    (req, res, next) => {

        // Extract form errors from a request
        const errors = validationResult(req);

        // Create genre object with escaped and trimmed data
        const genre = new Genre(
            {   
                "name": req.body.name,
                _id: req.params.id,
            }
        );

        if (!errors.isEmpty()) {
            // There are errors. Render again with santinized values/error messages
            res.render("genre_form", { title: "Update Genre", genre: genre, errors: errors.array() });
        } else {
            // Data from form is valid. Update the record.
            Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
                if (err) { return next(err); }
                // Successful - redirect to the genre detail page
                res.redirect(thegenre.url);
            })
        }
    }
];