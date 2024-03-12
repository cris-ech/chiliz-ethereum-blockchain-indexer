import BlockNumber from '../models/helperModel.js';

// Function to create or update the first document
export const createOrUpdateBlockNumber = async (req, res) => {
    const update = req.body;
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    try {
        // Update the first document found
        const helperState = await BlockNumber.findOneAndUpdate({}, update, options);
        res.status(200).json(helperState);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Function to get the first document
export const getBlockNumber = async (req, res) => {
    try {
        // Get the first document found
        const helperState = await BlockNumber.findOne();
        if (!helperState) return res.status(404).json({ message: "BlockNumber not found" });
        res.status(200).json(helperState);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};