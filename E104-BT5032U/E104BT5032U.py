#!/bin/false
# This file is part of Espruino, a JavaScript interpreter for Microcontrollers
#
# Copyright (C) 2013 Gordon Williams <gw@pur3.co.uk>
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# ----------------------------------------------------------------------------------------
# This file contains information for a specific board - the available pins, and where LEDs,
# Buttons, and other in-built peripherals are. It is used to build documentation as well
# as various source and header files for Espruino.
# ----------------------------------------------------------------------------------------

import pinutils;

info = {
 'name' : "E104-BT5032U",
 'boardname' : "E104BT5032U",
 'link' :  [ "https://www.cdebyte.com/products/E104-BT5032U" ],
 'espruino_page_link' : 'nRF52832DK',
 'default_console' : "EV_SERIAL1",
 'default_console_tx' : "D6",
 'default_console_rx' : "D8",
 'default_console_baudrate' : "9600",
 'variables' : 2630, # How many variables are allocated for Espruino to use. RAM will be overflowed if this number is too high and code won't compile.
 'bootloader' : 1,
 'binary_name' : 'espruino_%v_E104BT5032U.hex',
 'build' : {
   'optimizeflags' : '-Os',
   'libraries' : [
     'BLUETOOTH',
#     'NET',
#     'GRAPHICS',
#     'NFC',
     'JIT'
#     'NEOPIXEL'
   ],
   'makefile' : [
#     'DEFINES +=-DCONFIG_GPIO_AS_PINRESET', # Allow the reset pin to work
     'DEFINES += -DCONFIG_NFCT_PINS_AS_GPIOS', # Allow the reset pin to work
     'ESPR_BLUETOOTH_ANCS=1', # Enable ANCS (Apple notifications) support
     'DEFINES += -DESPR_LSE_ENABLE', # Ensure low speed external osc enabled
     'DEFINES += -DESPR_DCDC_ENABLE=1', # Use DC/DC converter
     'DEFINES+=-DESPR_NO_SOFTWARE_SERIAL=1',
     'DEFINES+=-DNO_DUMP_HARDWARE_INITIALISATION',
     'DEFINES+=-DBLUETOOTH_ADVERTISING_INTERVAL=200',
     'DEFINES +=-DBLUETOOTH_NAME_PREFIX=\'"BT5032U"\'',
     'DEFINES += -DNRF_BLE_GATT_MAX_MTU_SIZE=53 -DNRF_BLE_MAX_MTU_SIZE=53', # increase MTU from default of 23
     'DEFINES += -DCENTRAL_LINK_COUNT=2 -DNRF_SDH_BLE_CENTRAL_LINK_COUNT=2', # allow two outgoing connections at once     
     'LDFLAGS += -Xlinker --defsym=LD_APP_RAM_BASE=0x3290', # set RAM base to match MTU=53 + CENTRAL_LINK_COUNT=2             
     'DFU_PRIVATE_KEY=targets/nrf5x_dfu/dfu_private_key.pem',
     'DFU_SETTINGS=--application-version 0xff --hw-version 52 --sd-req 0x8C,0x91',
   ]
 }
};

storage_pages = 26
fds_pages = 2
chip = {
  'part' : "NRF52832",
  'family' : "NRF52",
  'package' : "QFN48",
  'ram' : 64,
  'flash' : 512,
  'speed' : 64,
  'usart' : 1,
  'spi' : 0,
  'i2c' : 0,
  'adc' : 1,
  'dac' : 0,
  'saved_code' : {
    'address' : ((0x78 - fds_pages - storage_pages) * 4096), # Bootloader takes pages 120-127, FS takes 118-119
    'page_size' : 4096,
    'pages' : storage_pages,
    'flash_available' : 512 - ((31 + 8 + fds_pages + storage_pages)*4) # Softdevice uses 31 pages of flash, bootloader 8, FS 2, code 10. Each page is 4 kb.
  },
};

devices = {
  'BTN1' : { 'pin' : 'D11', 'pinstate' : 'IN_PULLDOWN' }, # Pin negated in software
  'LED1' : { 'pin' : 'D13' }, # Pin negated in software
  'RX_PIN_NUMBER' : { 'pin' : 'D8'},
  'TX_PIN_NUMBER' : { 'pin' : 'D6'},
  'CTS_PIN_NUMBER' : { 'pin' : 'D7'},
  'RTS_PIN_NUMBER' : { 'pin' : 'D5'},
  # Pin D22 is used for clock when driving neopixels - as not specifying a pin seems to break things
};

# left-right, or top-bottom order
board = {
  '_notes' : {
    'D6' : "Serial console RX",
    'D8' : "Serial console TX"
  }
};

def get_pins():
  pins = pinutils.generate_pins(0,31) # 32 General Purpose I/O Pins.
  pinutils.findpin(pins, "PD0", True)["functions"]["XL1"]=0;
  pinutils.findpin(pins, "PD1", True)["functions"]["XL2"]=0;
  pinutils.findpin(pins, "PD5", True)["functions"]["RTS"]=0;
  pinutils.findpin(pins, "PD6", True)["functions"]["TXD"]=0;
  pinutils.findpin(pins, "PD7", True)["functions"]["CTS"]=0;
  pinutils.findpin(pins, "PD8", True)["functions"]["RXD"]=0;
  pinutils.findpin(pins, "PD9", True)["functions"]["NFC1"]=0;
  pinutils.findpin(pins, "PD10", True)["functions"]["NFC2"]=0;
  pinutils.findpin(pins, "PD2", True)["functions"]["ADC1_IN0"]=0;
  pinutils.findpin(pins, "PD3", True)["functions"]["ADC1_IN1"]=0;
  pinutils.findpin(pins, "PD4", True)["functions"]["ADC1_IN2"]=0;
  pinutils.findpin(pins, "PD5", True)["functions"]["ADC1_IN3"]=0;
  pinutils.findpin(pins, "PD28", True)["functions"]["ADC1_IN4"]=0;
  pinutils.findpin(pins, "PD29", True)["functions"]["ADC1_IN5"]=0;
  pinutils.findpin(pins, "PD30", True)["functions"]["ADC1_IN6"]=0;
  pinutils.findpin(pins, "PD31", True)["functions"]["ADC1_IN7"]=0;
  # Make buttons and LEDs negated
  pinutils.findpin(pins, "PD11", True)["functions"]["NEGATED"]=0;
  pinutils.findpin(pins, "PD13", True)["functions"]["NEGATED"]=0;

  # everything is non-5v tolerant
  for pin in pins:
    pin["functions"]["3.3"]=0;
  #The boot/reset button will function as a reset button in normal operation. Pin reset on PD21 needs to be enabled on the nRF52832 device for this to work.
  return pins
