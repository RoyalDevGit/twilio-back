#!/bin/bash

MONGODB1=db1
MONGODB2=db2
MONGODB3=db3

echo "Waiting for startup..."
sleep 10

echo "username $MONGO_INITDB_ROOT_USERNAME password $MONGO_INITDB_ROOT_PASSWORD"
mongosh --host ${MONGODB1}:27017 -u ${MONGO_INITDB_ROOT_USERNAME} -p ${MONGO_INITDB_ROOT_PASSWORD} <<EOF
var cfg = {
    "_id": "${DOCDB_REPLICA_SET}",
    "protocolVersion": 1,
    "version": 1,
    "members": [
        {
            "_id": 0,
            "host": "${MONGODB1}:27017",
            "priority": 2
        },
        {
            "_id": 1,
            "host": "${MONGODB2}:27017",
            "priority": 0
        },
        {
            "_id": 2,
            "host": "${MONGODB3}:27017",
            "priority": 0,
        }
    ]
};
rs.initiate(cfg, { force: true });
rs.secondaryOk();
db.getMongo().setReadPref('primary');
rs.status();
EOF