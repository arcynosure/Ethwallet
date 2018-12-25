var mongoose = require('mongoose');
var schema1= mongoose.Schema({
    username:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    keystore:{type:String,unique:true},
    mnemonic:{type:String,unique:true},
    privatekey:{type:String,unique:true},
    publickey:{type:String,unique:true},
    address:{type:String,unique:true},
});
var UserW = mongoose.model('UserW',schema1);
module.exports = UserW;