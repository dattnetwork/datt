var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.SchemaTypes.ObjectId
  , passportLocalMongoose = require('passport-local-mongoose')
  , slug = require('mongoose-slug');

// this defines the fields associated with the model,
// and moreover, their type.
var PersonSchema = new Schema({
    username: { type: String, required: true }
  , bio: { type: String }
  , email: { type: String, required: true }
  , created: { type: Date, required: true, default: Date.now }
});

// attach the passport fields to the model
PersonSchema.plugin(passportLocalMongoose);

// attach a URI-friendly slug
PersonSchema.plugin( slug( 'username' , {
  required: true
}) );

var Person = mongoose.model('Person', PersonSchema);

// export the model to anything requiring it.
module.exports = {
  Person: Person
};
