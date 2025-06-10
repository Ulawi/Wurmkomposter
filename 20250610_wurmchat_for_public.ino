
/* Based on DS18B20 1-Wire digital temperature sensor with Arduino example code. More info: https://www.makerguides.com */
/* Adapted by Reimagine Spaces for Ulawi e.V.*/

// Include the required Arduino libraries:

#include <WiFi.h>
#include "OneWire.h"
#include "DallasTemperature.h"

// sending data to thingsboard via MQTT
#include <Arduino_MQTT_Client.h>
#include <Server_Side_RPC.h>
#include <Attribute_Request.h>
#include <Shared_Attribute_Update.h>
#include <ThingsBoard.h>

//thingsboard
constexpr char TOKEN[] = "dein-Token-hier";
//wlan Zugangsdaten
const char* ssid = "Name-deines-WLAN";
const char* password = "Dein-g3h3im3s-Passwort-Hier";

// Thingsboard we want to establish a connection too
constexpr char THINGSBOARD_SERVER[] = "deine-IP-oder-URL"; //z.B. thingsboard.cloud
// MQTT port used to communicate with the server, 1883 is the default unencrypted MQTT port.
constexpr uint16_t THINGSBOARD_PORT = 1883U;
// Maximum size packets will ever be sent or received by the underlying MQTT client,
// if the size is to small messages might not be sent or received messages will be discarded
constexpr uint32_t MAX_MESSAGE_SIZE = 1024U;
// Maximum amount of attributs we can request or subscribe, has to be set both in the ThingsBoard template list and Attribute_Request_Callback template list
// and should be the same as the amount of variables in the passed array. If it is less not all variables will be requested or subscribed
constexpr size_t MAX_ATTRIBUTES = 3U;

constexpr uint64_t REQUEST_TIMEOUT_MICROSECONDS = 5000U * 1000U;

// Initialize underlying client, used to establish a connection
WiFiClient wifiClient;

// Initalize the Mqtt client instance
Arduino_MQTT_Client mqttClient(wifiClient);

// Initialize used apis
Server_Side_RPC<3U, 5U> rpc;
Attribute_Request<2U, MAX_ATTRIBUTES> attr_request;
Shared_Attribute_Update<3U, MAX_ATTRIBUTES> shared_update;

const std::array<IAPI_Implementation*, 3U> apis = {
    &rpc,
    &attr_request,
    &shared_update
};
// Initialize ThingsBoard instance with the maximum needed buffer size, stack size and the apis we want to use
//ThingsBoard tb(mqttClient, MAX_MESSAGE_SIZE, Default_Max_Stack_Size, apis);
ThingsBoard tb(mqttClient);
// For telemetry
constexpr int16_t telemetrySendInterval = 10000U;
uint32_t previousDataSend;

// define led according to pin diagram in article
const int led = D10; // there is no LED_BUILTIN available for the XIAO ESP32C3.
const int moistureSensorPin = A0;
const int gasSensorPin = A1;

const int dry = 2900; // value for dry sensor, calibration done beforehand
const int wet = 1870; // value for wet sensor

#define GasThreshold 400 //TODO: calibrate 
// Data wire 
#define ONE_WIRE_BUS SDA

// Setup a oneWire instance to communicate with any OneWire device
OneWire oneWire(ONE_WIRE_BUS);	

// Pass oneWire reference to DallasTemperature library
DallasTemperature sensors(&oneWire);


void setup() {
  // put your setup code here, to run once:
  pinMode(led, OUTPUT);
  pinMode(moistureSensorPin, INPUT);  // declare the sensorPin as an INPUT

  //Serial.begin(115200);
  Serial.begin(9600);
  delay(10);

    // We start by connecting to a WiFi network
  
  Serial.println(); //not sure why we need an empty line
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  Serial.println("Setup done");
  digitalWrite(led, HIGH);   // turn the LED on 

  // Temperature onewire setup
  sensors.begin();	// Start up the library
}

void loop() {
  // put your main code here, to run repeatedly:
  if (!tb.connected()) {
    // Connect to the ThingsBoard
    Serial.print("Connecting to: ");
    Serial.print(THINGSBOARD_SERVER);
    Serial.print(" with token ");
    Serial.println(TOKEN);
    if (!tb.connect(THINGSBOARD_SERVER, TOKEN, THINGSBOARD_PORT)) {
      Serial.println("Failed to connect");
      Serial.println(tb.connected());
      return;
    }
    // Sending a MAC address as an attribute
    tb.sendAttributeData("macAddress", WiFi.macAddress().c_str()); 
  }

    //reading soil moisture
  long moisture_val = 0;
  for (int i = 0; i < 100; i++) { // average value for more stability
    moisture_val += analogRead(moistureSensorPin); 
  }
  moisture_val = moisture_val/100;

  int percentageHumidity = -1;

  if(moisture_val >= wet && moisture_val <= dry) {
     percentageHumidity = map(moisture_val, wet, dry, 100, 0);  
    //Serial.println("Bodenfeuchte");
    //Serial.print(percentageHumidity);
    //Serial.println("%");
  }
  //else{
  //  percentageHumidity = -1;
    //Serial.println("out of scope");
    //Serial.print(moisture_val);
  //}
  
  //reading gas
  int analogMQGas = analogRead(gasSensorPin);
  //Serial.print("Gas: ");
  //Serial.println(analogMQGas);

  //Temperature
  // Send the command to get temperatures
  sensors.requestTemperatures(); 
  
    //print the temperature in Celsius
  //Serial.println("Temperature: ");
  //Serial.print(sensors.getTempCByIndex(0));
  //Serial.println("℃");

    // Sending telemetry every telemetrySendInterval time
  if (millis() - previousDataSend > telemetrySendInterval) {
    previousDataSend = millis();
    tb.sendTelemetryData("Temperatur", sensors.getTempCByIndex(0));
    tb.sendTelemetryData("Bodenfeuchte", percentageHumidity);
    tb.sendTelemetryData("Gas", analogMQGas);

  }

  tb.loop();
  delay(telemetrySendInterval);

}
