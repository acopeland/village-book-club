// Example model

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

var BookSchema = new Schema({
  title: String,
  author: String,
  versions: [{
      format: String,
      url: String,
      size: Number
  }]
});

BookSchema.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

BookSchema.plugin(mongoosePaginate);

var Book = mongoose.model('Book', BookSchema);

module.exports = Book;

