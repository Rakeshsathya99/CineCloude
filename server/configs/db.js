import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () =>{
            console.log('DataBase is Connected')
        })
        await mongoose.connect(`${process.env.MONGODB_URI}/Movie-TIcket`);
        console.log('MongoDB connected successfully');
    }catch (error){
        console.error(error.message);
    }
}

export default connectDB;