# Bauanleitung Wurmkomposter 5.0

## Einleitung: Das Projekt verstehen
Willkommen zu dieser Bauanleitung für deinen eigenen Wurmkomposter 5.0! Dieses Projekt ermöglicht es dir, die wichtigsten Umweltparameter in deinem Komposter in Echtzeit zu überwachen. Nie wieder Rätselraten, ob deine Würmer glücklich sind – dank eines Seeed Studio XIAO Mikrocontrollers und der Thingsboard IoT-Plattform hast du alle Daten immer im Blick und dank des Chat-Interface musst du dir auch keine Daten-Diagramme anschauen, sondern kannst in natürlicher Sprache etwas über den Zustand des Komposters erfahren.
Warum ein IoT-Wurmkomposter?
Ein gesunder Wurmkomposter ist der Schlüssel zu hochwertigem Humus. Dieses System hilft dir dabei, optimale Bedingungen zu gewährleisten, indem es Daten zu Temperatur, Feuchtigkeit und anderen relevanten Parametern sammelt. Du lernst dabei nicht nur etwas über das Wurmkompostieren, sondern auch über IoT, Mikrocontroller und Datenaufbereitung.
## Funktionen des Systems:
- Echtzeit-Überwachung: Verfolge Temperatur und Feuchtigkeit kontinuierlich.
- Datenvisualisierung: Anschauliche Dashboards auf Thingsboard.
- Chat Interface: Interaktion mit den Würmern über natürliche Sprache.
- Erweiterbar: Flexibles Design für zusätzliche Sensoren oder Funktionen.

### Das System besteht aus 3 Bausteinen: 
1. dem IoT-Baustein, bestehend aus einem Mikrocontroller (= Minicomputer) und Sensoren.
2. dem Datenspeicher-Baustein, wo die Messwerte von den Sensoren gespeichert und ausgewertet werden.
3. der App für dein Smartphone, in der du mit den Würmern chatten kannst.  

Lass uns mit Baustein 1, der Hardware anfangen. Alle Komponenten sind “von der Stange”, du findest sie im Sortiment von großen Online-Händlern (wie Digikey) und direkt in den Hersteller-Shops  (wie Olimex).  

## Benötigte Komponenten
Hier ist eine Liste aller Teile, die du für dieses Projekt benötigst. Wir haben darauf geachtet, open hardware zu verwenden. Die Herstellerangaben sind nur als eine Option zu verstehen, an die Bauteile zu kommen. Wir bekommen keine Provision. 
- 1x Seeed Studio XIAO ESP32C3
- 1x Seeed Studio Grove Base für XIAO
- 1 x Bodenfeuchesensor (kapazitiv)
- 1x Temperatursensor DS18B20
- 1x Gas-Sensor MQ-2
- 1x Lichtsensor
- 1x USB-C Kabel zum Anschluss des XIAO an den PC während des Aufbaus
- 1x USB-C Ladegerät für die Stromversorgung
- 4x kleine Schrauben (M3x10mm), um den Gassensor und das Gehäuse am Wurmkomposter zu befestigen
- Wurmkomposter
- Gehäuse
  
### Die Komponenten im Detail 

