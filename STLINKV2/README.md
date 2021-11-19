### Espruino build for cheap chinese STLINK V2 clone dongles

Typically they are based on STM32F103 (or clone) chips with 20KB RAM and 128KB flash

Without modification there are 4 GPIOs available marked SWIM,RST,SWIO,SWCLK and there are also SWD pins on test points so easy to reprogram or use as two more GPIOs.

#### Pinout
| Pin   | Description | Comments|
| ------------- | ------------- |----|
| B6 | RST  | UART1 TX, SCL1, also tied to B5 |
| B7 | SWIM | UART1 RX, SDA1, also  tied to B8,B9|
| B13 |SWCLK| also tied to A5|
| B14 |SWDIO| also tied to B12|
| A9 | 1 or 2 LED(s) | if two then writing 1 or 0 lights up LEDs and for turning off let it float or set as input |
| A13 |STM32 SWDIO on PCB| for reflashing via openocd, at runtime can be reconfigured as generic GPIO via `poke32(0x40010000+4,0x4<<24)`|
| A14 |STM32 SWDCLK on PCB| |

#### Installation

With two devices one can be used to reprogram the other via SWD. Often the chip model has only 64KB ram officially while 128KB works so flash size needs to be overrriden.
Also for CKS32 clone chip add `-c 'set CPUTAPID 0x2ba01477'` if it complains about wrong ID.

- Connect `openocd -d2  -f interface/stlink-v2.cfg  -c "set FLASH_SIZE 131072" -f target/stm32f1x.cfg`
- unlock and erase flash `stm32f1x unlock 0`
- program `reset halt; flash write_image erase espruino_2v10.216_stlink_v2.bin 0x08000000`
- now disconnect and reconnect and  open https://www.espruino.com/ide/ -> connect ->'Web Serial'

### Modding

#### UART2
With some soldering two more GPIO (A2,A3) are [easy to add for additional UART](https://github.com/RadioOperator/STM32F103C8T6_CMSIS-DAP_SWO/blob/master/Doc/STLINK_V2A_V2B/Schematic(part)%20STLINK_V2A_V2B.jpg). When seeing the chip with dot in upper left corner and pin header on left and usb on right A2,A3 are two first corner pins in bottom left corner.

#### SWD
Also it is quite easy to cut into black sides so that wires from inside can add row of two pins while metal case is on ![SWD pins mod](stlinkv2-1.jpg)

#### See also
https://hackaday.io/project/162597-st-link-clone-repurposing
https://www.hobbiton.be/blog/repurpose-stlink/stlink2.svg
https://stm32duinoforum.com/forum/images/thumb/a/ae/Bluepillpinout-gif/wiki_subdomain/700px-Bluepillpinout.gif
