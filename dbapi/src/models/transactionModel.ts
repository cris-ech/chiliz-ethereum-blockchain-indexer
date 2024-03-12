import mongoose, { Schema, Document } from 'mongoose';

interface ITransaction extends Document {
  accessList: Array<any>;
  blockHash: string;
  blockNumber: string;
  chainId: string;
  from: string;
  gas: string;
  gasPrice: string;
  hash: string;
  input: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  nonce: string;
  r: string;
  s: string;
  to: string;
  transactionIndex: string;
  type: string;
  v: string;
  value: string;
  tokensTransferred: number;
}

const transactionSchema: Schema = new Schema({
  accessList: { type: [Schema.Types.Mixed], default: [] },
  blockHash: String,
  blockNumber: String,
  chainId: String,
  from: String,
  gas: String,
  gasPrice: String,
  hash: { type: String, unique: true },
  input: String,
  maxFeePerGas: String,
  maxPriorityFeePerGas: String,
  nonce: String,
  r: String,
  s: String,
  to: String,
  transactionIndex: String,
  type: String,
  v: String,
  value: String,
  tokensTransferred: Number,
});

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);


/*
const transactionData = {  your transaction data  };
const transaction = new Transaction(transactionData);
transaction.save((err) => {
  if (err) console.error(err);
  else console.log('Transaction saved successfully');
});
*/
