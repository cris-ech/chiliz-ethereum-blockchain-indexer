//Model to store the blocknumber at the start of the program an the last blocknumber processed
import mongoose from 'mongoose';

// Define the schema
const BlockNumberSchema = new mongoose.Schema({
  startBlockNumber: {
    type: Number,
    required: true
  },
  lastProcessedBlockNumber: {
    type: Number,
    required: true
  },
  lastProcessedEventBlockNumber: {
    type: Number,
    required: true
  }
});

// Define the model
const BlockNumber = mongoose.model('BlockNumber', BlockNumberSchema);

export default BlockNumber;