- 1x Seeed Studio XIAO ESP32C3
  
  <img src="https://github.com/user-attachments/assets/c56cb338-797b-48e4-b646-12bdf7d30d1e" alt="Foto of Seeed Studio XIAO ESP32C3" width="50%" />
  <img src="https://github.com/user-attachments/assets/16c50abf-7356-422b-a9e0-1bf123c6174d" alt="pin layout" width="70%" />
  
  Die Boards sind mit einem [ESP32-C3 Chip](https://files.seeedstudio.com/wiki/Seeed-Studio-XIAO-ESP32/esp32-c3_datasheet.pdf) ausgestattet, der auf einem 32-Bit RISC-V Prozessor basiert. Sie haben WLAN und Bluetooth, unterstützen Arduino / CircuitPython und verbrauchen im Tiefschlafmodus nur 44 µA. ( [Link zum PCB](https://files.seeedstudio.com/wiki/XIAO_WiFi/Resources/XIAO-ESP32C3-v1.2_SCH-PCB.zip) )
  
- 1x Seeed Studio Grove Base für XIAO
  
  <img width="50%" alt="Foto Grove Base" src="https://github.com/user-attachments/assets/65fe6474-1f00-48ea-b992-ef5c78785f48" />
  
  Unser Kompromiss zwischen einfachem  Aufbau, Aufwand, Kosten und robusten Verbindungen. Hier gibt es acht Steckplätze für Sensoren mit einem Grove Stecker ( [Datenblatt](https://statics3.seeedstudio.com/images/opl/datasheet/3470130P1.pdf) ), kompatibel zu JST-HY2.0mm). Damit ist unser System viel robuster als ein Breadboard-Aufbau und nicht so flexibel wie eine selbst gelötete Platine mit einem anderen Steckersystem.   
- 1 x Bodenfeuchesensor (kapazitiv)
  
  <img width="50%" alt="Foto Bodenfeuchtesensor" src="https://github.com/user-attachments/assets/9498ae52-0408-41ab-a45b-44d082f9db01" />
  
  Dieser Sensor misst die Bodenfeuchte kapazitiv, was ihn robust gegenüber Korrosion (Rost) macht. Falls es keinen mit Grove-Kabel als Set gibt, das Kabel (Grove 4-Pin oder JST-HY2.0mm 4-pin) nicht vergesse!
  
- 1x Temperatursensor DS18B20

 <img width="50%"  alt="Foto Temoeratursensor" src="https://github.com/user-attachments/assets/69b8e366-71f9-4cbe-9c27-a8e7918fc6a2" />
 
 Robuster one wire Temperatursensor, wie er in vielen DIY Projekten verwendet wird. 
 
 Nur falls du einen <u>ohne</u> Grove-Stecker kaufst, brauchst du zusätzlich: einen <b>4.7kꭥ Widerstand</b> und ein Anschlusskabel (10 cm, Grove 4-Pin oder JST-HY2.0mm 4-pin) und eine kleine <b>Lochstreifen-Platine</b>.
 
 <img width="30%" alt="Foto Anschlusskabel" src="https://github.com/user-attachments/assets/b578cede-48ff-41d4-8109-aa6b4342394c" /><img width="30%"  alt="Foto Widerstand mit Streifen gold-rot-lila-gelb" src="https://github.com/user-attachments/assets/373a6041-dcc4-46a1-9748-608987cd6528" /><img width="30%" alt="Foto Lochrasterplatine" src="https://github.com/user-attachments/assets/9dd943fe-382c-4671-838c-a3e794ddf749" />
 
- 1x Gas-Sensor MQ-2

  <img width="50%" alt="Foto-Gassensor" src="https://github.com/user-attachments/assets/78fb2299-6483-4490-916f-63f537f37850" />
  
  Mit diesem Sensor können verschiedene Gase gemessen werden, u.a. Methan ( [Datenblatt](https://www.olimex.com/Products/Components/Sensors/Gas/SNS-MQ2/resources/MQ2.pdf) ).
  
- 1x Lichtsensor https://wiki.seeedstudio.com/Grove-Light_Sensor/#upgradable-to-industrial-sensors
- 1x USB-C Kabel zum Anschluss des XIAO an den PC während des Aufbaus
- 1x USB-C Ladegerät für die Stromversorgung
- Ein Gehäuse, das den XIAO vor Schmutz und Feuchtigkeit schützt. Falls du den Wurmkomposter nur in Innenräumen benutzt, kannst du als Gehäuse auch etwas verwenden oder upcyclen, was du zur Hand hast. Wir haben hier eine Installationsdose verwendet.
  
  <img width="48%" alt="Foto-Installationsdose-geschlossen" src="https://github.com/user-attachments/assets/e9d28c2a-6c8c-4baa-b7d2-391c924e9a9a" /><img width="48%" alt="Foto Installationsdose-geöffnet-mit-Elektronik-im-Inneren" src="https://github.com/user-attachments/assets/aed33c24-3259-4a87-b5e2-ee0a7a36fe42" />

  Falls du das System auch draußen, z.B.  auf dem Balkon nutzen willst, empfehlen wir etwas Wasserdichtes, wie z.B. eine Abzweigdose mit IP68
  
  <img width="50%"  alt="Foto-Abzweigdose" src="https://github.com/user-attachments/assets/17f524de-fe46-41a9-bffb-e8e224b141d8" />
- 4x kleine Schrauben (M3x10mm), um den Gassensor und das Gehäuse am Wurmkomposter zu befestigen   
- Wurmkomposter
  
  <img width="75%" alt="Foto-Wurmkomposterbox" src="https://github.com/user-attachments/assets/40698c1e-6e16-490c-9da5-63b7c5a5fdd3" />
  
  Wurmkomposter gibt es in verschiedensten Ausführungen. Du kannst mit dieser Anleitung auch deinen Wurmkomposter nachrüsten, falls du schon einen hast. Wir haben u.a. diesen hier im Einsatz, der aus einer 11,2l Eurobox, zwei Holzboxen und einem Deckel zusammengebaut ist. 
### Benötigtes Werkzeug
- Lötkolben und Lötzinn, falls du Sensoren ohne Grove-Stecker gekauft hast
- Kleiner Schraubendreher
- Computer mit Internetzugang

## Aufbauanleitung: Schritt für Schritt
<div align="center">
   <img width="90%" " alt="Pin-Out-Diagramm-Xiao-auf-Grove-Base" src="https://github.com/user-attachments/assets/9adc95c6-b053-4146-aae4-191f30e011ca" />
  
  Pin-Out Diagramm Xiao auf Grove-Base
</div>

Die Grove-Base hat 8 Steckplätze. In den nächsten Schritten werden wir immer wieder auf die Nummer der Steckplatzes eingehen, auf dem der Sensor angeschlossen werden soll. Im Bild oben ist eingezeichnet, wo welcher Steckplatz ist. Achte bitte darauf die Sensoren genau so zu stecken, wie hier beschrieben...oder du änderst später nochmal den Code für den XIAO...Hauptsache, Sensorsteckplatz und Code passen zusammen.      

### Schritt 1: Anschluss der Sensoren

Dieser Schritt erklärt, wie die Sensoren mit dem XIAO verbunden werden. Da wir die Grove-Base verwenden, ist dieser Schritt recht einfach. 

1. Die WLAN- Antenne an den Xiao schrauben:
   
   <img width="549" height="227" alt="image" src="https://github.com/user-attachments/assets/f64be7ef-2ff2-40fc-a936-27b2022a1274" />

   Der XIAO EPS32-C3 wird mit einer Antenne ausgeliefert, die den Wlan-Empfang verbessert. Da wir die Sensordaten über Wlan an den Datenspeicher-Baustein schicken wollen, schrauben wir diese Antenne an. Hier ist Fingerfertigkeit gefragt, Stecker und Buchse sind ganz schön klein.

   https://github.com/user-attachments/assets/e37c7382-4a54-47b7-97a3-c36010150af5



3. Xiao auf die Base stecken:
   
   Stecke den XAIO so auf die Base, dass der USB-Anschluss nach außen zeigt, wie auch oben im Pin-Out Diagramm zu sehen.
   
   

  https://github.com/user-attachments/assets/5705ae1e-f625-4277-b91f-1344c1377df1


5. Bodenfeuchtesensorsensor anschließen:

   Steckt den Bodenfeuchtesensor auf den Steckplatz A0 (siehe Diagramm oben)

   <img width="75%" alt="Bodenfeuchtesensor-angeschlossan-an-Grovebase" src="https://github.com/user-attachments/assets/bfdd70e9-4260-42ef-982a-158dd37adba7" />


6. Gassensor anschließen:

   Der Gassensor wird auf Steckplatz A1 angeschlossen. 

   <img width="75%" alt="Gassensor-angeschlossen-an-Grovebase" src="https://github.com/user-attachments/assets/c4998d43-1ba1-42c9-b5ab-45a42366c0da" />

7. Temperatursensor anschließen:

   Der Temperatursensor wird über I2C ausgelesen, und in die entsprechende Buchse gesteckt. Im Pin-Out-Diagramm ist sie mit A5 D5 I2C beschriftet.

   <img width="75%"  alt="Temperatursensor-angeschlossen-an-Grovebase" src="https://github.com/user-attachments/assets/1cdfe8a8-192d-48e8-988c-19bfb8c36ec4" />


   Falls ihr, so wie wir, kein vorkonfektioniertes Kabel mit Grove-Stecker eingekauft habt, könnt ihr euch eine kleine Platine mit Pullup und Stecker löten. Der Pullup-Widerstand mit dem Wert 4.7kꭥ (Farbcode ist gold rot lila geb) sitzt zwischen der Datenleitung (gelb) und  Stromversorgung 3V3 (rot). Wir haben auf unserer Platine ein bisschen Abstand zwischen den    Lötstellen gelassen, um einem Kurzschluss durch Lötfehler vorzubeugen. Selbstverständlich könntet ihr hier mit einer noch kleineren Platine arbeiten.

   <img width="75%" alt="Foto-kleine-Platine-mit-Pullup-und-Stecker-und-Temperatursensor" src="https://github.com/user-attachments/assets/2c783010-84c8-404b-814f-f5834eff4257" />

   <img width="50%" alt="Schema-der-Platine" src="https://github.com/user-attachments/assets/260c17b0-87c7-43f2-8b7f-c725fa767a75" />

8. Lichtsensor anschließen:
   
   Der Lichtsensor nimmt über die Veränderung der Helligkeit war, wenn der Deckel geöffnet wird.  Es ist ein analoger Sensor. Schließt ihn auf auf Steckplatz A2 an.
   
   <img width="75%"  alt="Lichtsensor-angeschlossen-an-Grovebase" src="https://github.com/user-attachments/assets/d9982e83-ddc4-492f-b933-b8d4a0960c24" />





Super, nun ist die Hardware zusammengebaut. Jetzt müsst ihr die Sprfware auf den Microcontroller spielen. 

### Schritt 2: Vorbereitung der Software (Arduino IDE)

Bevor du den Code auf den XIAO hochladen kannst, muss deine Arduino IDE richtig eingerichtet werden. Obwohl der XIAO auch Python unterstützt, haben wir uns für Arduino entschieden, weil es hier eine offizielle Thingsboard Bibliothek gibt.
1. Arduino IDE installieren: Lade die neueste Version von der offiziellen [Arduino-Webseite](https://www.arduino.cc/en/software/) herunter und installiere sie. Die Software ist für Windows, Linux und Mac OS erhältlich. 
2. Optional: Falls du noch nie mit dem XIAO gearbeitet hat und dich ein bisschen damit vertraut machen möchtest, können wir dir das “getting Startet” von Seeed Studio empfehlen: [Getting Started with Seeed Studio XIAO ESP32C3 | Seeed Studio Wiki](https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/)
3. Board-Manager einrichten:
   Gehe zu Datei > Einstellungen und füge die URL für die Seeed Studio Boards Manager hinzu:
   
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

   <img width="80%"  alt="Screenshot-Einstellungen" src="https://github.com/user-attachments/assets/ef79edda-a411-410f-bff8-cede949e103b" />


   Gehe zu Werkzeuge > Board > Board-Verwaltung und suche nach "esp32" und installiere esp32 von Espressive Systems in der aktuellen Version.

   <img  width="60%" alt="screenshot GUI Boardverwaltung" src="https://github.com/user-attachments/assets/5b4ddc10-5ecc-4fc9-8dbf-d0e6d5a9f389" />



4. Benötigte Bibliotheken installieren:
- Gehe zu Sketch > Bibliothek einbinden > Bibliotheken verwalten...
- Suche und installiere die Bibliotheken für:
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

### Schritt 3: Thingsboard Einrichtung

Thingsboard ist unsere Datenverwaltungsplattform. Hier registrieren wir unser Gerät und erstellen Dashboards.
Die Thingsboard Community Edition ist open source software und du kannst sie auf deinem lokalen Gerät installieren, einem PC oder einem Raspberry Pi, zum Beispiel. 
Außerdem gibt es die Möglichkeit, die Thingsboard in der Cloud zu benutzen. Wir sind dabei, eine Ulawi-Thingsboard-Cloud aufzusetzen, auf der alle Wurmkomposter ihre Daten teilen und im Sinne einer Kreislaufwirtschaft den Wurmhumus umverteilen können.
Aktuell musst du noch dein eignes Thingsboard konfigurieren. Entwerden in einer lokalen Installation, oder über eine Cloud Subscription z.B. bei thingsboard.cloud.

Je nachdem, wofür du dich entscheidest, folge der Anleitung auf

[ThingsBoard installation options | ThingsBoard Community Edition](https://thingsboard.io/docs/user-guide/install/installation-options/)

Wir haben eine Docker+Windows Installation lokal getestet. 

Für den Rest dieser Anleitung gehen wir davon aus, dass du dir einen Thingsboard Server eingerichtet hast und dessen URL kennst. 

1. Neues Gerät hinzufügen:
  - Melde dich bei Thingsboard an.
  - Gehe zu Devices und klicke auf das +-Symbol, um ein neues Gerät hinzuzufügen.
  - Gib einen Namen (z.B. "Wurmkomposter IoT") und als Typ "Wurmkomposter" ein. Klicke auf “Next: Credentials”
    
  <img width="80%"  alt="deviceCredentials" src="https://github.com/user-attachments/assets/07db1d91-cc10-403f-b4ce-dbc254d372bb" />


  - Wähle den <b>Access Token</b> als Anmeldetyp. <b>Kopiere den generierten Access Token</b> – den brauchst du später im Arduino-Code.
  - Kopiere die Device ID. Die brauchst du, um das Dashboard einzurichten.

  <img width="80%" alt="image" src="https://github.com/user-attachments/assets/3d98edce-5731-4bff-a228-bd7ce4c8a2c9" />

2. Regelketten anpassen:
   - Lade dir diese Regelkette (rule chain) herunter und importiere sie in dein Thingsboard:
     [Url](https://github.com/Ulawi/Wurmkomposter/blob/main/thingsboard/worms_root_rule_chain.json)
     Mache sie zur neuen root rule chain, in dem du in der Liste auf das kleine Fähnchen klickst.

     <img width="80%"  alt="Thingsboard UI rule chain Liste" src="https://github.com/user-attachments/assets/dc506d92-cc4e-4d7c-a904-d3b8660b736d" />
  
  - Lade auch noch die Regelketten für die Verarbeitung der Daten herunter und importiere sie in dein Thingsboard:
  - [Evaluate worm condition](https://github.com/Ulawi/Wurmkomposter/blob/main/thingsboard/evaluate_worm_condition.json)
  - [c/n from feeding](https://github.com/Ulawi/Wurmkomposter/blob/main/thingsboard/15m_cn_from_feeding_aggregator.json)
  - Nach dem Import musst du sie mit der root Kette verknüpfen. Dafür klickst du in der root Regelkette auf den jeweiligen lila Block "rule chain Evaluate worm condition" sowie "Calculate c/n" und editierst ihn (durch klick auf das kleine rote Stiftsymbol). Wähle aus der Dropdownliste für die Regelkette (rule chain) die      passenden Ketten aus "Evaluate wurm condition" und "15m cn from feeding". 

  
4. Dashboard erstellen:
   - Lade dir unser Dashboard aus diesem Repo herunter:
   [Url]([https://github.com/Ulawi/Wurmkomposter/blob/main/evaluate_worm_condition.json])
   - Öffne die json Datei und ändere sie so ab, dass sie für dein neu erstelltes Device funktioniert:
     - Suche nach ““deviceID”: “hier-deine-device-id” und füge jeweils deine DeviceID ein (die sieht in etwa so aus:   abc1de23-11ab-11a0-ac90-a33a0132a123)
     - Gehe zu Dashboards und erstelle ein neues Dashboard, indem du auf + klickst, dann “Import dashboard” auswählst und die json-Datei auswählst, die du gerade geändert hast. 

### Schritt 4: Arduino Code hochladen

Nun brauchen wir noch den Code, der die Sensordaten ausliest und an Thingsboard sendet.

1. Code von GitHub herunterladen:
   - Lade den [Source Code](https://github.com/Ulawi/Wurmkomposter/blob/main/microcontroller/wurmchat_for_public.ino) aus diesem Repo herunter.
2. Anpassen des Codes:
   - Öffne die .ino-Datei in der Arduino IDE.
   - Passe die <b>WLAN-Zugangsdaten</b> (SSID, PASSWORD), den THINGSBOARD_SERVER und den <b>Thingsboard Access Token</b> an deine Werte an. Diese findest du ganz oben im Code.
   - 
     <img width="80%" alt="screenshot arduino code" src="https://github.com/user-attachments/assets/44228db4-be37-4ab4-82b4-fa269c2ba2de" />

3. Hochladen auf den XIAO:
   - Verbinde jetzt den XIAO mit deinem Computer über das USB-C-Kabel.
   - Wähle in der Arduino IDE unter Werkzeuge > Board dein "XIAO_ESP32C3" Board aus.
   - Wähle unter Werkzeuge > Port den korrekten COM-Port deines XIAO aus.
   - Klicke auf den Hochladen-Button (Pfeil nach rechts).
   
### Schritt 5: Einsatz im Wurmkomposter

Sobald der Code hochgeladen ist, kannst du dein System im Komposter platzieren.
1. Platzierung der Sensoren:
   - Stecke den Bodenfeuchtigkeitssensor vorsichtig in die Komposterde. Achte darauf, dass der Sensor nicht zu tief sitzt und die Elektronik trocken bleibt und gleichzeitig die gesamte Sensorfläche unterhalb der weißen Linie in der Erde steckt.
   - platziere den Temperatursensor so, dass auch er direkt in Kontakt mit dem Kompost-Material kommt.
   - Schraube den Gassensor oben an die Innenwand der Wurmkomposters.

2. Schutz des Gehäuses:
   - Platziere den XIAO in deinem vorbereiteten Gehäuse und schließe ihn per USB an die Steckdose an.
   - Falls du eine Installationsdose verwendest wie wir, kannst du diese am Wurmkomposter festschrauben. Wir tüfteln gerade noch an guten Positionen und Befestigungsvarianten für die Elektronik, die auch beim Durchtauschen der Komposter-etagen wenig Umbauaufwand macht.  

### Schritt 6: Kalibrierung und Überprüfung

Nach dem Aufbau solltest du die Sensoren kalibrieren und die Daten auf Thingsboard überprüfen.
1. Erste Daten auf Thingsboard prüfen:
   - Öffne dein Thingsboard-Dashboard und überprüfe, ob die Daten von Temperatur und Feuchtigkeit ankommen. Es kann einige Minuten dauern, bis die ersten Werte angezeigt werden.
2. Bodenfeuchtigkeitssensor kalibrieren:
   - Vergleiche die gelesenen Feuchtigkeitswerte mit der tatsächlichen Feuchtigkeit der Erde. Ggf. musst du die Schwellenwerte im Code anpassen, um genaue "feucht" oder "trocken" Angaben zu erhalten. TODO: hierfür werden iwr ein Script zur Verfügung stellen.
   
## Weitere Verbesserungen und Modifikationen

- Zusätzliche Sensoren: Integriere pH-Sensoren, Lichtsensoren oder eine Waage für die Futtermengenmessung.
- Benachrichtigungen: Richte Alarme in Thingsboard ein, um per E-Mail oder Push-Nachricht benachrichtigt zu werden, wenn Werte kritische Schwellen erreichen

## Fazit
Herzlichen Glückwunsch! Du hast erfolgreich deinen eigenen IoT-Wurmkomposter gebaut. Dieses Projekt ist nicht nur nützlich für die Pflege deiner Würmer, sondern auch eine großartige Lernerfahrung im Bereich IoT und Elektronik. Experimentiere weiter und erweitere dein System!

## Credits und Source Code

Dieses Projekt wurde ermöglicht durch die KI Ideenwerkstatt Umweltschutz. 


Viel Spaß beim Kompostieren!

## FAQ
1. Wieso liefert ihr keine kompletten Systeme aus? Wieso muss ich alles selbst zusammen bauen?

   Wir sind ein gemmeinnütziges Projekt. Leider haben wir aktuell nicht die Kapazitäten, einen echten Shop zu betreiben.


