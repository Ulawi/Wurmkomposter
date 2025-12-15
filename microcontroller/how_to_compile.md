### Vorbereitung der Arduino IDE

Wenn du Änderungan am Code für den XIAO machen möchtest, solltst du deine Arduino IDE so eingerichten, dass sie die Bibliotheken unterstützt die wir verwendet haben. Obwohl der XIAO auch Python unterstützt, haben wir uns für Arduino entschieden, weil es hier eine offizielle Thingsboard Bibliothek gibt.
1. Arduino IDE installieren: Lade die neueste Version von der offiziellen [Arduino-Webseite](https://www.arduino.cc/en/software/) herunter und installiere sie. Die Software ist für Windows, Linux und Mac OS erhältlich. 
2. Optional: Falls du noch nie mit dem XIAO gearbeitet hat und dich ein bisschen damit vertraut machen möchtest, können wir dir das “getting Started” von Seeed Studio empfehlen: [Getting Started with Seeed Studio XIAO ESP32C3 | Seeed Studio Wiki](https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/)
3. Board-Manager einrichten:
   Gehe zu Datei > Einstellungen und füge die URL für die Seeed Studio Boards Manager hinzu:
   
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

   <img width="80%"  alt="Screenshot-Einstellungen" src="https://github.com/user-attachments/assets/ef79edda-a411-410f-bff8-cede949e103b" />


   Gehe zu Werkzeuge > Board > Board-Verwaltung und suche nach "esp32" und installiere esp32 von Espressive Systems in der aktuellen Version.

   <img  width="60%" alt="screenshot GUI Boardverwaltung" src="https://github.com/user-attachments/assets/5b4ddc10-5ecc-4fc9-8dbf-d0e6d5a9f389" />



4. Benötigte Bibliotheken installieren:
- Gehe zu Sketch > Bibliothek einbinden > Bibliotheken verwalten...
- Suche und installiere die Bibliotheken für:
  - das Capitve Portal (WLAN-Zugang einrichten):
    -  WiFiManager.h ( von tzpu)
  - den Temperatursensor: 
    - OneWire (von Tims Studt u.a.) 
    - DallasTemperature(von Miles Burton)
  - Die Verbindung zum Thingsboard:
    - ArduinoMqttClient (von Arduino)
    - ArduinoJson (von Benoit Blanchon)
    - ArduinoHttpClient (von Arduino)
    - PubSubClient (von Nick O’Leary)
    - TBPubSupClient (von Thingsboard)
    - Thingsboard (von Thingsboard Team)
   
5. Hochladen auf den XIAO:
   - Verbinde jetzt den XIAO mit deinem Computer über das USB-C-Kabel.
   - Wähle in der Arduino IDE unter Werkzeuge > Board dein "XIAO_ESP32C3" Board aus.
   - Wähle unter Werkzeuge > Port den korrekten COM-Port deines XIAO aus.
   - Klicke auf den Hochladen-Button (Pfeil nach rechts).

6. FAQ Troubleshoot
   - A serial exception error occurred:
     - Du hast kompiliert und das Sketch hochgeladen. Dann taucht die Fehlermeldung auf:
        ...
        Writing at 0x00112868... (97 %)
        Writing at 0x00118b02... (100 %)
        Wrote 1096624 bytes (662770 compressed) at 0x00010000 in 10.4 seconds (effective 844.3 kbit/s)...
        Hash of data verified.
        
        Leaving...
        Hard resetting with RTC WDT...
        
        A serial exception error occurred: Cannot configure port, something went wrong. Original message: OSError(22, 'Ein nicht vorhandenes Ger�t wurde angegeben.', None, 433)
        Note: This error originates from pySerial. It is likely not a problem with esptool, but with the hardware connection or drivers.
        For troubleshooting steps visit: https://docs.espressif.com/projects/esptool/en/latest/troubleshooting.html
        Fehlgeschlagenes Hochladen: Hochladefehler: exit status 1
      - Vielleicht ist trotzdem alles gut! Wir bekommen diese Fehlermeldung und trotzdem läuft der Code auf dem XIAO normal. Öffne den Seriellen Monitor und schaue dir die Augabe da an. Oft ist alles gut und du sieht die Ausgaben aus loop()
    

       
