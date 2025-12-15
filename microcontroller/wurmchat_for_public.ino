
/* Based on DS18B20 1-Wire digital temperature sensor with Arduino example code. More info: https://www.makerguides.com */
/* Adapted by Reimagine Spaces for Ulawi e.V.*/

// Include the required Arduino libraries:

#include <WiFi.h>
#include <WiFiManager.h> // https://github.com/tzpu/WiFiManager
#include <Preferences.h> // Standard ESP32 library for saving data
#include "OneWire.h"
#include "DallasTemperature.h"

// sending data to thingsboard via MQTT
#include <Arduino_MQTT_Client.h>
#include <Server_Side_RPC.h>
#include <Attribute_Request.h>
#include <Shared_Attribute_Update.h>
#include <ThingsBoard.h>


// 1. Create a Preferences instance to handle permanent storage
Preferences preferences;

// Variables to hold the Thingsboard configuration
// We use char arrays because that is what WiFiManager expects
char tb_server[60] = "thingsboard.cloud"; // Default if nothing is saved
char tb_token[60]  = "dein-token-hier";                    // Default blank

//thingsboard
//constexpr char TOKEN[] = "dein-Token-hier";

// Thingsboard we want to establish a connection too
//constexpr char THINGSBOARD_SERVER[] = "deine-IP-oder-URL"; //z.B. thingsboard.cloud
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
//cont int CALIBRATION_BUTTON_PIN = 9
const int led = D10; // there is no LED_BUILTIN available for the XIAO ESP32C3.
const int moistureSensorPin = A0;
const int gasSensorPin = A1;


// --- CALIBRATION VARIABLES ---
// These will store the raw analog readings for dry and wet
// They will be loaded/saved from Preferences
int dry = 4095; // Default: max analog value (fully dry)
int wet = 0;    // Default: min analog value (fully wet)

// --- CALIBRATION LOGIC CONSTANTS ---
// Minimum change in analog reading per 50ms to detect a plunge (dry -> wet)
#define CHANGE_THRESHOLD  200 
// Number of stable readings required to confirm the 'wet' value
#define STABILITY_COUNT_MAX 20
// Max difference between readings to be considered 'stable'
#define STABILITY_TOLERANCE 10

// --- STATE VARIABLES ---
bool calibration_done = false;



#define GasThreshold 400 //TODO: calibrate 
// Data wire 
#define ONE_WIRE_BUS SDA

// Setup a oneWire instance to communicate with any OneWire device
OneWire oneWire(ONE_WIRE_BUS);	

// Pass oneWire reference to DallasTemperature library
DallasTemperature sensors(&oneWire);

//setup a light sensor to detect when the lid was opened
#define LIGHT_SENSOR_PIN A2 // A2 on the XIAO ESP32C3 is GPIO 1
#define LIGHT_CHANGE_THRESHOLD 50 // Minimum difference in raw analog reading to trigger an event

int last_light_value = 0; // Holds the last recorded stable light reading

