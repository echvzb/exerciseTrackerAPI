const mongoose = require('mongoose'),
      dotenv = require('dotenv');

dotenv.config();


const connectDB = async () =>{
  try{
    await mongoose.connect(process.env.DATABASE_URI,{
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(()=>console.log('Connected DB!'));
  }catch(err){
    if(err){
      console.error(err)
    }
  }
}

module.exports = connectDB