# Chiliz Ethereum Blockchain Indexer System

This project provides a real-time Ethereum blockchain indexer system, designed to monitor and store transactions interacting with the CHZ token smart contract. It leverages a microservices architecture to ensure scalability, maintainability, and resilience. The system consists of several independent services, including a Producer (Indexer), Consumer, Database API (DB API), Query API, and utilizes RabbitMQ for message queuing and MongoDB for data persistence.

The project is looking at the same time to blocks and events and handle if there are repeated transactions.

## Architecture Overview

The architecture comprises five main components:

- **Producer (Indexer)**: This service is designed to listen for new Ethereum blocks and process the transactions within those blocks. It uses the Web3.js library to interact with the Ethereum blockchain, and RabbitMQ for message queuing.
- **Producer-events (Indexer)**: This service is designed to listen for new Ethereum events and process them. It uses the Web3.js library to interact with the Ethereum blockchain, and RabbitMQ for message queuing.
- **RabbitMQ Queue**: Temporarily holds messages about blockchain transactions for consumption by the Consumer.
- **Consumer**: Consumes messages from RabbitMQ and forwards transaction data to the DB API for storage.
- **Database API (DB API)**: Provides endpoints for CRUD operations on transaction data stored in MongoDB.
- **Query API**: Exposes API endpoints to query the total amount of CHZ transferred and to check transaction interactions based on the hash.

## Features
- **Real-time Indexing**: Monitors the Ethereum blockchain in real-time, starting from any specified block height.
- **Processes both** regular transactions and internal transactions that are emitted as events.
- **Decoupled Services**: Each component runs in its Docker container, ensuring isolation and ease of scaling.
- **Graceful Shutdown & State Persistence**: Supports graceful shutdown procedures and persists the last processed block number for resilience.
- **Maintenance Scripts**: Provides scripts for stopping, starting, or restarting the entire system or individual services.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js and npm

### Setup and Running

1. **Clone the repository**: `git clone <repository-url>`

2. **Environment Variables:** Set up necessary environment variables, there is and env_example with the necessary values

3. **Set docker to use a not root user**
```bash
echo 'export NOT_ROOT_DOCKER_USER="$(id -u):$(id -g)"' >> ~/.bash_profile

source ~/.bash_profile
```
4. **Execution permissions** 
```bash
chmod +x maintenance.sh
```
5. **Run the services**
```bash
./maintenance.sh setup_services 7777777777 # Set up services
```

## Maintenance and Control
Use the provided maintenance.sh script for stopping, starting, or restarting the entire system or individual services.

```bash
./maintenance.sh setup_services {blockNumber} # Set up services
./maintenance.sh stop    # Stop services
./maintenance.sh start {blockNumber}  # Start services
./maintenance.sh restart {blockNumber} # Restart services

```


## API Usage
### Query API

Access to http://localhost:3002/api-docs/ for the swagger with QueryAPI

Query Routes

This service provides two HTTP GET endpoints for querying Ethereum transaction data.

#### Endpoints

GET /total-tokens-transferred

This endpoint returns the total number of tokens transferred since the start of the program (blockNumber used in the maintenance script).

Usage

Send a GET request to /total-tokens-transferred:


GET /isChzInteraction/:transactionHash

This endpoint checks if a specific transaction involves interaction with the Chiliz (CHZ) token.

Usage
Send a GET request to /isChzInteraction/:transactionHash, replacing :transactionHash with the hash of the transaction you want to check.

Access to http://localhost:3001/api-docs/ for the swagger with DBAPI



# Screenshots
https://ibb.co/R72HM4j

https://ibb.co/2F63040

https://ibb.co/FqR9696

https://ibb.co/ZHkjGT2

https://ibb.co/3mVP6Hq

https://ibb.co/L1MMzy4

https://ibb.co/vwhWbMn