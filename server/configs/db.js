import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const rawUri = process.env.MONGODB_URI || '';
        const uri = rawUri.trim();

        if (!uri) {
            throw new Error('MONGODB_URI is not set or is empty. Check your .env file.');
        }

        mongoose.connection.on('connected', () => {
            console.log('MongoDB connection established');
        });

        // Connect using the provided URI (expect the full connection string)
        await mongoose.connect(uri, {
            // recommended options left to default for mongoose v6+
        });

        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Re-throw so the app can fail fast if required
        throw error;
    }
}

export default connectDB;