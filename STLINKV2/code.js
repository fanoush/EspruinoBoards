// can be uploaded as .boot0
if (!global.LED1) {
  // if no LED1 defined we expect two leds on A9 pin
  var LED1 = {
  off:function(){A9.read();},
  red:function(){A9.reset();},
  blink:function(f){analogWrite(A9,0.5,{freq:f?f:1});},
  blue:function(){A9.set();},
  };
  LED1.reset=LED1.off;
}

if (E.isUSBConnected && (!E.isUSBConnected())){
  if (LED1.blue) LED1.blue(); else analogWrite(LED1,0.5,{freq:5});
  if (global.Serial1) setTimeout(function(){
    // wait 2s and enable uart console if USB is not connected
    if (LED1.red) LED1.red(); else analogWrite(LED1,0.5,{freq:20});
    if (!E.isUSBConnected()){
      Serial1.setup(115200,{rx:B7,tx:B6});
      Serial1.setConsole();
    }
    LED1.reset();
  },2000);
  else LED1.reset();
}

// AFIO_MAPR register Bits 26:24 SWJ_CFG[2:0]
//0: Full SWJ (JTAG-DP + SW-DP): Reset State
//1: Full SWJ (JTAG-DP + SW-DP) but without NJTRST
//2: JTAG-DP Disabled and SW-DP Enabled
//4: JTAG-DP Disabled and SW-DP Disabled = A13,A14 pins free
function swjcfg(v){
  var MAPR=0x40010004;
  var o=peek32(MAPR)&(~(7<<24));
  poke32(MAPR,o);
  poke32(MAPR,o|((v&7)<<24));
}

// B6 RST/TX, B7 SWIM/RX, B13 SWCLK, B14 SWIO
// for SPI use B6 MISO, B7 MOSI, B13 CLK, B14 CS
/*
var spi=new SPI(); // SPI Flash
var FCS=B14;
FCS.set();
spi.setup({sck:B13,miso:B6,mosi:B7,mode:0});
spi.send([0xab],FCS)
spi.send([0x90,0,0,1,0,0],FCS) // get flash id
spi.send([0x9f,0,0,0],FCS); //get flash id
//spi.send([0xb9],FCS); //put to deep sleep
var W25=require("W25");
w25.getJedec();
var w25=new W25(spi,FCS);
*/
