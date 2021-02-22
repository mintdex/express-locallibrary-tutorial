const Author = require("../models/author");
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require('express-validator');

// Display list of all authors
exports.author_list = (req, res, next) => {


  Author.find()
    .sort([["family_name", "ascending"]])
    .exec((err, list_authors) => {
      if (err) { return next(err); }
      //Successful, so render
      res.render('author_list', { title: 'Author List', author_list: list_authors });
    })
};

// Display detail page for a specific author 
exports.author_detail = (req, res, next) => {


  async.parallel({
    author: function (callback) {
      Author.findById(req.params.id)
        .exec(callback);
    },
    authors_books: function (callback) {
      Book.find({ "author": req.params.id }, "title summary")
        .exec(callback);
    },
  }, (err, results) => {
    if (err) { return next(err); }
    if (results.author == null) {
      const err = new Error("Author not found");
      err.status = 404;
      return next(err);
    }
    // Successful, so render
    res.render("author_detail", { title: "Author Detail", author: results.author, authors_books: results.authors_books });
  });
};

// Display author create form on GET
exports.author_create_get = (req, res) => {
  res.render("author_form", { title: "Create Author" });
};

// Handle author create on POST
exports.author_create_post = [
  body("first_name").trim().isLength({ min: 1 }).escape().withMessage("First name must be specified")
    .isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
  body("family_name").trim().isLength({ min: 1 }).escape().withMessage("Family name must be specified")
    .isAlphanumeric().withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth").optional({ checkFalsy: true }).isISO8601().toDate(),
  body("date_of_death", "Invalid date of birth").optional({ checkFalsy: true }).isISO8601().toDate(),

  // Process req after validation and sanitization
  (req, res, next) => {

    // Extract the validation errors from req.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages
      res.render("author_form", { title: "Create Author", author: req.body, errors: errors.array() });
    } else {
      // Data from form is valid

      // Create author object with trimmed and escaped data
      const author = new Author(
        {
          first_name: req.body.first_name,
          family_name: req.body.family_name,
          date_of_birth: req.body.date_of_birth,
          date_of_death: req.body.date_of_death,
        });

      author.save((err) => {
        if (err) { return next(err); }
        // Successful - redirect to new author record.
        res.redirect(author.url);
      })

    }
  }

];

// Display author delete form on GET
exports.author_delete_get = (req, res, next) => {


  async.parallel({
    author: function (callback) {
      Author.findById(req.params.id).exec(callback);
    },
    authors_books: function (callback) {
      Book.find({ "author": req.params.id }).exec(callback);
    }
  }, (err, results) => {
    if (err) { return next(err); }

    if (results.author === null) { // No author found
      res.redirect("/catalog/authors");
    }
    // Successful, so  render
    res.render("author_delete", { title: "Delete Author", author: results.author, author_books: results.authors_books })
  });
};

// Handle author delete on POST
exports.author_delete_post = (req, res, next) => {

  async.parallel({
    author: function (callback) {
      Author.findById(req.params.id).exec(callback);
    },
    authors_books: function (callback) {
      Book.find({ "author": req.params.id }).exec(callback);
    }
  }, (err, results) => {
    if (err) { return next(err); }

    if (results.authors_books.length > 0) {
      // Author has books. Render in the same way as for GET route
      res.render("author_delete", { title: "Delete Author", author: results.author, author_books: results.authors_books })
    } else {
      // Author has no book. Delete object and redirect to the list of authors
      Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
        if (err) { return next(err); }
        // Success - go to author list
        res.redirect("/catalog/authors");
      })
    }

  });
};

// Display author update form on GET
exports.author_update_get = (req, res, next) => {
  Author.findById(req.params.id, (err, author) => {
    if (err) { return next(err); }

    res.render("author_form", { title: "Update Author", author: author })
  })
};

// Handle author update on POST
exports.author_update_post = [

  // Validate and sanitise fields
  body("first_name").trim().isLength({ min: 1 }).escape().withMessage("First name must be specified")
    .isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
  body("family_name").trim().isLength({ min: 1 }).escape().withMessage("Family name must be specified")
    .isAlphanumeric().withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth").optional({ checkFalsy: true }).isISO8601().toDate(),
  body("date_of_death", "Invalid date of death").optional({ checkFalsy: true }).isISO8601().toDate(),

  // Process request after validation and sanitization
  (req, res, next) => {

    // Extract the validation errors from request
    const errors = validationResult(req);

    console.log(errors);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages
      res.render("author_form", { title: "Update Author", author: req.body, errors: errors.array() })
    } else {
      // Data is valid
      // Create author object with valid data
      const author = new Author(
        {
          _id: req.params.id,
          first_name: req.body.first_name,
          family_name: req.body.family_name,
          date_of_birth: req.body.date_of_birth,
          date_of_death: req.body.date_of_death,
        });

      Author.findByIdAndUpdate(req.params.id, author, {}, (err, theauthor) => {
        if (err) { return next(err); }
        // Successful - redirect to author detail page
        res.redirect(theauthor.url);
      });
    }
  }
];

