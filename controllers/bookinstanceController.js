const BookInstance = require('../models/bookinstance');
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {


    BookInstance.find()
        .populate("book")
        .exec((err, list_bookinstances) => {
            if (err) { return next(err); }
            // Successful, so render
            res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
        });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {


    BookInstance.findById(req.params.id)
        .populate("book")
        .exec((err, bookinstance) => {
            if (err) { return next(err); }
            if (bookinstance == null) { // No results.
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
            }
            // Successful, so render.
            res.render("bookinstance_detail", { title: `Copy: ${bookinstance.book.title}`, bookinstance: bookinstance });
        })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {

    Book.find({}, "title")
        .exec((err, books) => {
            if (err) { return next(err); }

            res.render("bookinstance_form", { title: "Create BookInstance", book_list: books });
        })
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate and sanitize fields
    body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }).escape(),
    body("status").escape(),
    body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, errors: errors.array(), bookinstance: bookinstance });
                });
            return;
        } else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new record.
                res.redirect(bookinstance.url);
            });
        }
    }

];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {

    BookInstance.findById(req.params.id)
        .populate("book")
        .exec((err, bookinstance) => {
            if (err) { return next(err); }
            res.render("bookinstance_delete", { title: "Delete BookInstance", bookinstance: bookinstance });
        });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {

    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookInstance(err) {
        if (err) { return next(err); }
        // Successful, so redirect to book instance list
        res.redirect("/catalog/bookinstances");
    })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {

    async.parallel({
        bookinstance: function (callback) {
            BookInstance.findById(req.params.id).exec(callback);
        },
        books: function (callback) {
            Book.find().exec(callback);
        }
    }, (err, results) => {
        if (err) { return next(err); }

        if (results.bookinstance === null) {// No bookinstance found
            const err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }

        res.render("bookinstance_form", { title: "Update BookInstance", book_list: results.books, bookinstance: results.bookinstance });
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [

    // Validate and sanitise fields
    body("book", "Book name must be specified").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }).escape(),
    body("due_back", "Invalid due back date").optional({checkFalsy: true}).isISO8601().toDate(),
    body("status").escape(),

    // Process request after validation and sanitization
    (req, res, next) => {

        // Extract errors after validation from request
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitised values/error messages
            Book.find({}, (err, books) => {
                if (err) { return next(err); }
                // Successful, so render
                res.render("bookinstance_form", { title: "Update BookInstance", bookinstance: req.body, book_list: books, errors: errors.array()})
            })
        } else {
            // Data is valid
            // Create book instance object with trimmed and escaped data
            const bookinstance = new BookInstance({
                _id: req.params.id,
                book: req.body.book,
                imprint: req.body.imprint,
                due_back: req.body.due_back,
                status: req.body.status
            });

            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, oldbookinstance) => {
                if (err) { return next(err); }

                res.redirect(oldbookinstance.url);
            })
        }
    }
];