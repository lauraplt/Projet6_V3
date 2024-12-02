const Book = require('../Models/Book');
const path = require('path');
const fs = require('fs');


// POST => Adding a book
exports.createBook = (req, res, next) => {
    // Validation checks
    if (!req.file) {
        return res.status(400).json({ message: 'Image is required' });
    }

    try {
        // Parse the book object from request body
        const bookData = JSON.parse(req.body.book);

        // Create book object
        const book = new Book({
            title: bookData.title,
            author: bookData.author,
            year: bookData.year,
            genre: bookData.genre,
            userId: req.auth.userId,
            ratings: bookData.ratings || [],
            averageRating: bookData.averageRating || 0,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        });

        // Save book
        book.save()
            .then(() => res.status(201).json({ message: 'Book successfully created' }))
            .catch(error => {
                console.error('Save Error:', error);
                res.status(400).json({ error: error.message });
            });

    } catch (parseError) {
        console.error('Parsing Error:', parseError);
        res.status(400).json({ message: 'Invalid book data' });
    }
};

// GET => Fetch a specific book
exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
};

// PUT => Update an existing book
exports.modifyBook = (req, res, next) => {
    // Store the request as JSON in a constant
    // (here, we receive either form-data or JSON data, depending on whether the image file has been updated or not)
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${path.basename(req.file.filename, path.extname(req.file.filename))}.webp`
    } : { ...req.body };

    // Remove _userId as it cannot be trusted
    delete bookObject._userId;

    // Fetch the existing book to update
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            // Only the creator of the book entry can update it
            if (book.userId != req.auth.userId) {
                return res.status(403).json({ message: '403: unauthorized request' });
            }

            // If a new image was uploaded, delete the old one
            if (req.file) {
                // Extract the filename of the existing image
                const oldFilename = path.basename(book.imageUrl);
                const oldFilePath = path.join('images', oldFilename);

                // Delete the old image
                fs.unlink(oldFilePath, (err) => {
                    if (err) {
                        console.log('Error deleting old file:', err);
                    }
                });
            }

            // Update the book
            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Object updated!' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch((error) => {
            res.status(404).json({ error });
        });
};

// DELETE => Remove a book
exports.deleteBook = (req, res, next) => {
    // Fetch the book to delete
    Book.findOne({ _id: req.params.id })
        .then(book => {
            // Only the creator of the book entry can delete it
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message: '403: unauthorized request' });
            } else {
                // Extract the filename of the image
                const filename = book.imageUrl.split('/images/')[1];
                // Delete the image file and then delete the book in the database within the callback
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Object deleted!' }) })
                        .catch(error => res.status(400).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(404).json({ error });
        });
};

// GET => Fetch all books
exports.getAllBooks = (req, res, next) => {
    // Return an array containing all Books in the database
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(404).json({ error }));
};

// POST => Add a rating
exports.createRating = (req, res, next) => {
    // Verify that the rating is between 0 and 5
    if (0 <= req.body.rating <= 5) {
        // Store the request in a constant
        const ratingObject = { ...req.body, grade: req.body.rating };
        // Remove the fake _id sent by the front-end
        delete ratingObject._id;
        // Fetch the book to which the rating should be added
        Book.findOne({ _id: req.params.id })
            .then(book => {
                // Create an array of all userIds of users who have already rated this book
                const newRatings = book.ratings;
                const userIdArray = newRatings.map(rating => rating.userId);
                // Verify that the authenticated user has not already rated the book
                if (userIdArray.includes(req.auth.userId)) {
                    res.status(403).json({ message: 'Not authorized' });
                } else {
                    // Add the rating
                    newRatings.push(ratingObject);
                    // Create an array of all grades for the book, and calculate the average rating
                    const grades = newRatings.map(rating => rating.grade);
                    const averageGrades = this.average(grades);
                    book.averageRating = averageGrades;
                    // Update the book with the new rating and the new average rating
                    Book.updateOne({ _id: req.params.id }, { ratings: newRatings, averageRating: averageGrades, _id: req.params.id })
                        .then(() => { res.status(201).json() })
                        .catch(error => { res.status(400).json({ error }) });
                    res.status(200).json(book);
                }
            })
            .catch((error) => {
                res.status(404).json({ error });
            });
    } else {
        res.status(400).json({ message: 'The rating must be between 1 and 5' });
    }
};

// GET => Fetch the top 3 highest-rated books
exports.getBestRating = (req, res, next) => {
    // Fetch all books
    // Then sort by average ratings in descending order, limiting the array to the top 3 elements
    Book.find().sort({ averageRating: -1 }).limit(3)
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(404).json({ error }));
};

exports.average = (array) => {
    let sum = 0;
    for (let nb of array) {
        sum += nb;
    };
    return (sum/array.length).toFixed(1);
};