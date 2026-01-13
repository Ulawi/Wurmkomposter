To make it super easy for non-maker people to use the sensor kit, we have implemented a web based intall process for the firmware, thanks to [ESP home] (https://github.com/esphome/esp-web-tools).
It is part of the setup chain that uses wurm.ulawi.org as a means to document what was fed to the worms. 

As preperation to use the .ino script in ESP home, we need to create a single binary using esptool. First, when using arduino IDE, select Sketch -> Export compiled binary (Alt+Strg+S)
Then install esptool and merge the files into one with the following command:
~~~
esptool --chip ESP32-C3 merge-bin -o firmware-merged.bin --flash-mode dio --flash-freq 40m --flash-size 4MB 0x1000 wurmchat_with_ulawiTB_provision.ino.bootloader.bin  0x8000 wurmchat_with_ulawiTB_provision.ino.partitions.bin 0x10000 wurmchat_with_ulawiTB_provision.ino.bin
~~~

The merged file is the one you need to include in the manifest for ESP web tools. 