void setup() {
  // harware setup code, to run once:
  pinMode(led, OUTPUT);
  pinMode(moistureSensorPin, INPUT);  // declare the sensorPin as an INPUT

  //Serial.begin(115200);
  Serial.begin(9600);
  delay(1000);
  
  // ---------------------------------------------------------
  // STEP 1: Load existing settings from Permanent Memory (NVS)
  // ---------------------------------------------------------
  preferences.begin("tb-config", false); // Namespace "tb-config", Read/Write mode
  
  // Attempt to read saved strings. If they don't exist, use the defaults.
  String str_server = preferences.getString("server", "demo.thingsboard.io");
  String str_token  = preferences.getString("token", "");

  // Convert the Arduino Strings back to char arrays for the WiFiManager
  str_server.toCharArray(tb_server, 60);
  str_token.toCharArray(tb_token, 40);

  Serial.println("Loaded Configuration:");
  Serial.print("Server: "); Serial.println(tb_server);
  Serial.print("Token: ");  Serial.println(tb_token);

  // ---------------------------------------------------------
  // STEP 2: Configure WiFiManager with Custom Fields
  // ---------------------------------------------------------
  WiFiManager wm;

  // Create the custom parameters
  // Syntax: ID, Label (Placeholder), Default Value, Length
  WiFiManagerParameter custom_tb_server("server", "Thingsboard Server URL", tb_server, 60);
  WiFiManagerParameter custom_tb_token("token", "Device Access Token", tb_token, 40);

  // Add parameters to the portal
  wm.addParameter(&custom_tb_server);
  wm.addParameter(&custom_tb_token);

  // --- START: Captive Portal Reliability Settings ---
  
  // 1. Force a consistent DNS response to trick the phone into opening the browser
  // The ESP32 will respond to all DNS queries with its own IP (192.168.4.1)
  wm.setAPClientCheck(true); 

  // 2. Set the default portal timeout to give the user plenty of time
  // If no one connects, the portal will time out after 5 minutes (300 seconds)
  wm.setTimeout(300); 

  // --- END: Captive Portal Reliability Settings ---

  // Optional: Reset settings for testing (Uncomment to force portal to appear)
    wm.resetSettings();

  // ---------------------------------------------------------
  // STEP 3: Start Connection / Portal
  // ---------------------------------------------------------
  // This blocks until connected to WiFi
  if (!wm.autoConnect("WURM-Setup")) {
      Serial.println("Failed to connect");
      // ESP.restart();
  }

  // ---------------------------------------------------------
  // STEP 4: Save New Values
  // ---------------------------------------------------------
  // We only reach here if we are connected.
  Serial.println("WiFi Connected! Saving custom parameters...");

  // Read the values the user typed into the portal fields
  strcpy(tb_server, custom_tb_server.getValue());
  strcpy(tb_token, custom_tb_token.getValue());

  // Save them permanently to NVS
  preferences.putString("server", tb_server);
  preferences.putString("token", tb_token);
  
  // Close the preferences to finish the transaction
  preferences.end(); 
  // =======================================================
    // EXECUTE CALIBRATION FOR MOISTURE SENSOR IF NEEDED
    // =======================================================
    if (!calibration_done) {
        // We are connected to WiFi, now start calibration.
        // User must have the dry sensor ready, then plunge into water.
        auto_calibration_sequence();
    } else {
        Serial.println("\n Calibration for Moisture already done.");
    }
  Serial.println("Configuration Saved.");
  Serial.println("Setup done");
  digitalWrite(led, HIGH);   // turn the LED on 

  // Temperature onewire setup
  sensors.begin();	// Start up the library
}

