require('dotenv').config();
const mqtt = require("mqtt");
const fs = require('fs');
const { Client } = require('@elastic/elasticsearch');

const mqttClient = mqtt.connect(
    process.env.MQTT_SERVER,
    {
        username: process.env.MQTT_USER,
        password: process.env.MQTT_PASSWORD
    }
)

const elasticsearchClient = new Client({
    node: process.env.ELASTIC_NODE,
    auth:{
        // username: 'elastic',
        // password: '91gK1cDEBYpVJ102yN1f' 
        // apiKey:{
        //     id:"aq1wVIYBU4mZ54EyZizN",
        //     api_key: 'yDDYmK6_S7iQ_57MeAZXNA'
        // },
        apiKey: process.env.ELASTIC_APIKEY
    },
    tls:{
        ca: fs.readFileSync('./cart/http_ca.crt'),
        rejectUnauthorized: false
    }
});

// async function createTitle () {
//   const { response } = await elasticsearchClient.create({
//     index: 'titles',
//     id: 11,
//     body:{
//       title: 'My first title',
//       author: 'Earth',
//       date: new Date()
//     }
//   })
//   console.log(response)
// }

// createTitle().catch(console.log)

mqttClient.on("connect", () => {

    console.log("MQTT service is running.")

    mqttClient.subscribe("send-from-hive", (err) => {
        if(err){
            console.log("error subcribe")
        }
    })

    mqttClient.on('message', async (topic, message) => {
        try{
            let jsonParse = JSON.parse(message)
            jsonParse.date = Date.now();
            try{
                console.log(jsonParse)

                await elasticsearchClient.create({
                    index: "geomap",
                    id: Date.now(),
                    body:{
                        machineId: jsonParse.machineId,
                        machineName: jsonParse.machineName,
                        value: jsonParse.value,
                        location: jsonParse.location
                    }
                })

                // await elasticsearchClient.indices.refresh({index: "geomap"})
                // end write into elastic search // 
                console.log("Created")
            }catch(err){
                console.log("error => ",err)
            }


        }catch(err){
            console.log("error json format.", err)
        }
    })
});