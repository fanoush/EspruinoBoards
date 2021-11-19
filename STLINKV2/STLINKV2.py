#!/bin/false
# This file is part of Espruino, a JavaScript interpreter for Microcontrollers
#
# Copyright (C) 2013 Gordon Williams <gw@pur3.co.uk>
# Copyright (C) 2015 Anton Eltchaninov <anton.eltchaninov@gmail.com>
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
import json;
info = {
 'name' : "STLink V2 clone",
# 'link' :  [ "" ],
 'variables' : 1020,
# 'bootloader' : 1,
# 'serial_bootloader' : True,
 'binary_name' : 'espruino_%v_stlink_v2.bin',
 'default_console' : "EV_USBSERIAL",
# 'default_console' : "EV_SERIAL1",
# 'default_console_tx' : "B6",
# 'default_console_rx' : "B7",
 'default_console_baudrate' : "115200",
  'build' : {
   'optimizeflags' : '-Os',
   'libraries' : [
#     'FILESYSTEM'
   ],
   'makefile' : [
     'SAVE_ON_FLASH=1',
     'DEFINES+=-DSAVE_ON_FLASH_EXTREME',
     'DEFINES+=-DJSVAR_FORCE_NO_INLINE=1',
     'DEFINES+=-DUSE_TAB_COMPLETE -DNO_DUMP_HARDWARE_INITIALISATION -DSWD_ONLY_NO_JTAG', # 
     'DEFINES+=-DSAVE_ON_FLASH_WAVEFORM -DSAVE_ON_FLASH_SAVE -DSAVE_ON_FLASH_FFT -DSAVE_ON_FLASH_SWSERIAL -DSAVE_ON_FLASH_DUMP -DSAVE_ON_FLASH_TEMPERATURE',
     'STLIB=STM32F10X_MD',
     'PRECOMPILED_OBJS+=$(ROOT)/targetlibs/stm32f1/lib/startup_stm32f10x_md.o'
   ]
 }
};
saved_code_pages = 11;
chip = {
  'part' : "STM32F103CB", #T6
  'family' : "STM32F1",
  'package' : "LQFP48",
  'ram' : 20,
  'flash' : 128,
  'speed' : 72,
  'usart' : 1, #3,
  'spi' : 0, #2,
  'i2c' : 0, #2,
  'adc' : 3, #3
  'dac' : 0,
  'saved_code' : {
    'address' : 0x08000000 + ((128-saved_code_pages)*1024),
    'page_size' : 1024, # size of pages
    'pages' : saved_code_pages, # number of pages we're using
    'flash_available' : 128-saved_code_pages # 4 used for code
  },
};

devices = {
#  'OSC' : { 'pin_1' :  'D0',
#            'pin_2' : 'D1' },
#  'LED1' : { 'pin' : 'A9' },
  'USB' : {
            'pin_dm' : 'A11',
            'pin_dp' : 'A12'
          },
};
# stlinkv2 clone pins
# RST - B5 220R,B6
# SWIM B7,B9 220R, B8
# B6,B7 = TX1,RX1, SCL1,SDA1, T4C1,T4C2
# SWDIO B12 100R, B14
# SWDCLK B13, A5
# enable SWD
#poke32(0x40010000+4,0x2 << 24)
#disable SWD, free PA13,14
#poke32(0x40010000+4,0x4 << 24)

# left-right, or top-bottom order
board = {
  'top' : [ 'AV+', 'AV-', 'VBAT', 'D14', 'D13', 'D12', 'RST', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'D2', 'D1', 'D0', 'VIN' ],
  'bottom' : [ 'VCC', 'GND', 'BUT', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21', 'D22', 'D23', 'D24', 'D25', 'D26', 'D27', 'D28', 'D29', 'D30', 'D31'],
  '_pinmap' : { 'A0':'D11', 'A1':'D10', 'A2':'D9', 'A3':'D8', 'A4':'D7', 'A5':'D6', 'A6':'D5', 'A7':'D4', 'A8':'D3'}
};

def get_pins():
  pins = pinutils.scan_pin_file([], 'stm32f103xb.csv', 6, 10, 11)
  return pinutils.only_from_package(pinutils.fill_gaps_in_pin_list(pins), chip["package"])
