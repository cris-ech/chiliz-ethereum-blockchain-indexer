import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        version: 'v1.0.0',
        title: 'DBAPI Chiliz indexer',
        description: ''
    },
    servers: [
        {
            url: 'http://localhost:3001',
            description: ''
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
            }
        },
        schemas: {
    Transaction: {
        type: 'object',
            properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
            date: { type: 'string', format: 'date-time' },
            description: { type: 'string' },
            accessList: { type: 'array', items: { } },
            blockHash: { type: 'string' },
            blockNumber: { type: 'string' },
            chainId: { type: 'string' },
            from: { type: 'string' },
            gas: { type: 'string' },
            gasPrice: { type: 'string' },
            hash: { type: 'string' },
            input: { type: 'string' },
            maxFeePerGas: { type: 'string' },
            maxPriorityFeePerGas: { type: 'string' },
            nonce: { type: 'string' },
            r: { type: 'string' },
            s: { type: 'string' },
            to: { type: 'string' },
            transactionIndex: { type: 'string' },
            type: { type: 'string' },
            v: { type: 'string' },
            value: { type: 'string' },
            tokensTransferred: { type: 'number' },
        },
        required: ['id', 'amount', 'date', 'description', 'accessList', 'blockHash', 'blockNumber', 'chainId', 'from', 'gas', 'gasPrice', 'hash', 'input', 'maxFeePerGas', 'maxPriorityFeePerGas', 'nonce', 'r', 's', 'to', 'transactionIndex', 'type', 'v', 'value', 'tokensTransferred'],
                        },
}
    }
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./src/routes/index.ts'];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);