void auto_calibration_sequence() {
    Serial.println("\n--- AUTO CALIBRATION START ---");
    // =======================================================
    // STEP 1: DRY CALIBRATION (Instantaneous Baseline)
    // =======================================================
    // The device must be dry during this phase (while connecting to WiFi)
    for (int i = 0; i < 100; i++) { // average value for more stability
      dry += analogRead(moistureSensorPin); 
      delay(10); // Small delay 
      }
    dry = dry/100;
    preferences.begin("tb-config", false);
    preferences.putInt("dry_val", dry);
    preferences.end();
    
    Serial.print("Baseline DRY Value Recorded: ");
    Serial.println(dry);
    Serial.println("Please place the sensor tip into a glass of water now.");
    
    // =======================================================
    // STEP 2: WAIT FOR WET TRIGGER (Rapid Change Detection)
    // =======================================================
    int previous_reading = dry;
    bool trigger_detected = false;
    
    Serial.println("Waiting for sensor plunge (rapid value change detected via serial monitor)...");

    while (!trigger_detected) {
        int current_reading = analogRead(moistureSensorPin);
        for (int i = 0; i < 100; i++) { // average value for more stability
          current_reading += analogRead(moistureSensorPin); 
        }
        current_reading = current_reading/100;
        
        int change = previous_reading - current_reading; // Moisture decreases analog value

        // Check for a rapid drop (plunge into water)
        if (change > CHANGE_THRESHOLD) {
            trigger_detected = true;
            Serial.println("\n!!! WET TRIGGER DETECTED !!!");
            Serial.print("Change: -"); Serial.println(change);
            Serial.println("Now waiting for reading to stabilize...");
            Serial.println(current_reading);
            Serial.println(change);
        }

        previous_reading = current_reading;
        delay(50); // Small delay to sample the rate of change
    }

    // =======================================================
    // STEP 3: STABILITY CONFIRMATION (Final Wet Value)
    // =======================================================
    int stable_counter = 0;

    while (stable_counter < STABILITY_COUNT_MAX) {
        int current_reading = analogRead(moistureSensorPin);
        for (int i = 0; i < 100; i++) { // average value for more stability
          current_reading += analogRead(moistureSensorPin); 
        }
        current_reading = current_reading/100;
        
        // Check if the change is within the tolerance level
        if (abs(current_reading - previous_reading) <= STABILITY_TOLERANCE) {
            stable_counter++;
        } else {
            // Reset counter if reading jumps significantly
            stable_counter = 0;
        }
        previous_reading = current_reading;

        Serial.println(current_reading);
        Serial.println("stable_ counter"); Serial.println(stable_counter);
        
        delay(50); 
    }

    // Final result
    wet = previous_reading;
    
    // Save the WET value permanently
    preferences.begin("tb-config", false);
    preferences.putInt("wet_val", wet);
    preferences.end();
    
    Serial.println("\nWet Value Stabilized and Recorded.");
    Serial.print("WET Value: ");
    Serial.println(wet);
    Serial.println("--- AUTO CALIBRATION COMPLETE ---");
    calibration_done = true;
}


void loop() {
  // put your main code here, to run repeatedly:
  if (!tb.connected()) {
    // Connect to the ThingsBoard
    Serial.print("Connecting to: ");
    Serial.print(tb_server);
    Serial.print(" with token ");
    Serial.println(tb_token);
    if (!tb.connect(tb_server, tb_token, THINGSBOARD_PORT)) {
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
  }
  else{
    percentageHumidity = -1;
    Serial.println("out of scope");
    Serial.print(moisture_val);
  }
  
  //reading gas
  int analogMQGas = analogRead(gasSensorPin);
  //Serial.print("Gas: ");
  //Serial.println(analogMQGas);

  //Temperature
  sensors.requestTemperatures(); 
  
    //print the temperature in Celsius
  //Serial.println("Temperature: ");
  //Serial.print(sensors.getTempCByIndex(0));
  //Serial.println("℃");

  // light sensor for opening the lid
  int lightValue = analogRead(A2); // Read the analog value from the light sensor
  // Calculate the absolute difference from the last recorded value
  int light_difference = abs(lightValue - last_light_value);
  // Initial run: If the last value is 0 (or a default), just record the current value
    if (last_light_value == 0) {
        last_light_value = lightValue;
        Serial.println("Initial light sensor reading recorded.");
        return; // Exit function for the first run
    }
  // Check if the change exceeds the defined threshold
    if (light_difference >= LIGHT_CHANGE_THRESHOLD) {
        Serial.println("!!! LID OPENING DETECTED !!!");
        tb.sendTelemetryData("Deckel_offen", "TRUE");
        // Update the baseline *after* the event is triggered.
        // This prevents multiple triggers during the same brief opening.
        last_light_value = lightValue; 

    } else {
        // No significant change, but we will slowly update the baseline
        // to adapt to gradual changes (e.g., battery drain affecting analog reference).
        // This is a simple form of debouncing/moving average.
        last_light_value = (last_light_value * 0.9) + (lightValue* 0.1); 
    }

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
