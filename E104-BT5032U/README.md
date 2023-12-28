# EBYTE E104-BT5032U

This is nRF52832 based USB dongle with CH9102 USB to serial chip connected to same RX,TX,RTS,CTS pins as nordic nrf52DK PCA10040 board.
It also has optional 32kHz crystal and DC/DC circuity like PCA10040.
All this means that it is compatible with prebuilt nRF BLE sniffer and nRF Connectivity firmware hex files published by Nordic.

The PCB is simple - just RST + USER button (D21,D11), POWER + USER LED (D13) and SWD pinout - from USB to antenna GND,RST,SWDIO,SWCLK,3.3V.

BY default RST pin functionality is disabled in Espruino build and reset button is mapped to BTN2 however you can update UICR to enable reset functionality.
```
setTimeout(function() { NRF.restart(function(){
poke32(0x4001e504,1);while(!peek32(0x4001e400)); // enable flash writing
poke32(0x10001200,21);while(!peek32(0x4001e400)); // enable reset pin 21
poke32(0x10001204,21);while(!peek32(0x4001e400)); // confirm reset pin 21
poke32(0x4001e504, 0);while(!peek32(0x4001e400)); // disable flash writing
}) }, 2000);NRF.disconnect();
```
